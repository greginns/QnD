import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Query_update extends MVC {
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
    let id = params.id || '';

    if (!id) this.gotoList();

    let res = await Module.tableStores.query.getOne(id);

    if (Object.keys(res).length > 0) {
      this.model.query = res;
      this.origquery = res;
    }
    else {
      alert('Missing query');

      this.gotoList();
    }
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let query = this.model.query.toJSON();
    let diffs = utils.object.diff(this.origquery, query);
      
    if (Object.keys(diffs).length == 0) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }
    
    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = await Module.tableStores.query.update(query.id, diffs);
    
    if (res.status == 200) {
      utils.modals.toast('query', 'Created', 2000);
   
      this.model.query.name = '';
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
    Module.pager.go('/query');
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-query-update');   // page html
let mvc1 = new Query_update('schema-query-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/query/:id/update', title: 'Query - Update', sections: [section1]});

Module.pages.push(page1);