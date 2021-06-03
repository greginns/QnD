// *** NOT USED
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Process_update extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.bizprocess = {};

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
    let id = params.id || '';

    if (!id) this.gotoList();

    let res = await Module.tableStores.bizprocess.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.bizprocess = res;
      this.origProcess = res;
    }
    else {
      alert('Missing Process');

      this.gotoList();
    }        
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let bizprocess = this.model.bizprocess.toJSON();
    let diffs = utils.object.diff(this.origProcess, bizprocess);

    if (Object.keys(diffs).length == 0) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    if (!bizprocess.name) {
      this.model.badMessage = 'Please Enter a Process Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.bizprocess.update(bizprocess.id, diffs);

    if (res.status == 200) {
      utils.modals.toast('Process', 'Updated', 2000);
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
    Module.pager.go(`/`);
  }

  steps() {
    let id = this.model.bizprocess.id;

    Module.pager.go(`/${id}/steps`);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('process-update');   // page html
let mvc1 = new Process_update('process-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/:id/update', title: 'Process - Update', sections: [section1]});

Module.pages.push(page1);