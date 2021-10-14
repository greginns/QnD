import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Main} from '/~static/apps/items/modules/setup/baseclasses.js';

class Activity extends Main {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'activity';
    this.model.title = 'Activities';
    this.model.activity = {};
    this.model.errors.activity = {};

    this.model.actgroups = [];
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    await super.ready();

    return new Promise(async function(resolve) {
      Module.tableStores.actgroup.addView(new TableView({proxy: this.model.actgroups, filterFunc}));
      this.defaults = await Module.tableStores.activity.getDefault();   

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
    let data = this.model.activity.toJSON();
    let diffs;

    this.clearErrors();

    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);
      if (diffs === false) return;
    }      

    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.activity.update(data.code, diffs) : await Module.tableStores.activity.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Activity ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      if (!this.model.existingEntry) {
        this.editEntry(data.code);
        return;
      }

      this.origData = this.model.activity.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  async canClear(ev) {
    let data = this.model.activity.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.activity = {};

    for (let k in this.defaults) {
      this.model.activity[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.activity.code
    let res = await Module.tableStores.activity.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.activity.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      this.editEntry(code);
    }
    else {
      // retry
      this.$focus('activity.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.activity.getOne(code);

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
    this.origData = this.model.activity.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.activity = data;
    this.origData = this.model.activity.toJSON();
  }

  daily(ev) {
    Module.pager.go(`/activity/${this.model.activity.code}/daily`)
  }

  rates(ev) {
    console.log(ev)
  }

  schedule(ev) {
    console.log(ev)
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-activity');   // page html
let setup1 = new Activity('items-main-activity-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/activity', '/activity/:code'], title: 'Activity', sections: [section1]});

Module.pages.push(page1);