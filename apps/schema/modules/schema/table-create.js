import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Table_create extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.table = {};
    this.model.workspace = '';
    this.model.app = '';
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

    this.model.table = {apiacl: {one: false, many: false, create: false, update: false, delete: false}};

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app});
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let table = this.model.table.toJSON();

    if (!table.name) {
      this.model.badMessage = 'Please Enter a Table Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    table.workspace = this.model.workspace;
    table.app = this.model.app;
    table.columns = [];
    table.pk = [];
    table.fks = [];
    table.indexes = [];
    table.orderby = [];

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.table.insert(table);

    if (res.status == 200) {
      utils.modals.toast('Table', 'Created', 2000);
   
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
let el1 = document.getElementById('schema-table-create');   // page html
let mvc1 = new Table_create('schema-table-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/create', title: 'Tables - Create', sections: [section1]});

Module.pages.push(page1);