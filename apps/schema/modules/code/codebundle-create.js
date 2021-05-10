import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Codebundle_create extends MVC {
  constructor(element, crud) {
    super(element);

    this.crud = crud;
  }

  createModel() {
    this.model.codebundle = {};
    this.model.params = '';
    this.model.codebundleId = '';
    this.model.codes = [];

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
    this.model.codes = await Module.tableStores.code.getAll();

    if ('id' in params) {
      this.model.codebundleId = params.id;
      this.model.codebundle = await Module.tableStores.codebundle.getOne(params.id);
      this.origcodebundle = this.$copy(this.model.codebundle);
    }
    else {
      this.model.codebundleId = '';
      this.model.codebundle = {};
    }    
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let diffs;
    let codebundle = this.model.codebundle.toJSON();

    if (!codebundle.name) {
      this.model.badMessage = 'Please Enter a Bundle Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    if (this.model.codebundleId) {
      diffs = utils.object.diff(this.origcodebundle, codebundle);
        
      if (Object.keys(diffs).length == 0) {
        this.model.badMessage = 'No Changes to Update';
        
        setTimeout(function() {
          this.model.badMessage = '';
        }.bind(this), 2500);

        return;
      }
    }

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = (this.model.codebundleId) ? await Module.tableStores.codebundle.update(this.model.codebundleId, diffs) : await Module.tableStores.codebundle.insert(codebundle);

    if (res.status == 200) {
      utils.modals.toast('Bundle', 'Created', 2000);
   
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
    Module.pager.go(`/codebundle`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('codebundle-create');   // page html
let mvc1 = new Codebundle_create('codebundle-create-section', 'create');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/codebundle/create', title: 'Code Bundle - Create', sections: [section1]});

Module.pages.push(page1);

let el2 = document.getElementById('codebundle-update');   // page html
let mvc2 = new Codebundle_create('codebundle-update-section', 'update');
let section2 = new Section({mvc: mvc2});
let page2 = new Page({el: el2, path: '/codebundle/:id/update', title: 'Code Bundle - Update', sections: [section2]});

Module.pages.push(page2);