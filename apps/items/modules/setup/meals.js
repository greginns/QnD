import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Main} from '/~static/apps/items/modules/setup/baseclasses.js';

class Meals extends Main {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'meals';
    this.model.title = 'Meals';
    this.model.meals = {};
    this.model.errors.meals = {};

    this.model.meallocns = [];
    this.model.mealtypes = [];

    this.model.levels = [
      {value: 0, text: 'N/A'},
      {value: 1, text: 'Basic'},
      {value: 2, text: 'Good'},
      {value: 3, text: 'Better'},
      {value: 4, text: 'Best'},
      {value: 5, text: 'Decadent'},
    ];

  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    await super.ready();

    return new Promise(async function(resolve) {
      Module.tableStores.meallocn.addView(new TableView({proxy: this.model.meallocns, filterFunc}));
      Module.tableStores.mealtype.addView(new TableView({proxy: this.model.mealtypes, filterFunc}));

      this.defaults = await Module.tableStores.meals.getDefault();   

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
    let data = this.model.meals.toJSON();
    let diffs;

    this.clearErrors();

    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);
      if (diffs === false) return;
    }      

    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.meals.update(data.code, diffs) : await Module.tableStores.meals.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Meal ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      if (!this.model.existingEntry) {
        this.editEntry(data.code);
        return;
      }

      this.origData = this.model.meals.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  async canClear(ev) {
    let data = this.model.meals.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.meals = {};

    for (let k in this.defaults) {
      this.model.meals[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.meals.code
    let res = await Module.tableStores.meals.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.meals.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      this.editEntry(code);
    }
    else {
      // retry
      this.$focus('meals.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.meals.getOne(code);

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
    this.origData = this.model.meals.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.meals = data;
    this.origData = this.model.meals.toJSON();
  }

  rates(ev) {
    Module.pager.go(`/meals/${this.model.meals.code}/rates`)
  }

  schedule(ev) {
    Module.pager.go(`/meals/${this.model.meals.code}/sched`)
  }

  photos(ev) {
    Module.pager.go(`/meals/${this.model.meals.code}/photos`)
  }

  resellers(ev) {
    Module.pager.go(`/meals/${this.model.meals.code}/resellers`)
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-meals');   // page html
let setup1 = new Meals('items-main-meals-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/meals', '/meals/:code'], title: 'Meals', sections: [section1]});

Module.pages.push(page1);