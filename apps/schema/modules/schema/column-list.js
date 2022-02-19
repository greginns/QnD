import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Column_list extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.workspace = '';
    this.model.app = '';
    this.model.table = ''
    this.model.columns = [];
  }

  async ready() {
    return new Promise(async function(resolve) {
      // fill up on data
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    super.inView(params);

    this.model.database = params.db;
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app, table: this.model.table});
    this.model.tableRec = await Module.tableStores.table.getOne(this.model.table);
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/column/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let name = this.model.tableRec.columns[idx].name;

    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/column/${name}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let name = this.model.tableRec.columns[idx].name;

    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/column/${name}/delete`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-column-list');   // page html
let mvc1 = new Column_list('schema-column-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/column', title: 'Columns', sections: [section1]});

Module.pages.push(page1);