import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Query_list extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.queries = [];
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = ''

    this.model.badMessage = '';
    this.model.errors = {
      contact: {},
      message: ''
    };
  }

  async ready() {
    return new Promise(async function(resolve) {
      this.queryView = new TableView({proxy: this.model.queries});
      this.queryStore = new TableStore({accessor: Module.data.query, filters: {}, conditions: {}});
      this.queryStore.addView(this.queryView);

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;

    let filters = {table: params.table};
    let model = '/schema/query';
    let conditions = {};
    
    conditions[model] = function(rec) {
      return rec.table == params.table;
    };

    this.queryStore.redo({filters, conditions});
    this.queryStore.getMany();
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/query/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.queries[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/query/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.queries[idx].id;

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/query/${uuid}/delete`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-query-list');   // page html
let mvc1 = new Query_list('schema-query-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/query', title: 'Queries', sections: [section1]});

Module.pages.push(page1);