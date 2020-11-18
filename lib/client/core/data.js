import {io} from '/~static/lib/client/core/io.js';

class WSDataComm {
  /*
    Setup WS with server to monitor data changes
    Models are added (and removed) to list
    If WS is connected then server is notified of request
    If not, models are saved up until WS is connected.
    If reconnected, list of models is cycled through notifying server.
  */
  constructor(app) {
    this.app = app;  // 'test'
    this.host = (location.protocol == 'https:') ? 'wss:' : 'ws:';
    this.host += `//${location.host}/${app}`;
    this.retries = 0;
    this.retryMax = 10;
    this.retryMsecs = 2000;
    this.modelURLs = [];
  }

  start() {
    this._initWS();
  }

  addModel(model) {
    // set list of models we're following.
    let modela = model.split('/');  // '/test/testdata'
    
    if (modela.length < 2 || modela[1] != this.app) return false;
    
    this.modelURLs.push(model);
    
    if (this.ws) this._subscribeToModelChanges(model);
  }

  removeModel(model) {
    let idx = this.modelURLs.indexOf(model);
    
    if (this.ws && idx != -1) {
      this.modelURLs.splice(idx);
      this._unsubscribeToModelChanges(model);
    }
  }

  _subscribeAllModels() {
    for (let model of this.modelURLs) {
      this._subscribeToModelChanges(model);
    }
  }

  _subscribeToModelChanges(model) {
    var msg = JSON.stringify({cat: 'sub', source: 'model', model});

    this.ws.send(msg);
  }
  
  _unsubscribeToModelChanges(model) {
    var msg = JSON.stringify({cat: 'unsub', source: 'model', model});

    this.ws.send(msg);
  }
  
  _initWS() {
    this.ws = new WebSocket(this.host);

    this.ws.onopen = function() {
      this._subscribeAllModels();
      this.retries = 0;
    }.bind(this);

    this.ws.onmessage = function(ev) {
      this._handleIncomingMessage(ev.data);
    }.bind(this);

    this.ws.onerror = function(ev) {
      console.log(ev)
    }.bind(this);

    this.ws.onclose = function(ev) {
      console.log(ev);

      setTimeout(function() {
        this.retries++;

        if (this.retries <= this.retryMax) {
          console.log('retrying WS connection ', this.retries)
          this._initWS();
        }
        else {
          alert('Connection to server has been lost.  Click OK to reload this page');
          window.location.reload();
        }
      }.bind(this), this.retryMsecs)
    }.bind(this)
  }

  _handleIncomingMessage(text) {
    let data = JSON.parse(text);

    switch(data.cat) {
      case 'pub':
        switch(data.source) {
          case 'model':
            window.dispatchEvent(new CustomEvent('model.' + data.model, {bubbles: false, detail: {action: data.action, rows: data.rows}}));
            break;
        }

      break;
    }
  }
};

/* ============================ Table Access ========================== */
class TableAccess {
  /*
    Setup physical access to tables.
    Client interacting with server
  */
  constructor({modelName, url=''} = {}) {
    this.modelName = modelName;
    this.url = url;
  }

  async getAll() {
    // gets all records, use wisely
    return await io.get({}, this.url);
  }

  async getMany({where='', values=[], filters={}, fields=[], limit=-1, offset=0} = {}) {
    // gets a subset of records.
    let opts = {};

    if (where && where.indexOf('$1') > -1 && values.length > 0) {  // make sure where is parameterized
      opts.where = where;
      opts.values = JSON.stringify(values);
    }
    else {
      if (Object.keys(filters).length > 0) opts.filters = JSON.stringify(filters);  
    }

    if (fields.length > 0) opts.fields = JSON.stringify(fields);
    if (limit != -1) opts.limit = limit;
    if (offset != 0) opts.offset = offset;

    return await io.get(opts, this.url);
  }

  async getOne(pk) {
    return await io.get({}, this.url + '/' + encodeURIComponent(pk));
  }

  async getDefault() {
    let ret = await this.getOne('_default');

    return (ret.status == 200) ? ret.data : {};
  }

  async insert(obj) {
    let rec = {};
    rec[this.modelName] = obj;

    return await io.post(rec, this.url);
  }
  
  async update(pk, obj) {
    let rec = {};
    rec[this.modelName] = obj;

    return await io.put(rec, this.url + '/' + encodeURIComponent(pk));
  }
  
  async delete(pk) {
    return await io.delete({}, this.url + '/' + encodeURIComponent(pk));
  }

  async query({query='', values=[]} = {}) {
    // run a query
    let opts = {};

    if (query && values.length > 0) {  // make sure where is parameterized
      opts.query = query;
      opts.values = JSON.stringify(values);
    }

    return await io.get(opts, this.url + '/query');
  }
}

class TableQuery {
  // Class to handle a subset of records, and what to do if anything changes forcing a re-query.
  // Can be a query, where clause, or filters.
  // ie have a subset based on a search and then one of the searched records changes, or something added/deleted.
  // when a change happens the entire query gets re-executed.
  // query 'where' conditions and individual conditions should be the same.

  // **** NEED multiple conditions per model {model: {first: 'greg', last: 'miller'}}
  // Future {first__EQ, last__LT}
  constructor({accessor='', query='', where='', filters = {}, values=[], conditions={}} = {}) {
    // conditions: {model: {if: if stmt function}}
    this.accessor = accessor;
    this.query = query;
    this.where = where;
    this.filters = filters;
    this.values = values;
    this.conditions = conditions;
    this.store = new Map();
    this.views = [];

    this.setupConditions();
    this.queryRun();
  }

  setupConditions() {
    for (let model in this.conditions) {
      let condition = this.conditions[model];

      let func = function(msg) {
        // go through all rows, regardless of action.
        // if any record passes the test then re-execute the query
        let passes = false;

        for (let row of msg.detail.rows) {
          if (condition(row)) {
            passes = true;
            break;
          }
        }

        if (passes) this.queryRun();
      }.bind(this);

      window.addEventListener('model.' + model, func);
      this.conditions[model].func = func;
    }
  }

  removeConditions() {
    for (let model in this.conditions) {
      window.removeEventListener('model.' + model, this.conditions[model].func);
    }
  }

  async queryRun() {
    let ret = 
      (this.where || this.filters) 
      ? (this.where) ? await this.accessor.getMany({where: this.where, values: this.values}) : await this.accessor.getMany({filters: this.filters})
      : await this.accessor.query({query: this.query, values: this.values});

    if (ret.status == 200) {
      this._updateStore('=', ret.data);
    }
    else if (ret.status == 500) {
      alert(ret.data.errors.message);
    }
  }

  addView(view) {
    this.views.push(view);
    
    view._updateView('=', [...this.store.values()]);
    
    return this.views.length-1;
  }
  
  removeView(idx) {
    this.views.splice(idx,1);
  }
  
  _updateStore(rows) {
    this.store.clear();

    // update global store
    for (let row of rows) {
      this.store.set(row._pk, row);
    }

    this._processViews('=', rows);
  }
  
  // update page tableviews
  _processViews(action, rows) {
    for (let view of this.views) {
      view._updateView(action, rows);
    }
  }

}

class TableStore {
  /*
    Holds the data, updates stored data from ws events (or http replies, if safemode)
    getting data: check local store first, then get from server.
    saving/deleting data: send to server, wait for WS response to update local store.
    safemode: immediately updates store and waits for WS. Double updates
  */
  constructor({accessor='', model, safemode=true} = {}) {
    this.accessor = accessor;
    this.model = model;
    this.safemode = safemode;
    this.store = new Map();
    this.views = [];
    this.watchedRecordIDs = new Map();
    this._handleIncoming = this._handleIncoming.bind(this);  // bind now so event handlers get added/removed properly.

    this.addWSListener();
  }

  addWSListener() {
    // add listener to WS model change events
    window.addEventListener('model.' + this.model, this._handleIncoming);
  }

  async getAll() {
    if (this.store.size == 0) {
      let res = await this.accessor.getAll();
      let rows = (res.status == 200) ? res.data : [];

      this._updateStore('=', rows);        
    }
    
    return [...this.store.values()];
  }

  async getOne(_pk) {
    if (!this.store.has(_pk)) {
      let res = await this.accessor.getOne(_pk);
      let row = (res.status == 200) ? res.data : {};

      this._updateStore('+', [row]);
    }
    
    return this.store.get(_pk) || {};
  }

  async insert(data) {
    let res = await this.accessor.insert(data);

    if (this.safemode) {
      if (res.status == 200) {
        this._updateStore('+', [res.data]);
      }
    }
    
    return res;
  }
  
  async update(_pk, data) {
    let res = await this.accessor.update(_pk, data);
    
    if (this.safemode) {
      if (res.status == 200) {
        this._updateStore('*', [res.data]);
      }
    }
    
    return res;      
  }
  
  async delete(_pk) {
    let res = await this.accessor.delete(_pk);
    
    if (this.safemode) {
      if (res.status == 200) {
        this._updateStore('-', [{_pk}]);
      }
    }
    
    return res;      
  }
  
  addView(view) {
    this.views.push(view);
    
    view._updateView('=', [...this.store.values()]);
    
    return this.views.length-1;
  }
  
  removeView(idx) {
    this.views.splice(idx,1);
  }

  addWatchedRecord(pk, fn) {
    // setup array of functions 'watching' a specfic record pk
    if (!this.watchedRecordIDs.has(pk)) this.watchedRecordIDs.set(pk, []);

    let fns = this.watchedRecordIDs.get(pk);

    fns.push(fn);

    this.watchedRecordIDs.set(pk, fns);
  }

  removeWatchedRecord(pk, fn) {
    let fns = this.watchedRecordIDs.get(pk);
    let idx = -1;

    for (let fx of fns) {
      idx++;

      if (fx == fn) {
        fns.splice(idx,1);
        break;
      }
    }

    this.watchedRecordIDs.set(pk, fns);
  }
  
  stop() {
    window.removeEventListener('model.' + this.modelURL, this._handleIncoming);
  }
  
  _handleIncoming(msg) {
    this._updateStore(msg.detail.action, msg.detail.rows);
  }

  _updateStore(action, rows) {
    if (action == '=') this.store.clear();

    // update global store
    for (let row of rows) {
      if (action == '-') {
        this.store.delete(row._pk);
       }
      else {
        this.store.set(row._pk, row);
      }

      // any watched records involved?
      if (this.watchedRecordIDs.has(row._pk)) {
        for (let fn of this.watchedRecordIDs.get(row._pk)) {
          fn(row, action);
        }
      }
    }

    this._processViews(action, rows);
  }
  
  // update page tableviews
  _processViews(action, rows) {
    for (let view of this.views) {
      view._updateView(action, rows);
    }
  }
}
  
class TableView {
  /*
    How/what to see from data.
    To get access to a TableStore
    To provide customized local data
    TableViews can be filtered and sorted
  */
  constructor({proxy = [], filterFunc = function(){return true}, sortFunc = undefined} = {}) {
    this.proxy = proxy;
    this.filterFunc = filterFunc;
    this.sortFunc = sortFunc;
  }
  
  _updateView(action, rows) {
    // if 'new', clear proxy
    if (action == '=') {
      this.proxy.length = 0;
    }
    
    // if replacements, then replace in proxy
    // just in case, keep leftovers to add
    if (action == '*' || action == '+') {
      let leftovers = [], ppks = [], rpks = [];
      
      // make two lists of pks, to compare.  Faster than outer/inner iteration
      for (let r of rows) {
        rpks.push(r._pk);
      }
      
      for (let p of this.proxy) {
        ppks.push(p._pk);
      }
      
      for (let idx=0; idx<rpks.length; idx++) {
        let pidx = ppks.indexOf(rpks[idx]);
        
        if (pidx > -1) {
          this.proxy[pidx] = rows[idx];
        }
        else leftovers.push(rows[idx]);
      }
      
      rows = leftovers.slice(0);
    }

    // we may not want them all
    let rowsToProcess = (action == '-') ? rows : rows.filter(this.filterFunc);
    
    // start updating proxy
    let pks = {}, plen, idx;              

    for (let row of rowsToProcess) {
      pks[row._pk] = row;
    }

    if (action == '-') {
      // removing
      // cycle through proxy and splice to remove.
      // removing changes length, don't want to go beyond current length
      idx = 0;
      plen = this.proxy.length;
      
      while (idx < plen) {
        if (this.proxy[idx]._pk in pks) {
          this.proxy.splice(idx, 1);
          plen--;
          idx--;
        }
        
        idx++;
      }
    }
    else {
      // add/changing.  Complexity is we don't know the sort order.
      // 1. copy proxy data to a new array
      // 2. add new rows
      // 3. sort it
      // 4. figure out where new entries went
      // it would be easier to add to the proxy, then sort the proxy but then it's replaced 100% each time
      let temp = JSON.parse(JSON.stringify(this.proxy));

      temp = temp.concat(rows)
      temp.sort(this.sortFunc);

      // now we know where new entries are to go.
      for (idx=0; idx<temp.length; idx++) {
        if (temp[idx]._pk in pks) {  // one of the new ones
          this.proxy.splice(idx, 0, pks[temp[idx]._pk]);
        }
      }
    }
  }
}

export {WSDataComm, TableAccess, TableQuery, TableStore, TableView};