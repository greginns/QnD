import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_delete extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4table = {};
    this.model.workspace = '';
    this.origtable = {};

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

    let id = params.table || '';

    if (!id) this.gotoList();

    let res = await Module.tableStores.db4table.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.db4table = res;
    }
    else {
      alert('Missing Table');

      this.gotoList();
    }
  }

  outView() {
    return true;  
  }

  async delete(ev) {
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let table = this.model.db4table.toJSON();
   
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    //let res = await Module.tableStores.db4table.delete(table.id);
    let res = {status: 200}
    
    if (res.status == 200) {
      utils.modals.toast('Table', 'Deleted', 2000);
   
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
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table`);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-table-delete');   // page html
let mvc1 = new Table_delete('schema-table-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/delete', title: 'Table - Delete', sections: [section1]});

Module.pages.push(page1);