import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';

class Table_update extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.table = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.zaps = [];
    this.model.true = true;

    this.zapStore;
    this.zapView = new TableView({proxy: this.model.zaps});

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    super.inView(params)

    this.model.database = params.db;
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;

    if (!this.model.workspace || !this.model.app || !this.model.table) this.gotoList();

    let res = await Module.tableStores.table.getOne(this.model.table);

    if (Object.keys(res).length > 0) {
      if (!('zap' in res) || !res.zap) res.zap = {'create': '', 'update': '', delete: ''};
      this.model.table = res;
      this.origTable = res;
    }
    else {
      alert('Missing Workspace/App/Table');

      this.gotoList();
    }

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app});

    // get zapsubs
    let model = '/schema/zapsub';
    let conditions = {};

    let filters = {};
    
    conditions[model] = function(rec) {
      return true;
    };

    if (this.zapStore) {
      this.zapStore.kill();
    }

    this.zapStore = new TableStore({accessor: Module.data.zapsub, filters, conditions});
    this.zapStore.addView(this.zapView);

    this.zapStore.getMany();    
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let table = this.model.table.toJSON();
    let diffs = utils.object.diff(this.origTable, table);

    if (Object.keys(diffs).length == 0) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }
    
    if (!table.name) {
      this.model.badMessage = 'Please Enter a Table Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = await Module.tableStores.table.update(table.id, diffs);

    if (res.status == 200) {
      utils.modals.toast('Table', 'Updated', 2000);
   
      this.model.table.name = '';
      this.model.table.desc = '';
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
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-update');   // page html
let mvc1 = new Table_update('schema-table-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/update', title: 'Table - Update', sections: [section1]});

Module.pages.push(page1);