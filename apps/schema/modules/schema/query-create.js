import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Query_create extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.query = {};
    this.model.table = '';
    this.model.workspace = '';
    this.model.app = '';

    this.model.badMessage = '';
    this.model.errors = {
      query: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let query = this.model.query.toJSON();

    if (!query.name) {
      this.model.badMessage = 'Please Enter a query Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    query.table = this.model.table;
    query.columns = query.columns.split('\n');
    query.orderby = query.orderby.split('\n');

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = await Module.tableStores.query.insert(query);

    if (res.status == 200) {
      utils.modals.toast('query', 'Created', 2000);
   
      this.model.query = {};
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
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/query`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-query-create');   // page html
let mvc1 = new Query_create('schema-query-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/query/create', title: 'Query - Create', sections: [section1]});

Module.pages.push(page1);