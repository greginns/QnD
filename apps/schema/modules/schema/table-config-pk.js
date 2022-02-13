import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Table_config_pk extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tableRec = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';

    this.model.badMessage = '';
    this.model.errors = {
      table: {},
      message: ''
    };

    this.model.order = [];
    this.model.orderList = [];
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.database = params.db;
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;

    this.model.tableRec = await Module.tableStores.table.getOne(this.model.table);
    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app, table: this.model.table});

    this.buildOrderList();
    this.setPks();
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let diffs = {};
    let pks = this.gatherPKs();

    let current = await Module.tableStores.table.getOne(this.model.table);

    if (this.comparePKs(pks, current.pks)) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }
    
    diffs.pks = pks;
    
    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    let res = await Module.data.table.updatePK(this.model.table, diffs);

    if (res.status == 200) {
      utils.modals.toast('Table', 'Updated', 2000);
   
      this.model.tableRec = {};

      this.gotoList();
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  cancel() {
    this.gotoList();
  }

  gotoList() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config`);
  }

  setPks() {
    let pks = this.model.tableRec.pks.toJSON();
    let cols = this.model.tableRec.columns.toJSON();
    let order = new Array(cols.length).fill(0);
    let idx = 0;

    for (let pk of pks) {
      idx++;

      let colno = -1;
      for (let col of cols) {
        colno++;

        if (col.name == pk) {
          order[colno] = idx;
        }
      }
    }
console.log(order)
    this.model.order = order;
  }

  gatherPKs() {
    let cols = this.model.tableRec.columns.toJSON();
    let order = this.model.order.toJSON();
    let used = new Array(cols.length+1).fill(false);
    let max = 0;
    let pks = [];

    // check for dupes
    for (let o of order) {
      if (used[o]) {
        alert(o + ' already taken');
        return false;
      }

      if (o != 0) used[o] = true;
      max = Math.max(max, o);
    }

    // check for gaps
    if (!used[1]) {
      alert('Order #1 not used');
      return false;
    }

    for (let i=2; i<cols.length; i++) {
      if (used[i] && !used[i-1]) {
        alert('Order #' + (i-1) + ' not used');
        return false;
      }
    }

    // build list
    for (let m=1; m<max+1; m++) {
      let idx = -1;

      for (let o of order) {
        idx++;

        if (m == o) pks.push(cols[idx].name);
      }
    }

    return pks;
  }

  comparePKs(now, old) {
    if (now.length != old.length) return false;
    
    for (let idx=0; idx<now.length; idx++) {
      if (now[idx] != old[idx]) return false;
    }

    return true;
  }

  buildOrderList() {
    let list = [{text: '-', value: '0'}];
    let order = [];
    let max = this.model.tableRec.columns.length;

    for (let i=1; i<=max; i++) {
      list.push({text: String(i), value: String(i)});
      order.push('0');
    }

    this.model.orderList = list;
    this.model.order = order;
  }

  breadcrumbGo(ev) {
    Module.pager.go(ev.args[0]);
  }  
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config-pk');   // page html
let mvc1 = new Table_config_pk('schema-table-config-pk-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/config/pk/update', title: 'Tables - Config PK', sections: [section1]});

Module.pages.push(page1);