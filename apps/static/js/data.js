import {io} from '/static/apps/static/js/io.js';

class WSDataComm {
  /*
    
  */
  constructor(app) {
    this.app = app;  // 'test'
    this.host = (location.protocol == 'https:') ? 'wss:' : 'ws:';
    this.host += `//${location.host}/${app}`;
    this.retries = 0;
    this.retryMax = 10;
    this.retryMsecs = 2000;
    this.urls = [];
  }

  start() {
    this._initWS();
  }

  addURL(url) {
    // set list of urls we're following.
    let urla = url.split('/');  // '/test/testdata'
    
    if (urla.length < 2 || urla[1] != this.app) return false;
    
    this.urls.push(url);
    
    if (this.ws) this._subscribeToURLChanges(url);
  }

  removeURL(url) {
    let idx = this.urls.indexOf(url);
    
    if (this.ws && idx != -1) {
      this.urls.splice(idx);
      this._unsubscribeToURLChanges(url);
    }
  }

  _subscribeAllURLs() {
    for (let url of this.urls) {
      this._subscribeToURLChanges(url);
    }
  }

  _subscribeToURLChanges(url) {
    var msg = JSON.stringify({cat: 'sub', source: 'url', url});

    this.ws.send(msg);
  }
  
  _unsubscribeToURLChanges(url) {
    var msg = JSON.stringify({cat: 'unsub', source: 'url', url});

    this.ws.send(msg);
  }
  
  _initWS() {
    this.ws = new WebSocket(this.host);

    this.ws.onopen = function() {
      this._subscribeAllURLs();
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
    var data = JSON.parse(text);

    switch(data.cat) {
      case 'pub':
        switch(data.source) {
          case 'url':
            window.dispatchEvent(new CustomEvent(data.url, {bubbles: false, detail: {action: data.action, rows: data.rows}}));
            break;
        }

      break;
    }
  }
};

/* ============================ Table/View Stores ========================== */
class TableStore {
  /*
    getting data: check local store first, then get from server.
    saving/deleting data: send to server, wait for WS response to update local store.
    safemode: immediately updates store and waits for WS. Double updates
  */
  constructor({url='', safemode=true}={}) {
    this.url = url;
    this.safemode = safemode;
    this.store = new Map();
    this.views = [];
    
    window.addEventListener(this.url, this._handleIncoming.bind(this));
  }

  async getAll() {
    if (this.store.size == 0) {
      let res = await io.get({}, this.url);
      let rows = (res.status == 200) ? res.data : [];
      
      this._updateStore('=', rows);        
    }
    
    return [...this.store.values()];
  }

  async getOne(_pk) {
    if (!this.store.has(_pk)) {
      let res = await io.get({}, this.url + '/' + _pk);
      let rows = (res.status == 200) ? res.data : [];
    
      this._updateStore('+', rows);
    }
    
    return this.store.get(_pk);
  }
  
  async insert(data) {
    let res = await io.post(data, this.url);
    
    if (this.safemode) {
      if (res.status == 200) {
        this._updateStore('+', res.data);
      }
    }
    
    return res;
  }
  
  async update(_pk, data) {
    let res = await io.put(data, this.url + '/' + _pk);
    
    if (this.safemode) {
      if (res.status == 200) {
        this._updateStore('*', res.data);
      }
    }
    
    return res;      
  }
  
  async delete(_pk) {
    let res = await io.delete({}, this.url + '/' + _pk);
    
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
  
  stop() {
    window.removeEventListener(this.url, this._handleIncoming.bind(this));
  }
  
  _handleIncoming(msg) {
    this._updateStore(msg.detail.action, msg.detail.rows);
  }

  _updateStore(action, rows) {
    if (action == '=') this.store.clear();
    
    for (let row of rows) {
      (action == '-') ? this.store.delete(row._pk) : this.store.set(row._pk, row);
    }

    this._processViews(action, rows);
  }
  
  _processViews(action, rows) {
    for (let view of this.views) {
      view._updateView(action, rows);
    }
  }
}
  
class TableView {
  /*
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
    if (action == '*') {
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
        
        if (pidx > -1) this.proxy[pidx] = rows[idx];
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

export {WSDataComm, TableStore, TableView};