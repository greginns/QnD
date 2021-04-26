import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';

class Process_list extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.processes = [];
    this.workspace = '';

    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };

    this.processStore;
    this.processView = new TableView({proxy: this.model.processes});
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let model = '/schema/bizprocess';
    let conditions = {};

    let filters = {};
    
    conditions[model] = function(rec) {
      return true;
    };

    if (this.processStore) {
      this.processStore.kill();
    }

    this.processStore = new TableStore({accessor: Module.data.bizprocess, filters, conditions});
    this.processStore.addView(this.processView);

    this.processStore.getMany();
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.processes[idx].id;

    Module.pager.go(`/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.processes[idx].id;

    Module.pager.go(`/${uuid}/delete`);
  }

  steps(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.processes[idx].id;

    Module.pager.go(`/${uuid}/steps`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('process-list');   // page html
let mvc1 = new Process_list('process-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '', title: 'Processes', sections: [section1]});

Module.pages.push(page1);