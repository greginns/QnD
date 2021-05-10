import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';

class Codebundle_list extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.codebundles = [];
    this.workspace = '';

    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };

    this.codebundleStore;
    this.codebundleView = new TableView({proxy: this.model.codebundles});
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let model = '/schema/codebundle';
    let conditions = {};

    let filters = {};
    
    conditions[model] = function(rec) {
      return true;
    };

    if (this.codebundleStore) {
      this.codebundleStore.kill();
    }

    this.codebundleStore = new TableStore({accessor: Module.data.codebundle, filters, conditions});
    this.codebundleStore.addView(this.codebundleView);

    this.codebundleStore.getMany();
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/codebundle/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.codebundles[idx].id;

    Module.pager.go(`/codebundle/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.codebundles[idx].id;

    Module.pager.go(`/codebundle/${uuid}/delete`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('codebundle-list');   // page html
let mvc1 = new Codebundle_list('codebundle-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/codebundle', title: 'Code Bundles', sections: [section1]});

Module.pages.push(page1);