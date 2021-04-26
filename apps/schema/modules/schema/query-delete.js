import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Query_delete extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.query = {};
    this.origquery = {};

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
    this.model.database = params.db;
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;    
    let id = params.query;

    if (!this.model.workspace || !this.model.app || !this.model.table) this.gotoList();

    if (!id) this.gotoList();

    let res = await Module.tableStores.query.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.query = res;
    }
    else {
      alert('Missing Query');

      this.gotoList();
    }

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app, table: this.model.table});
  }

  outView() {
    return true;  
  }

  async delete(ev) {
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let query = this.model.query.toJSON();
   
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = await Module.tableStores.query.delete(query.id);
    
    if (res.status == 200) {
      utils.modals.toast('query', 'Deleted', 2000);
   
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
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/query`);
  }

  breadcrumbGo(ev) {
    Module.pager.go(ev.args[0]);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-query-delete');   // page html
let mvc1 = new Query_delete('schema-query-delete-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/query/:query/delete', title: 'Query - Delete', sections: [section1]});

Module.pages.push(page1);