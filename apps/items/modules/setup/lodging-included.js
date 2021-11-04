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
    this.model.lodging = {};
    this.model.lodgrates = {};
    this.model.lodginclm = {};
    this.model.lodginclms = [];
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

      this.editTable = new Edittable('#lodginclm', this, this.saver, this.deleter);

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.rateno = params.rateno;
    this.model.lodginclm = [];

    this.model.lodging = await Module.tableStores.lodging.getOne(this.code);
    this.model.lodgrates = await Module.tableStores.lodgrates.getOne([this.code, this.rateno]);
    this.model.title = this.model.lodging.name + ', ' + this.model.lodgrates.name;

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
    // lodginclm is the entry just edited
    let lodginclm = this.model.lodginclm.toJSON();

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = ('_pk' in lodginclm) ? await Module.tableStores.lodginclm.update([lodginclm.lodging, lodginclm.rateno, lodginclm.seq], {meal: lodginclm.meal, mealrate: lodginclm.mealrate, day: lodginclm.day, dur: lodginclm.dur, offset: lodginclm.offset}) : await Module.tableStores.lodginclm.insert(lodginclm);

    if (res.status == 200) {
      utils.modals.toast('Meal ' + lodginclm.rateno, (('_pk' in lodginclm) ? ' Updated' : ' Created'), 2000);
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

    let lodginclms = this.model.lodginclms.toJSON();
    let lodginclm = lodginclms[idx];

    ret = Module.tableStores.lodginclm.delete([lodginclm.lodging, lodginclm.rateno, lodginclm.seq]);

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
    let filters = {meal: this.model.lodginclm.meal};
    let res = await Module.data.mealrates.getMany({filters});

    if (res.status == 200) {
      rates = res.data;
    }

    this.model.mealrates = rates;
  }

  newItem() {
    let obj = {};
    let seq = 0;

    for (let entry of this.model.lodginclms) {
      seq = Math.max(seq, entry.seq);
    }
    
    obj.lodging = this.code;
    obj.rateno = this.rateno;
    obj.seq = seq+1;
    obj.day = '1';
    obj.dur = '1';
    obj.offset = '0';

    this.editTable.add(obj);
  }

  async getIncls() {
    let data = [];
    let filters = {lodging: this.code, rateno: this.rateno};
    let res = await Module.data.lodginclm.getMany({filters});

    if (res.status == 200) {
      for (let rec of res.data) {
        let meal = await Module.tableStores.meals.getOne(rec.meal);
        let mealrate = await Module.tableStores.mealrates.getOne([rec.meal, rec.mealrate]);

        rec.name = meal.name;
        rec.ratename = mealrate.name;

        data.push(rec);
      }

      this.model.lodginclms = data;
    }
  }

  goBack() {
    Module.pager.go(`/lodging/${this.code}/rate/${this.rateno}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-included-lodging-meal');   // page html
let setup1 = new Inclmeal('items-included-lodging-meal-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/lodging/:code/rate/:rateno/included', title: 'Included Items', sections: [section1]});

Module.pages.push(page1);