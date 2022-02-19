import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Workspace_create extends App.DB4MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.workspace = {};
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    super.inView(params);

    this.model.database = params.db;

    this.model.hrefs = await Module.breadcrumb({db: this.model.database});
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let workspace = this.model.workspace.toJSON();
    workspace.database = this.model.database;

    if (!workspace.name) {
      this.model.badMessage = 'Please Enter a Workspace Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.workspace.insert(workspace);

    if (res.status == 200) {
      utils.modals.toast('WORKSPACE', 'Created', 2000);
   
      this.model.workspace.name = '';
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
    Module.pager.go(`/database/${this.model.database}/workspace`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-workspace-create');   // page html
let mvc1 = new Workspace_create('schema-workspace-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/create', title: 'Workspaces - Create', sections: [section1]});

Module.pages.push(page1);