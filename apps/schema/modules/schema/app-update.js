import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class App_update extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.application = {};
    this.model.workspace = '';
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    super.inView(params);

    this.model.database = params.db;
    this.model.workspace = params.workspace || '';
    let id = params.app;

    if (!this.model.workspace || !id) this.gotoList();

    let res = await Module.tableStores.application.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.application = res;
      this.origApp = res;
    }
    else {
      alert('Missing Workspace/App');

      this.gotoList();
    }

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace});
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let app = this.model.application.toJSON();
    let diffs = utils.object.diff(this.origApp, app);
      
    if (Object.keys(diffs).length == 0) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }
    
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);
    
    let res = await Module.tableStores.application.update(app.id, diffs);
    
    if (res.status == 200) {
      utils.modals.toast('APP', 'Updated', 2000);
   
      this.model.application.name = '';
      this.model.application.desc = '';
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
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-app-update');   // page html
let mvc1 = new App_update('schema-app-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/update', title: 'Apps - Update', sections: [section1]});

Module.pages.push(page1);