import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';

class database_list extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.databases = [];

    this.model.badMessage = '';
    this.model.errors = {
      contact: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      // fill up on data
      Module.tableStores.database.addView(new TableView({proxy: this.model.databases}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  create() {
    alert('Not yet')
    return;
        
    Module.pager.go('/database/create');
  }

  edit(ev) {
    alert('Not yet')
    return;

    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.databases[idx].id;

    Module.pager.go(`/database/${uuid}/update`);
  }

  delete(ev) {
    alert('Not yet')
    return;
        
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.databases[idx].id;

    Module.pager.go(`/database/${uuid}/delete`);
  }

  workspace(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.databases[idx].id;

    Module.pager.go(`/database/${uuid}/workspace`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-database-list');   // page html
let mvc1 = new database_list('schema-database-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database', title: 'databases', sections: [section1]});

Module.pages.push(page1);