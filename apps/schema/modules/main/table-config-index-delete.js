import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_config_index_delete extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.table = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
    this.model.name = '';
    this.model.index = {};

    this.model.badMessage = '';
    this.model.errors = {
      table: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;
    this.model.name = params.name;

    this.model.table = await Module.tableStores.table.getOne(this.model.table);

    let indexes = this.model.table.indexes || [];
    
    for (let idx of indexes) {
      if (idx.name == this.model.name) {
        this.model.index = idx;
        break;
      }
    }

    if (!this.model.index) {
      alert('Invalid Index Name');
      this.gotoList();
    }

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
    let res = await Module.tableStores.table.update(this.model.table, {indexes});

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
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config-index-delete');   // page html
let mvc1 = new Table_config_index_delete('schema-table-config-index-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/config/index/:name/delete', title: 'Tables - Config Index', sections: [section1]});

Module.pages.push(page1);