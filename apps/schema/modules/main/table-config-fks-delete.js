import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_config_fk_delete extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tableRec = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
    this.model.name = '';
    this.model.fk = {};
    this.model.sourceTable = {};
    this.model.foreignTable = {};
    this.model.appRec = {};

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
    this.model.name = params.name;
    this.model.fk = {};

    this.model.tableRec = await Module.tableStores.table.getOne(this.model.table);

    let fks = this.model.tableRec.fks || [];
    
    for (let fk of fks) {
      if (fk.name == this.model.name) {
        this.model.fk = fk;
        break;
      }
    }

    if (Object.keys(this.model.fk).length == 0) {
      alert('Invalid Foreign Key Name');
      this.gotoList();
    }

    this.model.sourceTable = await Module.tableStores.table.getOne(this.model.table);
    this.model.foreignTable = await Module.tableStores.table.getOne(this.model.fk.ftable);
    this.model.appRec = await Module.tableStores.application.getOne(this.model.fk.app);
  }

  outView() {
    return true;  
  }

  async delete(ev) {
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');
    if (!ret) return;

    let fk = this.model.fk.toJSON();

    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    let res = await Module.data.table.deleteFK(this.model.table, fk.name);

    if (res.status == 200) {
      utils.modals.toast('FK', 'Deleted', 2000);
   
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
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/config`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-config-fks-delete');   // page html
let mvc1 = new Table_config_fk_delete('schema-table-config-fks-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/config/fks/:name/delete', title: 'Tables - Config FK', sections: [section1]});

Module.pages.push(page1);