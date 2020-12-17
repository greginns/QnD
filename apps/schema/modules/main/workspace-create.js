import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Workspace_create extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4workspace = {};

    this.model.badMessage = '';
    this.model.errors = {
      db4workspace: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let workspace = this.model.db4workspace.toJSON();

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
    let res = await Module.tableStores.db4workspace.insert(workspace);

    if (res.status == 200) {
      utils.modals.toast('WORKSPACE', 'Created', 2000);
   
      this.model.db4workspace.name = '';
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
    Module.pager.go(`/workspace`);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-workspace-create');   // page html
let mvc1 = new Workspace_create('schema-workspace-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/create', title: 'Workspaces - Create', sections: [section1]});

Module.pages.push(page1);