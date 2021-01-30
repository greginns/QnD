import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView, TableStore} from '/~static/lib/client/core/data.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Column_config extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';

    this.model.tables = [];
    this.model.tableRec = {};

    this.model.badMessage = '';
    this.model.errors = {
      table: {},
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

    let model = '/schema/table';
    let filters = {'app': params.app};
    let conditions = {};

    conditions[model] = function(rec) {
      return rec.application == params.app;
    };

    let tableStore = new TableStore({accessor: Module.data.table, filters, conditions, safeMode: true});
    let tableView = new TableView({proxy: this.model.tables});

    tableStore.addView(tableView);
    tableStore.getMany();

    this.model.tableRec = await Module.tableStores.table.getOne(this.model.table);

    if (!this.model.tableRec.fks) this.model.tableRec.fks = [];
    if (!this.model.tableRec.indexes) this.model.tableRec.indexes = [];

    // clean up display
    for (let fk of this.model.tableRec.fks) {
      for (let tbl of this.model.tables) {
        if (fk.ftable == tbl.id) {
          fk.ftableName = tbl.name;
          break;
        }
      }

      fk.linksX = fk.links.map(function(x) {
        return x.source + '<-->' + x.target;
      })
    }
  }

  outView() {
    return true;  
  }

  cancel() {
    this.gotoList();
  }

  gotoList() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table`);
  }

  pkEdit() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/pk/update`);
  }

  orderbyEdit() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/orderby/update`);
  }

  indexCreate() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/index/create`);
  }

  indexEdit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let index = this.model.table.indexes[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/index/${index.name}/update`);
  }

  indexDelete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let index = this.model.table.indexes[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/index/${index.name}/delete`);
  }  

  fkCreate() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/create`);
  }

  fkEdit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let fk = this.model.tableRec.fks[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/${fk.name}/update`);
  }

  fkDelete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let fk = this.model.tableRec.fks[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/${fk.name}/delete`);
  }  

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config');   // page html
let mvc1 = new Column_config('schema-table-config-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/config', title: 'Table - Config', sections: [section1]});

Module.pages.push(page1);