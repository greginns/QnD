import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Process_create extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.bizprocess = {trigger: 'P'};

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
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let bizprocess = this.model.bizprocess.toJSON();
    
    bizprocess.steps = [];
    bizprocess.initdata = {};
    bizprocess.respdata = {};

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
    let res = await Module.tableStores.bizprocess.insert(bizprocess);

    if (res.status == 200) {
      utils.modals.toast('Process', 'Created', 2000);
   
      this.gotoSteps(res.data.id);
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

  gotoSteps(id) {
    Module.pager.go(`/${id}/steps`);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('process-create');   // page html
let mvc1 = new Process_create('process-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/create', title: 'Process - Create', sections: [section1]});

Module.pages.push(page1);