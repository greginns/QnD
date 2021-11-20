import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Item extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.returned = false;

    this.model.discount = [];
    this.model.cancreas = [];

    this.model.lengths = {};

    this.tables = [
      'discount',
      'cancreas',
    ];
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.discount.addView(new TableView({proxy: this.model.discount}));
      Module.tableStores.cancreas.addView(new TableView({proxy: this.model.cancreas}));

      resolve();
    }.bind(this));
  }
  
  inView(params) {
    const self = this;

    const decide = function(k, x) {
      //let model = this.model.toJSON();
      let data = this.model[k].toJSON();
      let active = 0, inactive = 0;

      for (let rec of data) {
        if (rec.active) {
          active++;
        }
        else {
          inactive++;
        }

        self.model.lengths[k] = {active, inactive};
      }
    };

    for (let k of this.tables) {
      this.$addWatched(k+'.length', decide.bind(this, k), true);
    }

    if (this.returned) {
      // bypass any setup
    }

    this.returned = true;
  }

  outView() {
    return true;  
  }

  newItem(obj) {
    let cat = obj.args[0];
    
    Module.pager.go('/' + cat);
  }

  editItem(obj) {
    let cat = obj.args[0];
    let row = obj.args[1];

    let data = this.model[cat].toJSON();
    let code = data[row].code;

    Module.pager.go(`/${cat}/${code}`);
  }

  sortItems(obj) {
    let cat = obj.args[0];
    let col = obj.args[1];
    let data = this.model[cat].toJSON();    

    let sortFunc = function(a, b) {
      return (a.active < b.active) ? 1 : (a.active > b.active) ? -1 : (a[col] < b[col]) ? -1 : (a[col] > b[col]) ? 1 : 0;
    }

    data.sort(sortFunc);

    this.model[cat] = data;
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-start');   // page html
let setup1 = new Item('items-start-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/start', title: 'Items', sections: [section1]});

Module.pages.push(page1);