import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView, TableQuery} from '/~static/lib/client/core/data.js';
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

  }

  async ready() {
    return new Promise(async function(resolve) {
      // fill up on data
      Module.tableStores.table.addView(new TableView({proxy: this.model.tables}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.workspace = params.workspace;
    this.model.app = params.app;
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
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-list');   // page html
let mvc1 = new Table_list('schema-table-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table', title: 'Tables', sections: [section1]});

Module.pages.push(page1);