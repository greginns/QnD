import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Print extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.columns = [];
    this.model.data = [];
    this.table = '';
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.table = params.table;
    this.model.title = decodeURI(params.title);

    this.doIt();
  }

  outView() {
    return true;  
  }

  goBack() {
    Module.pager.back();
  }

  async doIt() {
    let [hdrs, data] = await this.options_getHeadersAndData(this.table);

    this.model.columns = hdrs;
    this.model.data = data;
  }

  print() {
    window.print();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-print');   // page html
let setup1 = new Print('items-main-print-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/print/:table'], title: 'Print', sections: [section1]});

Module.pages.push(page1);