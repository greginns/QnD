import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_config_index_create extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4table = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
    this.model.index = {};

    this.model.badMessage = '';
    this.model.errors = {
      db4table: {},
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

    this.model.db4table = await Module.tableStores.db4table.getOne(this.model.table);
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let current = await Module.tableStores.db4table.getOne(this.model.table);
    let index = this.model.index.toJSON();
    let indexes = current.indexes || [];

    if (!index.name || !index.columns) {
      this.model.badMessage = 'No Name or Columns';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    indexes.push(index);

    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    let res = await Module.tableStores.db4table.update(this.model.table, {indexes});

    if (res.status == 200) {
      utils.modals.toast('Table', 'Updated', 2000);
   
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
let el1 = document.getElementById('schema-table-config-index-create');   // page html
let mvc1 = new Table_config_index_create('schema-table-config-index-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/config/index/create', title: 'Tables - Config Index', sections: [section1]});

Module.pages.push(page1);