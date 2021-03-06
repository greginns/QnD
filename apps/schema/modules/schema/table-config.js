import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView, TableStore} from '/~static/lib/client/core/data.js';

class Column_config extends App.MVC {
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
    this.model.database = params.db;
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

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app, table: this.model.table});
  }

  outView() {
    return true;  
  }

  cancel() {
    this.gotoList();
  }

  gotoList() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table`);
  }

  pkEdit() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/pk/update`);
  }

  orderbyEdit() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/orderby/update`);
  }

  indexCreate() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/index/create`);
  }

  indexDelete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let index = this.model.tableRec.indexes[idx];

    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/index/${index.name}/delete`);
  }  

  fkCreate() {
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/create`);
  }

  fkDelete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let fk = this.model.tableRec.fks[idx];

    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/${fk.name}/delete`);
  }  

  breadcrumbGo(ev) {
    Module.pager.go(ev.args[0]);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config');   // page html
let mvc1 = new Column_config('schema-table-config-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/config', title: 'Table - Config', sections: [section1]});

Module.pages.push(page1);