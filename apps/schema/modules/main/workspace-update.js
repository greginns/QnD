import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Workspace_update extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4workspace = {};
    this.origWorkspace = {};

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
    let id = params.id || '';

    if (!id) this.gotoList();

    let res = await Module.tableStores.db4workspace.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.db4workspace = res;
      this.origWorkspace = res;
    }
    else {
      alert('Missing Workspace');

      this.gotoList();
    }
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let workspace = this.model.db4workspace.toJSON();
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

    let res = await Module.tableStores.db4workspace.update(workspace.id, diffs);
    
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
    Module.pager.go('/workspace');
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-workspace-update');   // page html
let mvc1 = new Workspace_update('schema-workspace-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:id/update', title: 'Workspaces - Update', sections: [section1]});

Module.pages.push(page1);