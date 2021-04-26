import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Workspace_delete extends App.MVC {
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
    this.database = params.db;

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

  async delete(ev) {
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let workspace = this.model.workspace.toJSON();
   
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.workspace.delete(workspace.id);
    
    if (res.status == 200) {
      utils.modals.toast('WORKSPACE', 'Deleted', 2000);
   
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
    Module.pager.go(`/database/${this.database}/workspace`);
  }
  
  breadcrumbGo(ev) {
    Module.pager.go(ev.args[0]);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-workspace-delete');   // page html
let mvc1 = new Workspace_delete('schema-workspace-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:id/delete', title: 'Workspaces - Delete', sections: [section1]});

Module.pages.push(page1);