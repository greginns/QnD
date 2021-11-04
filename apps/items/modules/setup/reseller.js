import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Reseller extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'reseller';
    this.model.title = 'Resellers'
    this.model.reseller = {};
    this.model.errors.reseller = {};

    this.model.resellers = [];
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.reseller.addView(new TableView({proxy: this.model.resellers}));
      this.defaults = await Module.tableStores.reseller.getDefault();   

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    await super.inView(params);
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let data = this.model.reseller.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);
      if (diffs === false) return;
    }      

    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.reseller.update(data.code, diffs) : await Module.tableStores.reseller.insert(data);

    if (res.status == 200) {
      utils.modals.toast('reseller ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.origData = this.model.reseller.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  async canClear(ev) {
    let data = this.model.reseller.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.reseller = {};

    for (let k in this.defaults) {
      this.model.reseller[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.reseller.code
    let res = await Module.tableStores.reseller.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.reseller.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      Module.pager.go(`/${this.model.catname}/${code}`);
    }
    else {
      // retry
      this.$focus('reseller.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.reseller.getOne(code);

    if (Object.keys(res).length == 0) {
      await Module.modal.alert(code + ' Does not exist');
      this.backToStart();
    }
    else {
      this.existingEntry(res);
    }

  }

  newEntry() {
    this.model.existingEntry = false;

    this.setDefaults();
    this.origData = this.model.reseller.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.reseller = data;
    this.origData = this.model.reseller.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-reseller');   // page html
let setup1 = new Reseller('items-main-reseller-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/reseller', '/reseller/:code'], title: 'reseller', sections: [section1]});

Module.pages.push(page1);