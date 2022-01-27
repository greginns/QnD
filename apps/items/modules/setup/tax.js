import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {datetimer} from '/~static/lib/client/core/datetime.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Tax extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'tax';
    this.model.title = 'Taxes and Fees';
    this.model.tax = {};
    this.model.errors.tax = {};

    this.model.taxs = [];
    this.model.glcodes = [];
  }

  async ready() {
    let filterFunc = function(x) {
      return x.active;
    }

    return new Promise(async function(resolve) {
      Module.tableStores.tax.addView(new TableView({proxy: this.model.taxs}));
      Module.tableStores.glcode.addView(new TableView({proxy: this.model.glcodes, filterFunc}));

      this.defaults = await Module.tableStores.tax.getDefault();   

      this.editTable = new Edittable('#tax-rates', this, this.saver, this.deleter)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    await super.inView(params);
  }

  outView() {
    return true;  
  }

  newRate() {
    let dt = datetimer();
    let rate = {};
    rate.date = dt.format('YYYY-MM-DD');
    rate.rate = '0';

    this.editTable.add(rate);
  }

  editTableEditCaller(obj) {
    this.editTable.edit(obj);
  }

  async deleter(idx) {
    if (! ('history' in this.model.tax)) {
      this.model.tax.history = [];
      return;
    }

    this.model.tax.history.splice(idx, 1);
  }

  async saver(idx) {
    // called from editTable
    let data = this.model.hist.toJSON();

    if (! ('history' in this.model.tax) || !this.model.tax.history) this.model.tax.history = [];

    if (idx) {
      this.model.tax.history[idx] = data;
    }
    else {
      this.model.tax.history.push(data)
    }

    return await this.save();
  }

  async save(ev) {
    let data = this.model.tax.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);

      if (diffs === false) {
        diffs = {history: data.history};
      }
    }      

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.tax.update(data.code, diffs) : await Module.tableStores.tax.insert(data);

    if (res.status == 200) {
      utils.modals.toast('tax ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.origData = this.model.tax.toJSON();
    }
    else {
      this.displayErrors(res);
      return false;
    }
    
    return true;
  }

  async canClear(ev) {
    let data = this.model.tax.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.tax = {};

    for (let k in this.defaults) {
      this.model.tax[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.tax.code
    let res = await Module.tableStores.tax.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.tax.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      Module.pager.go(`/${this.model.catname}/${code}`);
    }
    else {
      // retry
      this.$focus('tax.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.tax.getOne(code);

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
    this.origData = this.model.tax.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.tax = data;
    this.origData = this.model.tax.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-tax');   // page html
let setup1 = new Tax('items-main-tax-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/tax', '/tax/:code'], title: 'Taxes', sections: [section1]});

Module.pages.push(page1);