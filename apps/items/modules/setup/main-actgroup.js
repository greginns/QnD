import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Actgroup extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'actgroup';
    this.model.title = 'Activity Groups'
    this.model.actgroup = {};
    this.model.errors.actgroup = {};

    this.model.actgroups = [];
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.actgroup.addView(new TableView({proxy: this.model.actgroups}));
      this.defaults = await Module.tableStores.actgroup.getDefault();   

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
    let data = this.model.actgroup.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);
      if (diffs === false) return;
    }      

    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.actgroup.update(data.code, diffs) : await Module.tableStores.actgroup.insert(data);

    if (res.status == 200) {
      utils.modals.toast('actgroup ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.origData = this.model.actgroup.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  async canClear(ev) {
    let data = this.model.actgroup.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.actgroup = {};

    for (let k in this.defaults) {
      this.model.actgroup[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.actgroup.code
    let res = await Module.tableStores.actgroup.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.actgroup.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      Module.pager.go(`/${this.model.catname}/${code}`);
    }
    else {
      // retry
      this.$focus('actgroup.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.actgroup.getOne(code);

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
    this.origData = this.model.actgroup.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.actgroup = data;
    this.origData = this.model.actgroup.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-actgroup');   // page html
let setup1 = new Actgroup('items-main-actgroup-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/actgroup', '/actgroup/:code'], title: 'actgroup', sections: [section1]});

Module.pages.push(page1);