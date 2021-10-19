import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Item extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.lodging = {};
    this.model.lodgrates = [];
    this.model.itemType = 'Lodging';
    this.code = '';
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.model.lodgrates = [];

    this.model.lodging = await Module.tableStores.lodging.getOne(this.code);

    let filters = {lodging: this.code}
    let res = await Module.data.lodgrates.getMany({filters});

    if (res.status == 200) {
      this.model.lodgrates = res.data;
    }
  }

  outView() {
    return true;  
  }

  newItem(obj) {
    Module.pager.go(`/lodging/${this.code}/rate`);
  }

  editItem(obj) {
    let row = obj.args[0];

    let data = this.model.lodgrates.toJSON();
    let rateno = data[row].rateno;

    Module.pager.go(`/lodging/${this.code}/rate/${rateno}`);
  }

  toPrices(obj) {
    let row = obj.args[0];

    let data = this.model.lodgrates.toJSON();
    let rateno = data[row].rateno;

    Module.pager.go(`/lodging/${this.code}/rate/${rateno}/prices`);
  }

  sortItems(obj) {
    let col = obj.args[0];
    let data = this.model.lodgrates.toJSON();    

    let sortFunc = function(a, b) {
      return (a[col] < b[col]) ? -1 : (a[col] > b[col]) ? 1 : 0;
    }

    data.sort(sortFunc);

    this.model.lodgrates = data;
  }

  goBack() {
    Module.pager.go(`/lodging/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-rates-lodging');   // page html
let setup1 = new Item('items-rates-lodging-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/lodging/:code/rates', title: 'Rates', sections: [section1]});

Module.pages.push(page1);