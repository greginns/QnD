import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class App_create extends App.DB4MVC {
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
    this.model.workspace = params.workspace;

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace});
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let application = this.model.application.toJSON();

    if (!application.name) {
      this.model.badMessage = 'Please Enter an App Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    application.workspace = this.model.workspace;

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.application.insert(application);

    if (res.status == 200) {
      utils.modals.toast('App', 'Created', 2000);
   
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
let el1 = document.getElementById('schema-app-create');   // page html
let mvc1 = new App_create('schema-app-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: 'database/:db/workspace/:workspace/app/create', title: 'Apps - Create', sections: [section1]});

Module.pages.push(page1);