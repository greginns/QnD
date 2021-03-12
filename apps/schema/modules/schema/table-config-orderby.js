import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_config_orderby extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tableRec = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';

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

    this.model.tableRec = await Module.tableStores.table.getOne(this.model.table);
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let current = await Module.tableStores.table.getOne(this.model.table);
    let diffs = {};
console.log(current, this.model.tableRec.toJSON())
    if (current.orderby != this.model.tableRec.orderby) diffs.orderby = this.model.tableRec.orderby;
    
    if (Object.keys(diffs).length == 0) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    let res = await Module.tableStores.table.update(this.model.table, diffs);

    if (res.status == 200) {
      utils.modals.toast('Table', 'Updated', 2000);
   
      this.model.tableRec = {};

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
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config`);
  }

  orderbyChanged(ev) {
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config-orderby');   // page html
let mvc1 = new Table_config_orderby('schema-table-config-orderby-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/config/orderby/update', title: 'Tables - Config Order By', sections: [section1]});

Module.pages.push(page1);