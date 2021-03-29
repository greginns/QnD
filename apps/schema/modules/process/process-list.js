import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';
import {App} from '/~static/lib/client/core/app.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class App_list extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.apps = [];
    this.workspace = '';

    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };

    this.appStore;
    this.appView = new TableView({proxy: this.model.apps});
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let workspace = params.workspace;
    let model = '/schema/application';
    let conditions = {};

    this.workspace = workspace;

    let filters = {workspace};
    
    conditions[model] = function(rec) {
      return rec.workspace == workspace;
    };

    if (this.appStore) {
      this.appStore.kill();
    }

    this.appStore = new TableStore({accessor: Module.data.application, filters, conditions});
    this.appStore.addView(this.appView);

    this.appStore.getMany();
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/workspace/${this.workspace}/app/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.apps[idx].id;

    Module.pager.go(`/workspace/${this.workspace}/app/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.apps[idx].id;

    Module.pager.go(`/workspace/${this.workspace}/app/${uuid}/delete`);
  }

  tables(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.apps[idx].id;

    Module.pager.go(`/workspace/${this.workspace}/app/${uuid}/table`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-app-list');   // page html
let mvc1 = new App_list('schema-app-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '', title: 'Apps', sections: [section1]});

Module.pages.push(page1);