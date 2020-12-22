import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Table_create extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.db4table = {};
    this.model.workspace = '';
    this.model.app = '';

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
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let table = this.model.db4table.toJSON();

    if (!table.name) {
      this.model.badMessage = 'Please Enter a Table Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    table.workspace = this.model.workspace;
    table.app = this.model.app;

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.db4table.insert(table);

    if (res.status == 200) {
      utils.modals.toast('Table', 'Created', 2000);
   
      this.model.db4table.name = '';
      this.model.db4table.desc = '';
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
let el1 = document.getElementById('schema-table-create');   // page html
let mvc1 = new Table_create('schema-table-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/create', title: 'Tables - Create', sections: [section1]});

Module.pages.push(page1);