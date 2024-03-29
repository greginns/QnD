import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Main} from '/~static/apps/items/modules/setup/baseclasses.js';

class Lodging extends Main {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'Lodging';
    this.model.title = 'Lodging';
    this.model.lodging = {};
    this.model.errors.lodging = {};

    this.model.lodglocns = [];
    this.model.lodgtypes = [];

    this.model.levels = [
      {value: 0, text: 'N/A'},
      {value: 1, text: 'Primitive'},
      {value: 2, text: 'Comfortable'},
      {value: 3, text: 'Nice'},
      {value: 4, text: 'Great'},
      {value: 5, text: 'Luxurious'},
    ];

  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    await super.ready();

    return new Promise(async function(resolve) {
      Module.tableStores.lodglocn.addView(new TableView({proxy: this.model.lodglocns, filterFunc}));
      Module.tableStores.lodgtype.addView(new TableView({proxy: this.model.lodgtypes, filterFunc}));

      this.defaults = await Module.tableStores.lodging.getDefault();   

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
    let data = this.model.lodging.toJSON();
    let diffs;

    this.clearErrors();

    if (data.supplied) {
      let anyErrors = false;

      if (!data.supplier) {
        this.model.errors.lodging.supplier='Required';
        anyErrors = true;
      }

      if (!data.suppitem) {
        this.model.errors.lodging.suppitem='Required';
        anyErrors = true;
      }
      
      if (!data.supprate || isNaN(data.supprate) || data.supprate < 1) {
        this.model.errors.lodging.supprate='Required';
        anyErrors = true;
      }

      if (anyErrors) {
        this.model.badMessage = 'Please Correct errors and try again'
        return;
      }
    }

    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);

      if (diffs === false) return;
    }      

    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.lodging.update(data.code, diffs) : await Module.tableStores.lodging.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Lodging ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      if (!this.model.existingEntry) {
        this.editEntry(data.code);
        return;
      }
      
      this.origData = this.model.lodging.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  async canClear(ev) {
    let data = this.model.lodging.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.lodging = {};

    for (let k in this.defaults) {
      this.model.lodging[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.lodging.code;
    let res = await Module.tableStores.lodging.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.lodging.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      this.editEntry(code)
    }
    else {
      // retry
      this.$focus('lodging.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.lodging.getOne(code);

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
    this.origData = this.model.lodging.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.lodging = data;
    this.origData = this.model.lodging.toJSON();
  }

  units() {
    let code = this.model.lodging.code;

    Module.pager.go(`/lodging/${code}/units`);
  }

  rates(ev) {
    let code = this.model.lodging.code;

    Module.pager.go(`/lodging/${code}/rates`);
  }

  schedule(ev) {
    let code = this.model.lodging.code;

    Module.pager.go(`/lodging/${code}/sched`)
  }

  photos(ev) {
    Module.pager.go(`/lodging/${this.model.lodging.code}/photos`)
  }

  resellers(ev) {
    Module.pager.go(`/lodging/${this.model.lodging.code}/resellers`)
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-lodging');   // page html
let setup1 = new Lodging('items-main-lodging-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/lodging', '/lodging/:code'], title: 'Lodging', sections: [section1]});

Module.pages.push(page1);