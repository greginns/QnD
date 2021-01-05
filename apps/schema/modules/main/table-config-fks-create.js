import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_config_fks_create extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4table = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
    this.model.fk = {};

    this.model.apps = [];
    this.model.foreignTables = [];
    this.model.sourceTable = {};
    this.model.foreignTable = {};
    this.model.link = {};

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

    this.model.sourceTable = await Module.tableStores.db4table.getOne(this.model.table);
    this.model.apps = await Module.tableStores.db4app.getAll();
  }

  outView() {
    return true;  
  }

  addPair() {
    let link = this.model.link.toJSON();

    if (!link.source || !link.target) {
      this.model.badMessage = 'Both a Source and Target Column are needed';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    this.model.fk.links = this.model.fk.links || [];
    this.model.fk.links.push(link);

    this.model.link = {source: '', target: ''};
  }

  removePair(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');

    this.model.fk.links.splice(idx,1);
  }

  async save(ev) {
    let current = await Module.tableStores.db4table.getOne(this.model.table);
    let fk = this.model.fk.toJSON();
    let fks = current.fks || [];

    if (!fk.name || !fk.links || fk.links.length == 0) {
      this.model.badMessage = 'No Name or Columns';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    fks.push(fk);

    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    let res = await Module.tableStores.db4table.update(this.model.table, {fks});

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

  async getForeignTables() {
    this.model.foreignTables = await Module.tableStores.db4table.getAll();
  }

  async getForeignColumns() {
    let ft = this.model.fk.ftable;

    this.model.foreignTable = await Module.tableStores.db4table.getOne(ft);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config-fks-create');   // page html
let mvc1 = new Table_config_fks_create('schema-table-config-fks-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/config/fks/create', title: 'Tables - Config Index', sections: [section1]});

Module.pages.push(page1);