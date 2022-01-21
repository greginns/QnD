import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Edittable} from '/~static/lib/client/core/tables.js';

class Inclmeal extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.activity = {};
    this.model.actrates = {};
    this.model.actinclm = {};
    this.model.actinclms = [];
    this.model.meals = [];
    this.model.mealrates = [];
    this.model.itemType = 'Rate';
    this.code = '';

    this.model.days = [
      {text: 1, value: 1},
      {text: 2, value: 2},
      {text: 3, value: 3},
      {text: 4, value: 4},
      {text: 5, value: 5},
      {text: 6, value: 6},
      {text: 7, value: 7},
      {text: 8, value: 8},
      {text: 9, value: 9},
      {text: 10, value: 10},
    ]
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      Module.tableStores.meals.addView(new TableView({proxy: this.model.meals, filterFunc}));

      this.editTable = new Edittable('#actinclm', this, this.saver, this.deleter);

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.rateno = params.rateno;
    this.model.actinclm = [];

    this.model.activity = await Module.tableStores.activity.getOne(this.code);
    this.model.actrates = await Module.tableStores.actrates.getOne([this.code, this.rateno]);
    this.model.title = this.model.activity.name + ', ' + this.model.actrates.name;

    this.getIncls();
  }

  outView() {
    return true;  
  }
  
  async saver() {
    // called from editTable
    return await this.save();
  }

  async save(ev) {
    // prices has our array of prices
    // actinclm is the entry just edited
    let actinclm = this.model.actinclm.toJSON();

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = ('_pk' in actinclm) ? await Module.tableStores.actinclm.update([actinclm.activity, actinclm.rateno, actinclm.seq], {meal: actinclm.meal, mealrate: actinclm.mealrate, day: actinclm.day, dur: actinclm.dur, offset: actinclm.offset}) : await Module.tableStores.actinclm.insert(actinclm);

    if (res.status == 200) {
      utils.modals.toast('Meal ' + actinclm.rateno, (('_pk' in actinclm) ? ' Updated' : ' Created'), 2000);
    }
    else {
      this.displayErrors(res);
    }
    
    //this.stopSpinner(ev, spinner); 
    
    this.getIncls();
    return true;
  }

  async deleter(idx) {
    return await this.delete(idx);
  }

  async delete(idx) {
    let ret = await Module.modal.confirm('Are you sure?');

    if (ret != 0) return false;

    let actinclms = this.model.actinclms.toJSON();
    let actinclm = actinclms[idx];

    ret = Module.tableStores.actinclm.delete([actinclm.activity, actinclm.rateno, actinclm.seq]);

    this.getIncls();
    return true;
  }

  editTableEditCaller(obj) {
    this.editTable.edit(obj);
    this.mealChanged();
  }

  async mealChanged() {
    // have a meal, get rates.
    let rates = [];
    let filters = {meal: this.model.actinclm.meal};
    let res = await Module.data.mealrates.getMany({filters});

    if (res.status == 200) {
      rates = res.data;
    }

    this.model.mealrates = rates;
  }

  newItem() {
    let obj = {};
    let seq = 0;

    for (let entry of this.model.actinclms) {
      seq = Math.max(seq, entry.seq);
    }
    
    obj.activity = this.code;
    obj.rateno = this.rateno;
    obj.seq = seq+1;
    obj.day = '1';
    obj.dur = '1';
    obj.offset = '0';
    obj.fixed = false;

    this.editTable.add(obj);
  }

  async getIncls() {
    let data = [];
    let filters = {activity: this.code, rateno: this.rateno};
    let res = await Module.data.actinclm.getMany({filters});

    if (res.status == 200) {
      for (let rec of res.data) {
        let meal = await Module.tableStores.meals.getOne(rec.meal);
        let mealrate = await Module.tableStores.mealrates.getOne([rec.meal, rec.mealrate]);

        rec.name = meal.name;
        rec.ratename = mealrate.name;

        data.push(rec);
      }

      this.model.actinclms = data;
    }
  }

  goBack() {
    Module.pager.go(`/activity/${this.code}/rate/${this.rateno}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-included-activity-meal');   // page html
let setup1 = new Inclmeal('items-included-activity-meal-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/activity/:code/rate/:rateno/included', title: 'Included Items', sections: [section1]});

Module.pages.push(page1);