import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Table_config_index_create extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tableRec = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
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
    this.model.database = params.db;
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;

    this.model.tableRec = await Module.tableStores.table.getOne(this.model.table);

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app, table: this.model.table});
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let current = await Module.tableStores.table.getOne(this.model.table);
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
    let res = await Module.data.table.insertIndex(this.model.table, {index});

    if (res.status == 200) {
      utils.modals.toast('Table', 'Updated', 2000);
   
      this.model.index = {};

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

  breadcrumbGo(ev) {
    Module.pager.go(ev.args[0]);
  }  
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config-index-create');   // page html
let mvc1 = new Table_config_index_create('schema-table-config-index-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/config/index/create', title: 'Tables - Config Index', sections: [section1]});

Module.pages.push(page1);