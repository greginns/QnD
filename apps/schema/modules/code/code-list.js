import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';

class Code_list extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.codes = [];
    this.workspace = '';

    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };

    this.codeStore;
    this.codeView = new TableView({proxy: this.model.codes});
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let model = '/schema/code';
    let conditions = {};

    let filters = {};
    
    conditions[model] = function(rec) {
      return true;
    };

    if (this.codeStore) {
      this.codeStore.kill();
    }

    this.codeStore = new TableStore({accessor: Module.data.code, filters, conditions});
    this.codeStore.addView(this.codeView);

    this.codeStore.getMany();
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/code/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.codes[idx].id;

    Module.pager.go(`/code/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.codes[idx].id;

    Module.pager.go(`/code/${uuid}/delete`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('code-list');   // page html
let mvc1 = new Code_list('code-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/code', title: 'codes', sections: [section1]});

Module.pages.push(page1);