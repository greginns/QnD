import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class App_delete extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.bizprocess = {};
    this.origapp = {};

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
    }
    else {
      alert('Missing Process');

      this.gotoList();
    }
  }

  outView() {
    return true;  
  }

  async delete(ev) {
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let bizprocess = this.model.bizprocess.toJSON();
   
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.bizprocess.delete(bizprocess.id);
    
    if (res.status == 200) {
      utils.modals.toast('app', 'Deleted', 2000);
   
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
    Module.pager.go(`/`);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('process-delete');   // page html
let mvc1 = new App_delete('process-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/:id/delete', title: 'Process - Delete', sections: [section1]});

Module.pages.push(page1);