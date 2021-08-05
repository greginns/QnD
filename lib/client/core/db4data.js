import {App} from '/~static/project/app.js';
import {io} from '/~static/lib/client/core/io.js';

class WSDataComm {
  /*
    Setup WS with server to monitor data changes
    Models are added (and removed) to list
    If WS is connected then server is notified of request
    If not, models are saved up until WS is connected.
    If reconnected, list of models is cycled through notifying server.
  */
  constructor(host) {
    this.host = `wss://${host || location.host}/db4`;
    this.retries = 0;
    this.retryMax = 10;
    this.retryMsecs = 2000;
    this.tableURLs = [];
  }

  start() {
    this._initWS();
  }

  addTable(table) {
    // set list of tables we're following.
    if (this.tableURLs.indexOf(table) > -1 ) return true;

    this.tableURLs.push(table);
    
    if (this.ws) this._subscribeToTableChanges(table);

    return true;
  }

  removeTable(table) {
    let idx = this.tableURLs.indexOf(table);
    
    if (this.ws && idx != -1) {
      this.tableURLs.splice(idx);
      this._unsubscribeToTableChanges(table);
    }
  }

  _subscribeAllTables() {
    for (let table of this.tableURLs) {
      this._subscribeToTableChanges(table);
    }
  }

  _subscribeToTableChanges(table) {
    var msg = JSON.stringify({cat: 'sub', source: 'model', model: table});

    this.ws.send(msg);
  }
  
  _unsubscribeToTableChanges(table) {
    var msg = JSON.stringify({cat: 'unsub', source: 'model', model: table});

    this.ws.send(msg);
  }
  
  _initWS() {
    this.ws = new WebSocket(this.host);

    this.ws.onopen = function() {
      this._subscribeAllTables();
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
    Module.data.'name' = new TableAccess('uuid');
  */
  constructor(uuid) {
    // model or app/model
    this.uuid = uuid
    this.url = `${App.url}/db4/v1/api/` + uuid;
  }

  async getOne(pk, columns) {
    let url = this.url + '/' + encodeURIComponent(pk);
    let params = {};

    if (columns && Array.isArray(columns) && columns.length > 0) {
      params.columns = JSON.stringify(columns);
    }

    return await io.get(params, url);
  }

  async getAll(columns) {
    // gets all records, use wisely
    let url = this.url;
    let params = {};

    if (columns && Array.isArray(columns) && columns.length > 0) {
      params.columns = JSON.stringify(columns);
    }

    return await io.get(params, url);
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
    let ret = await this.getOne('_default', ['*']);

    return (ret.status == 200) ? ret.data : {};
  }

  async insert(obj) {
    return await io.post(obj, this.url);
  }
  
  async update(pk, obj) {
    return await io.put(obj, this.url + '/' + encodeURIComponent(pk));
  }
  
  async delete(pk) {
    return await io.delete({}, this.url + '/' + encodeURIComponent(pk));
  }

  async query({query='', values=[], limit=-1, offset=0} = {}) {
    // run a query
    let opts = {};

    if (query && values.length > 0) {  // make sure where is parameterized
      opts.query = query;
      opts.values = JSON.stringify(values);
    }

    if (limit != -1) opts.limit = limit;
    if (offset != 0) opts.offset = offset;

    return await io.get(opts, this.url + '/query');
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
    let x = new TableStore(accessor: Module.data.contact, safeMode: true);
    x.getAll();
    x.getOne(pk)
    x.insert({})
    x.update(pk, {})
    x.delete(pk)

    x.getMany({filters, columns, limit, offset});
  */
  constructor({accessor='', safemode=true} = {}) {
    this.accessor = accessor;
    this.safemode = safemode;

    this.store = new Map();
    this.views = [];
    this.watchedRecordIDs = new Map();
    this._handleIncoming = this._handleIncoming.bind(this);  // bind now so event handlers get added/removed properly.

    this._addWSListener();
  }

  // io methods
  async getOne(_pk, columns) {
    if (!columns || !Array.isArray(columns) || columns.length == 0) columns = ['*'];

    _pk = "" + _pk;

    if (! (this.store.has(_pk))) {
      let res = await this.accessor.getOne(_pk, columns);
      let row = (res.status == 200) ? res.data : {};

      this._updateStore('+', [row]);
    }
    
    let data = this.store.get(_pk) || {};
    let resp = {};

    for (let field in data) {
      if (field in columns || columns[0] == '*') resp[field] = data[field];
    }

    return resp;
  }

  async getAll(columns) {
    if (!columns || !Array.isArray(columns) || columns.length == 0) columns = ['*'];

    if (this.store.size == 0) {
      let res = await this.accessor.getAll(columns);
      let rows = (res.status == 200) ? res.data : [];

      this._updateStore('=', rows);        
    }

    let data = [...this.store.values()];
    let resp = [];

    for (let row in data) {
      let obj = {};

      for (let field in row) {
        if (field in columns || columns[0] == '*') obj[field] = row[field];
      }

      resp.push(obj);
    }
    
    return resp;
  }
  async getMany({filters={}, columns=['*'], limit=1, offset=0} = {}) {
    // filters: {first: 'greg', last: 'miller'}
    let ret = await this.accessor.getMany({filters, columns, limit, offset});

    if (ret.status == 200) {
      this._updateStore('=', ret.data);
    }
    else if (ret.status == 500) {
      alert(ret.data.errors.message);
      return;
    }

    let data = [...this.store.values()];
    let resp = [];

    for (let row in data) {
      let obj = {};

      for (let field in row) {
        if (field in columns || columns[0] == '*') obj[field] = row[field];
      }

      resp.push(obj);
    }

    return resp;
  }

  async insert(data) {
    let res = await this.accessor.insert(data);

    if (this.safemode) {
      if (res.status == 200) {
        this._updateStore('+', res.data);
      }
    }
    
    return res;
  }
  
  async update(_pk, data) {
    let res = await this.accessor.update(_pk, data);

    if (this.safemode) {
      if (res.status == 200) {
        this._updateStore('*', res.data);
      }
    }
    
    return res;      
  }
  
  async delete(_pk) {
    let res = await this.accessor.delete(_pk);

    _pk = "" + _pk;
    
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
  
  // store/view methods
  _updateStore(action, rows) {
    if (action == '=') this.store.clear();

    // update global store
    for (let row of rows) {
      let pk = "" + row._pk;

      if (action == '-') {
        this.store.delete(pk);
       }
      else {
        this.store.set(pk, row);
      }

      // any watched records involved?
      if (this.watchedRecordIDs.has(pk)) {
        for (let fn of this.watchedRecordIDs.get(pk)) {
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

export {WSDataComm, TableAccess, TableStore, TableView};