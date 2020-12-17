import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView, TableQuery} from '/~static/lib/client/core/data.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class App_list extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4apps = [];
    this.workspace = '';

    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      // fill up on data
      Module.tableStores.db4app.addView(new TableView({proxy: this.model.db4apps}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.workspace = params.workspace;
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/workspace/${this.workspace}/app/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.db4apps[idx].id;

    Module.pager.go(`/workspace/${this.workspace}/app/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.db4apps[idx].id;

    Module.pager.go(`/workspace/${this.workspace}/app/${uuid}/delete`);
  }

  tables(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.db4apps[idx].id;

    Module.pager.go(`/workspace/${this.workspace}/app/${uuid}/table`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-app-list');   // page html
let mvc1 = new App_list('schema-app-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app', title: 'Apps', sections: [section1]});

Module.pages.push(page1);