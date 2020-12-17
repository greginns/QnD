import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView, TableQuery} from '/~static/lib/client/core/data.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class table_list extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4tables = [];
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
      Module.tableStores.db4table.addView(new TableView({proxy: this.model.db4tables}));

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
    Module.pager.go(`/workspace/${this.model.workspace}/table/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.db4tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/table/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.db4tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/table/${uuid}/delete`);
  }

  tables(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.db4tables[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/table/${uuid}/table`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-list');   // page html
let mvc1 = new table_list('schema-table-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table', title: 'Tables', sections: [section1]});

Module.pages.push(page1);