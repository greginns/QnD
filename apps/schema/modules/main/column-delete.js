import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Column_delete extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4table = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
    this.model.column = {};

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
    this.model.columnName = params.name;
  }

  outView() {
    return true;  
  }

  async delete(ev) {
    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    let res = await Module.data.db4table.deleteColumn(this.model.table, this.model.columnName);

    if (res.status == 200) {
      utils.modals.toast('Column', 'Deleted', 2000);
   
      this.model.column = {};

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
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/column`);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-column-delete');   // page html
let mvc1 = new Column_delete('schema-column-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/column/:name/delete', title: 'Columns - Delete', sections: [section1]});

Module.pages.push(page1);