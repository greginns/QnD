import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';

class Workspace_list extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.workspaces = [];

    this.wsStore;
    this.wsView = new TableView({proxy: this.model.workspaces});
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    super.inView(params);
    
    let database = params.db;
    let model = '/schema/workspace';
    let conditions = {};

    this.model.database = database;

    let filters = {database};
    
    conditions[model] = function(rec) {
      return rec.database == database;
    };

    if (this.wsStore) {
      this.wsStore.kill();
    }

    this.wsStore = new TableStore({accessor: Module.data.workspace, filters, conditions});
    this.wsStore.addView(this.wsView);

    this.wsStore.getMany();    

    this.model.hrefs = await Module.breadcrumb({db: this.model.database});
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`database/${this.model.database}/workspace/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.workspaces[idx].id;

    Module.pager.go(`database/${this.model.database}/workspace/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.workspaces[idx].id;

    Module.pager.go(`database/${this.model.database}/workspace/${uuid}/delete`);
  }

  app(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.workspaces[idx].id;

    Module.pager.go(`database/${this.model.database}/workspace/${uuid}/app`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-workspace-list');   // page html
let mvc1 = new Workspace_list('schema-workspace-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: 'database/:db/workspace', title: 'Workspaces', sections: [section1]});

Module.pages.push(page1);