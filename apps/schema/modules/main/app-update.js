import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class App_update extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.app = {};
    this.model.workspace = '';

    this.model.badMessage = '';
    this.model.errors = {
      app: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.workspace = params.workspace || '';
    let id = params.app;

    if (!this.model.workspace || !id) this.gotoList();

    let res = await Module.tableStores.app.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.app = res;
      this.origApp = res;
    }
    else {
      alert('Missing Workspace/App');

      this.gotoList();
    }
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let app = this.model.app.toJSON();
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
    
    let res = await Module.tableStores.app.update(app.id, diffs);
    
    if (res.status == 200) {
      utils.modals.toast('APP', 'Updated', 2000);
   
      this.model.app.name = '';
      this.model.app.desc = '';
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
    Module.pager.go(`/workspace/${this.model.workspace}/app`);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-app-update');   // page html
let mvc1 = new App_update('schema-app-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/update', title: 'Apps - Update', sections: [section1]});

Module.pages.push(page1);