import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Lodgrates extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'lodgrates';
    this.model.itemType = 'Rates'
    this.model.lodging = {};
    this.model.lodgrates = {};
    this.model.errors.lodgrates = {};

    this.model.pricelevel = [];
    this.model.pmtterms = [];
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.pricelevel.addView(new TableView({proxy: this.model.pricelevel}));
      Module.tableStores.pmtterms.addView(new TableView({proxy: this.model.pmtterms}));

      this.defaults = await Module.tableStores.lodgrates.getDefault();   

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.rateno = params.rateno || '';
    this.lodging = await Module.tableStores.lodging.getOne(this.code);

    this.model.title = this.lodging.name + ' Rate ' + (this.rateno || '*NEW*');

    if (params.rateno) {
      await this.getEntry(params.rateno);
    }
    else {
      this.newEntry();
    }
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let data = this.model.lodgrates.toJSON();
    let diffs;

    data.lodging = this.code;
    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);
      if (diffs === false) return;
    }      

    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.lodgrates.update([data.lodging, data.rateno], diffs) : await Module.tableStores.lodgrates.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Rate ' + data.rateno, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      Module.pager.go(`/lodging/${this.code}/rate/${data.rateno}`);
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  async canClear(ev) {
    let data = this.model.lodgrates.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.lodgrates = {};

    for (let k in this.defaults) {
      this.model.lodgrates[k] = this.defaults[k];
    }
  }

  async testCode() {
    let rateno = this.model.lodgrates.rateno;
    let res = await Module.tableStores.lodgrates.getOne([this.code, rateno]);
    
    if (Object.keys(res).length == 0) return;

    this.model.lodgrates.rateno = '';

    let options = {text: rateno + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      Module.pager.go(`/lodging/${this.code}/rate/${rateno}`);
    }
    else {
      // retry
      this.$focus('lodgrates.rateno');
    }
  }

  async getEntry(rateno) {
    let res = await Module.tableStores.lodgrates.getOne([this.code, rateno]);

    if (Object.keys(res).length == 0) {
      await Module.modal.alert(rateno + ' Does not exist');
      this.backToStart();
    }
    else {
      this.existingEntry(res);
    }

  }

  newEntry() {
    this.model.existingEntry = false;

    this.setDefaults();
    this.origData = this.model.lodgrates.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.lodgrates = data;
    this.origData = this.model.lodgrates.toJSON();
  }

  prices() {
    Module.pager.go(`/lodging/${this.code}/rate/${this.rateno}/prices`);
  }

  minppl() {
    Module.pager.go(`/lodging/${this.code}/rate/${this.rateno}/minppl`);
  }

  included() {
    Module.pager.go(`/lodging/${this.code}/rate/${this.rateno}/included`);
  }

  goBack() {
    Module.pager.go(`/lodging/${this.code}/rates`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-rate-lodging');   // page html
let setup1 = new Lodgrates('items-rate-lodging-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/lodging/:code/rate', '/lodging/:code/rate/:rateno'], title: 'Lodging Rate', sections: [section1]});

Module.pages.push(page1);