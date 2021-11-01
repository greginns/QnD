import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Item extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.meals = {};
    this.model.mealrates = [];
    this.model.itemType = 'Meals';
    this.code = '';
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.model.mealrates = [];

    this.model.meals = await Module.tableStores.meals.getOne(this.code);

    let filters = {meal: this.code}
    let res = await Module.data.mealrates.getMany({filters});

    if (res.status == 200) {
      this.model.mealrates = res.data;
    }
  }

  outView() {
    return true;  
  }

  newItem(obj) {
    Module.pager.go(`/meals/${this.code}/rate`);
  }

  editItem(obj) {
    let row = obj.args[0];

    let data = this.model.mealrates.toJSON();
    let rateno = data[row].rateno;

    Module.pager.go(`/meals/${this.code}/rate/${rateno}`);
  }

  toPrices(obj) {
    let row = obj.args[0];

    let data = this.model.mealrates.toJSON();
    let rateno = data[row].rateno;

    Module.pager.go(`/meals/${this.code}/rate/${rateno}/prices`);
  }

  sortItems(obj) {
    let col = obj.args[0];
    let data = this.model.mealrates.toJSON();    

    let sortFunc = function(a, b) {
      return (a[col] < b[col]) ? -1 : (a[col] > b[col]) ? 1 : 0;
    }

    data.sort(sortFunc);

    this.model.mealrates = data;
  }

  goBack() {
    Module.pager.go(`/meals/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-rates-meals');   // page html
let setup1 = new Item('items-rates-meals-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/meals/:code/rates', title: 'Rates', sections: [section1]});

Module.pages.push(page1);