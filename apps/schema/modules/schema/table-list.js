import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView, TableStore} from '/~static/lib/client/core/data.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_list extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tables = [];
    this.model.workspace = '';
    this.model.app = ''

    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };

    this.tableStore;
    this.tableView = new TableView({proxy: this.model.tables});
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let workspace = params.workspace;
    let app = params.app;
    let model = '/schema/table';
    let conditions = {};

    this.model.workspace = workspace;
    this.model.app = app;

    let filters = {app};
    
    conditions[model] = function(rec) {
      return rec.app == app;
    };

    if (this.tableStore) {
      this.tableStore.kill();
    }

    this.tableStore = new TableStore({accessor: Module.data.table, filters, conditions});
    this.tableStore.addView(this.tableView);

    this.tableStore.getMany();
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${uuid}/delete`);
  }

  columns(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${uuid}/column`);
  }

  config(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${uuid}/config`);
  }

  query(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${uuid}/query`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-list');   // page html
let mvc1 = new Table_list('schema-table-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table', title: 'Tables', sections: [section1]});

Module.pages.push(page1);