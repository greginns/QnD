import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Glcode extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'glcode';
    this.model.title = 'GL Codes'
    this.model.glcode = {};
    this.model.errors.glcode = {};

    this.model.glcodes = [];
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.glcode.addView(new TableView({proxy: this.model.glcodes}));
      this.defaults = await Module.tableStores.glcode.getDefault();   

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
    let data = this.model.glcode.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);
      if (diffs === false) return;
    }      

    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.glcode.update(data.code, diffs) : await Module.tableStores.glcode.insert(data);

    if (res.status == 200) {
      utils.modals.toast('glcode ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.origData = this.model.glcode.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  async canClear(ev) {
    let data = this.model.glcode.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.glcode = {};

    for (let k in this.defaults) {
      this.model.glcode[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.glcode.code
    let res = await Module.tableStores.glcode.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.glcode.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      Module.pager.go(`/${this.model.catname}/${code}`);
    }
    else {
      // retry
      this.$focus('glcode.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.glcode.getOne(code);

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
    this.origData = this.model.glcode.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.glcode = data;
    this.origData = this.model.glcode.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-glcode');   // page html
let setup1 = new Glcode('items-main-glcode-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/glcode', '/glcode/:code'], title: 'glcode', sections: [section1]});

Module.pages.push(page1);