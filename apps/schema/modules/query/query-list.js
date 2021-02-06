import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Query_list extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.querys = [];

    this.model.badMessage = '';
    this.model.errors = {
      contact: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      // fill up on data
      Module.tableStores.query.addView(new TableView({proxy: this.model.querys}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go('/query/create');
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.querys[idx].id;

    Module.pager.go(`/query/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.querys[idx].id;

    Module.pager.go(`/query/${uuid}/delete`);
  }

  app(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.querys[idx].id;

    Module.pager.go(`/query/${uuid}/app`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-query-list');   // page html
let mvc1 = new Query_list('schema-query-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/query', title: 'Queries', sections: [section1]});

Module.pages.push(page1);