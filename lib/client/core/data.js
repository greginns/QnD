import {io} from '/~static/lib/client/core/io.js';

class WSDataComm {
  /*
    Setup WS with server to monitor data changes
    Models are added (and removed) to list
    If WS is connected then server is notified of request
    If not, models are saved up until WS is connected.
    If reconnected, list of models is cycled through notifying server.
  */
  constructor(app, host) {
    this.app = app;  // 'test'
    this.host = `wss://${host || location.host}/${app}`;
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
    if (this.modelURLs.indexOf(model) > -1 ) return true;

    this.modelURLs.push(model);
    
    if (this.ws) this._subscribeToModelChanges(model);

    return true;
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
      //console.log(ev);

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
    Module.data.database = new TableAccess({modelName: 'database', url: `/schema/v1/database`});
  */
  constructor({modelName, url=''} = {}) {
    // model or app/model
    this.modelName = (modelName.indexOf('/') > -1) ? modelName.split('/')[1] : modelName;
    this.url = url;
  }

  makeURLComponent(pk) {
    if (!Array.isArray(pk)) return '/' + encodeURIComponent(pk);

    let url = ''

    for (let p of pk) {
      url = url + '/' + encodeURIComponent(p);
    }

    return url;    
  }

  async getOne(pk) {
    return await io.get({}, this.url + this.makeURLComponent(pk));
  }

  async getAll() {
    // gets all records, use wisely
    return await io.get({}, this.url);
  }

  async getMany({where='', values=[], filters={}, columns=[], limit=-1, offset=0} = {}) {
    // gets a subset of records.
    let opts = {};

    if (where && where.indexOf('$1') > -1 && values.length > 0) {  // make sure where is parameterized
      opts.where = where;
      opts.values = JSON.stringify(values);
    }
    else {
      if (Object.keys(filters).length > 0) opts.filters = JSON.stringify(filters);  
    }

    if (columns.length > 0) opts.columns = JSON.stringify(columns);
    if (limit != -1) opts.limit = limit;
    if (offset != 0) opts.offset = offset;

    return await io.get(opts, this.url);
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

    return await io.put(rec, this.url + this.makeURLComponent(pk));
  }
  
  async delete(pk) {
    return await io.delete({}, this.url + this.makeURLComponent(pk));
  }

  async query({query='', values=[], limit=-1, offset=0} = {}) {
    // run a query
    let opts = {};

    if (query) { 
      opts.query = query;
      opts.values = JSON.stringify(values);
    }

    if (limit != -1) opts.limit = limit;
    if (offset != 0) opts.offset = offset;

    return await io.get(opts, this.url + '/query');
  }

  async storedQuery({qid='', values=[], limit=-1, offset=0} = {}) {
    // run a query
    let opts = {};

    opts.values = JSON.stringify(values);

    if (limit != -1) opts.limit = limit;
    if (offset != 0) opts.offset = offset;

    return await io.get(opts, this.url + '/query/' + qid);
  }

}

class TableStore {
  /*
    Gets and updates data.
    Updates stored data from ws events (or http replies, if safemode)
    getting data: check local store first, then get from server.
    saving/deleting data: send to server, wait for WS response to update local store.
    safemode: immediately updates store and waits for WS. Double updates
  */
  /* USAGE:
    let x = new TableStore(accessor: Module.data.contact, model: '/contacts/contact', safeMode: true);
    x.getAll();

    let x = new TableStore(accessor: Module.data.contact, query: 'xyz', values: [], conditions: {});
    x.getMany();
    
    let x = new TableStore(accessor: Module.data.contact, where: 'xyz', values: [], conditions: {});
    x.getMany();

    let x = new TableStore(accessor: Module.data.contact, filters: {}, conditions: {});
    x.getMany();

    x.getOne(pk)
    x.insert({})
    x.update(pk, {})
    x.delete(pk)

    conditions: {'/contacts/contact': func, ...}
  */
  constructor({accessor='', model='', safemode=true, query='', where='', values=[], filters={}, limit=-1, offset=0, conditions={}} = {}) {
    // model or one of the query types below
    // query: {contacts: {columns: ['*'], where: first=$1 AND last = $2, innerJoin: states}} 
    // where: "contact.first = '$1' AND contact.last = '$2'"
    // values: ['Greg', 'Miller']  used by query and where
    // filters: {first: 'greg', last: 'miller'}
    // conditions: {model: function, returns T|F}  if (row.first == 'greg' && row.last == 'miller')  
    // query involves multiple files so if record passes tests in conditions then query gets re-executed. 
    //  that's in case record only passed the individual test.  It may not pass the overall query
    // where/filters is on one file only so can act the same as a non-query/where setup 
    
    // model mode updates store right away
    // query-ish mode re-executes query, replaces store.
    this.accessor = accessor;
    this.safemode = safemode;

    this.model = model;
    this.query = query;
    this.where = where;
    this.values = values;
    this.filters = filters;
    this.limit = limit;
    this.offset = offset;
    this.conditions = conditions;    
    this.isQuery = (model == '');

    this.store = new Map();
    this.views = [];
    this.watchedRecordIDs = new Map();
    this._handleIncoming = this._handleIncoming.bind(this);  // bind now so event handlers get added/removed properly.

    this.init();
  }

  init() {
    if (this.isQuery) {
      if (this.query) {
        this._addConditionsQuery();
      }
      else {
        this._addConditionsFilters();
      }
    }
    else {
      // model, so add listener right away
      this._addWSListener();
    }
  }

  kill() {
    if (this.isQuery) {
      this._removeConditions();
    }
    else {
      // model, so remove listener right away
      this._removeWSListener();
    }
  }

  redo({model='', query='', where='', values=[], filters = {}, limit=-1, offset=0, conditions={}} = {}) {
    // keep same tableStore but update it's basis.  
    // mostly to redo the conditions.
    this.kill();  // undo any previous version

    this.model = model;
    this.query = query;
    this.where = where;
    this.values = values;
    this.filters = filters;
    this.limit = limit;
    this.offset = offset;
    this.conditions = conditions;   
    this.isQuery = (model == '');

    // clear data store
    this._updateStore('=', []);

    // setup new version
    this.init();
  }

  // io methods
  async getAll() {
    if (this.store.size == 0) {
      let res = await this.accessor.getAll();
      let rows = (res.status == 200) ? res.data : [];

      this._updateStore('=', rows);        
    }

    return [...this.store.values()];
  }

  async getMany() {
    let ret;

    if (this.where) {
      ret = await this.accessor.getMany({where: this.where, values: this.values, limit: this.limit, offset: this.offset});
    }
    else if (this.query) {
      ret = await this.accessor.query({query: this.query, values: this.values, limit: this.limit, offset: this.offset});
    }
    else {
      ret = await this.accessor.getMany({filters: this.filters, limit: this.limit, offset: this.offset});
    }

    if (ret.status == 200) {
      this._updateStore('=', ret.data);
    }
    else if (ret.status == 500) {
      alert(ret.data.errors.message);
    }
  }

  async getOne(_pk) {
    let row = {};

    if (!this.store.has(_pk)) {
      let res = await this.accessor.getOne(_pk);

      if (res.status == 200) {
        row = res.data;
        this._updateStore('+', [row]);
      }
    }
    else {
      row = Object.assign({}, this.store.get(_pk));
    }
    
    return row;  // return back copy, otherwise data store inherits any changes via object reference
  }

  async getDefault() {
    // don't save in store as it's not a real record
    return await this.accessor.getDefault();
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

  // view methods
  addView(view) {
    this.views.push(view);

    view._updateView('=', [...this.store.values()]);

    return this.views.length-1;
  }
  
  removeView(idx) {
    this.views.splice(idx,1);
  }

  // watched record methods
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

  // model handler methods
  _addWSListener() {
    // add listener to WS model change events
    window.addEventListener('model.' + this.model, this._handleIncoming);
  }
  
  _removeWSListener() {
    window.removeEventListener('model.' + this.model, this._handleIncoming);
  }
  
  _handleIncoming(msg) {
    this._updateStore(msg.detail.action, msg.detail.rows);
  }

  // query-ish methods
  _addConditionsQuery() {
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

        if (passes) this.getMany();
      }.bind(this);

      window.addEventListener('model.' + model, func);
      this.conditions[model].func = func;  // store for removal later
    }
  }

  _addConditionsFilters() {
    // should really only be one condition.
    for (let model in this.conditions) {
      let condition = this.conditions[model];

      let func = function(msg) {
        // go through all rows, regardless of action.
        // accumulate all records that pass, then update store
        let accum = [];

        for (let row of msg.detail.rows) {
          if (condition(row)) {
            accum.push(row);
          }
        }

        if (accum.length > 0) {
          this._updateStore(msg.detail.action, accum);
        }
      }.bind(this);

      window.addEventListener('model.' + model, func);
      this.conditions[model].func = func;  // store for removal later
    }
  }

  _removeConditions() {
    for (let model in this.conditions) {
      window.removeEventListener('model.' + model, this.conditions[model].func);
    }
  }
  
  // store/view methods
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
  constructor({proxy = [], filterFunc = function(){return true}, sortFunc = undefined, notifyFunc = undefined} = {}) {
    this.proxy = proxy;
    this.filterFunc = filterFunc;
    this.sortFunc = sortFunc;
    this.notifyFunc = notifyFunc;
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

    if (action == '=') {
      if (this.sortFunc) rowsToProcess.sort(this.sortFunc);

      this.proxy.splice(0, 0, ...rowsToProcess);  // Don't do this as this.proxy = rowsToProcess as the proxy gets changed to an array and not a proxy
    }
    else {
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
        if (this.sortFunc) temp.sort(this.sortFunc);

        // now we know where new entries are to go.
        for (idx=0; idx<temp.length; idx++) {
          if (temp[idx]._pk in pks) {  // one of the new ones
            this.proxy.splice(idx, 0, pks[temp[idx]._pk]);
          }
        }
      }
    }

    if (this.notifyFunc) this.notifyFunc(this.proxy);
  }
}

class TableQuery {
  // Class to handle a subset of records, and what to do if anything changes forcing a re-query.
  // Basically same as a TableStore but for a subset of records.
  // Can be a query, where clause, or filters.
  // ie have a subset based on a search and then one of the searched records changes, or something added/deleted.
  // when a change happens the entire query gets re-executed.
  // query or 'where' conditions or filters, and individual conditions should be the same.

  constructor({accessor='', query='', where='', filters = {}, values=[], conditions={}} = {}) {
    // query: {contacts: {columns: ['*'], where: xx, innerJoin: states}} 
    // where: "contact.first = 'greg' AND contact.last = 'miller'"
    // filters: {first: 'greg', last: 'miller'}
    // conditions: {model: function, returns T|F}  if (row.first == 'greg' && row.last == 'miller')
    this.accessor = accessor;
    this.query = query;
    this.where = where;
    this.filters = filters;
    this.values = values;
    this.conditions = conditions;
    this.store = new Map();
    this.views = [];
console.error('DO NOT USE THIS')
greg()
    this.setupConditions();
    this.getRecords();
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

        if (passes) this.getRecords();
      }.bind(this);

      window.addEventListener('model.' + model, func);
      this.conditions[model].func = func;
    }
  }

  kill() {
    this.removeConditions();
  }

  removeConditions() {
    for (let model in this.conditions) {
      window.removeEventListener('model.' + model, this.conditions[model].func);
    }
  }

  async getRecords() {
    let ret;
console.log(this.where, Object.keys(this.filters).length>0, this.values, this.query)
    if (this.where || Object.keys(this.filters).length>0) {
      if (this.where) {
        ret = await this.accessor.getMany({where: this.where, values: this.values});
      }
      else {
        ret = await this.accessor.getMany({filters: this.filters});
      }
    }
    else {
      ret = await this.accessor.query({query: this.query, values: this.values});
    }

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

class Db4Interface {
  constructor() {
    this.wsApps = new Set();
    this.tableAccess = new Set();
    this.tableStores = new Set();
  }

  createWSDataComm(app, host, model) {
    if (!this.wsApps.has(app)) {
      let ws = new WSDataComm(app, host);

      this.wsApps.set(app, ws);
    }

    ws.addModel(model);
  }

  createTableAccess(model, url) {
    if (!this.tableAccess.has(model)) {
      this.tableAccess.set(model, new TableAccess({model, url}));
    }
  }

  createTableStore({model='', safemode=true, query='', where='', values=[], filters={}, limit=-1, offset=0, conditions={}} = {}) {
    // model = app/model
    if (!this.tableAccess(model).has(model)) {
      console.error(`${model} has no table access defined`);
      return;
    }

    if (!this.tableStores.has(model)) {
      let ts = new TableStore({accessor: this.tableAccess(model).get(model), model, safemode, query, where, values, filters, limit, offset, conditions});

      this.tableStores.set(model, ts);
    }
    else {
      this.tableStores.get(model).redo({model, query, where, values, filters, limit, offset, conditions});
    }
  }
}

export {WSDataComm, TableAccess, TableStore, TableView, Db4Interface};