import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Table_config_index_delete extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.tableRec = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
    this.model.name = '';
    this.model.index = {};
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    super.inView(params);

    this.model.database = params.db;
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;
    this.model.name = params.name;

    this.model.tableRec = await Module.tableStores.table.getOne(this.model.table);

    let indexes = this.model.tableRec.indexes || [];
    
    for (let idx of indexes) {
      if (idx.name == this.model.name) {
        this.model.index = idx;
        break;
      }
    }

    if (Object.keys(this.model.index).length == 0) {
      alert('Invalid Index Name');
      this.gotoList();
    }

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app, table: this.model.table});
  }

  outView() {
    return true;  
  }

  async delete(ev) {
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');
    if (!ret) return;

    let current = await Module.tableStores.table.getOne(this.model.table);
    let index = this.model.index.toJSON();
    let indexes = current.indexes || [];

    for (let idx=0; idx<indexes.length; idx++) {
      if (indexes[idx].name = index.name) {
        indexes.splice(idx, 1);
        break;
      }
    }

    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    let res = await Module.data.table.deleteIndex(this.model.table, index.name);

    if (res.status == 200) {
      utils.modals.toast('Index', 'Deleted', 2000);
   
      this.model.column = {};

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
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config-index-delete');   // page html
let mvc1 = new Table_config_index_delete('schema-table-config-index-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/config/index/:name/delete', title: 'Tables - Config Index', sections: [section1]});

Module.pages.push(page1);