import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';

class App_list extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.apps = [];
    this.model.workspace = '';
    this.appStore;
    this.appView = new TableView({proxy: this.model.apps});
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    super.inView(params);

    this.model.database = params.db;
    let workspace = params.workspace;
    let model = '/schema/application';
    let conditions = {};

    this.model.workspace = workspace;

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

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace});
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.apps[idx].id;

    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.apps[idx].id;

    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${uuid}/delete`);
  }

  tables(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.apps[idx].id;

    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${uuid}/table`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-app-list');   // page html
let mvc1 = new App_list('schema-app-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app', title: 'Apps', sections: [section1]});

Module.pages.push(page1);