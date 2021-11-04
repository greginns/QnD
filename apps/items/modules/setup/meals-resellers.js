import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Edittable} from '/~static/lib/client/core/tables.js';

class Mealreseller extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.meals = {};
    this.model.mealrates = [];
    this.model.mealreseller = {};
    this.model.mealresellers = [];
    this.model.resellers = [];
    this.model.itemType = 'Meals';
    this.code = '';
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      this.editTable = new Edittable('#mealreseller', this, this.saver, this.deleter);
      Module.tableStores.reseller.addView(new TableView({proxy: this.model.resellers, filterFunc}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    let filters = {meal: this.code, active: true};

    this.model.meals = await Module.tableStores.meals.getOne(this.code);
    this.model.title = this.model.meals.name;

    let res = await Module.data.mealrates.getMany({filters});
    if (res.status == 200) {
      this.model.mealrates = res.data;
    }

    this.getResellers();
  }

  outView() {
    return true;  
  }
  
  async saver() {
    // called from editTable
    return await this.save();
  }

  async save(ev) {
    // mealreseller is the entry just edited
    let mealreseller = this.model.mealreseller.toJSON();

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = ('_pk' in mealreseller) ? await Module.tableStores.mealreseller.update([mealreseller.meal, mealreseller.reseller], {rateno: mealreseller.rateno, comm: mealreseller.comm}) : await Module.tableStores.mealreseller.insert(mealreseller);

    if (res.status == 200) {
      utils.modals.toast('Resellers', (('_pk' in mealreseller) ? ' Updated' : ' Created'), 2000);
    }
    else {
      this.displayErrors(res);
    }
    
    //this.stopSpinner(ev, spinner); 
    
    this.getResellers();
    return true;
  }

  async deleter(idx) {
    return await this.delete(idx);
  }

  async delete(idx) {
    let ret = await Module.modal.confirm('Are you sure?');

    if (ret != 0) return false;

    let mealresellers = this.model.mealresellers.toJSON();
    let mealreseller = mealresellers[idx];

    ret = Module.tableStores.mealreseller.delete([mealreseller.meal, mealreseller.reseller]);

    this.getResellers();
    return true;
  }

  newItem() {
    let obj = {};
    
    obj.meal = this.code;
    obj.rateno = '1';
    obj.comm = '0';

    this.editTable.add(obj);
  }

  async getResellers() {
    let data = [];
    let filters = {meal: this.code};
    let res = await Module.data.mealreseller.getMany({filters});

    if (res.status == 200) {
      for (let rec of res.data) {
        let reseller = await Module.tableStores.reseller.getOne(rec.reseller);
        let rate = await Module.tableStores.mealrates.getOne([this.code, rec.rateno]);

        rec.name = reseller.name;
        rec.ratename = rate.name;

        data.push(rec);
      }

      this.model.mealresellers = data;
    }
  }

  goBack() {
    Module.pager.go(`/meals/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-meals-reseller');   // page html
let setup1 = new Mealreseller('items-meals-reseller-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/meals/:code/resellers', title: 'Resellers', sections: [section1]});

Module.pages.push(page1);