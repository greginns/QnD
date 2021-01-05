import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Column_config extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4tables = [];
    this.model.db4table = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';

    this.model.badMessage = '';
    this.model.errors = {
      db4table: {},
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

    this.model.db4tables = await Module.tableStores.db4table.getAll();
    this.model.db4table = await Module.tableStores.db4table.getOne(this.model.table);
    if (!this.model.db4table.fks) this.model.db4table.fks = [];
    if (!this.model.db4table.indexes) this.model.db4table.indexes = [];

    // clean up display
    for (let fk of this.model.db4table.fks) {
      for (let tbl of this.model.db4tables) {
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
    let index = this.model.db4table.indexes[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/index/${index.name}/update`);
  }

  indexDelete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let index = this.model.db4table.indexes[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/index/${index.name}/delete`);
  }  

  fkCreate() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/create`);
  }

  fkEdit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let fk = this.model.db4table.fks[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/${fk.name}/update`);
  }

  fkDelete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let fk = this.model.db4table.fks[idx];

    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config/fks/${fk.name}/delete`);
  }  

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config');   // page html
let mvc1 = new Column_config('schema-table-config-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/config', title: 'Table - Config', sections: [section1]});

Module.pages.push(page1);