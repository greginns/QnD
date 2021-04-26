import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Workspace_update extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.workspace = {};
    this.origWorkspace = {};

    this.model.badMessage = '';
    this.model.errors = {
      workspace: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let id = params.id || '';
    this.model.database = params.db;

    if (!id) this.gotoList();

    let res = await Module.tableStores.workspace.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.workspace = res;
      this.origWorkspace = res;
    }
    else {
      alert('Missing Workspace');

      this.gotoList();
    }

    this.model.hrefs = await Module.breadcrumb({db: this.model.database});
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let workspace = this.model.workspace.toJSON();
    let diffs = utils.object.diff(this.origWorkspace, workspace);
      
    if (Object.keys(diffs).length == 0) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }
    
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = await Module.tableStores.workspace.update(workspace.id, diffs);
    
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
let el1 = document.getElementById('schema-workspace-update');   // page html
let mvc1 = new Workspace_update('schema-workspace-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: 'database/:db/workspace/:id/update', title: 'Workspaces - Update', sections: [section1]});

Module.pages.push(page1);