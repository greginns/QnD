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
    this.model.cats = ['A', 'L', 'M'];

    this.model.activity = [];
    this.model.lodging = [];
    this.model.meals = [];
    this.model.actgroup = [];
    this.model.actres = [];
    this.model.actttot = [];
    this.model.lodglocn = [];
    this.model.lodgtype = [];
    this.model.meallocn = [];
    this.model.mealtype = [];
    this.model.company = [];
    this.model.area = [];
    this.model.glcode = [];
    this.model.tax = [];
    this.model.waiver = [];
    this.model.template = [];
    this.model.supplier = [];
    this.model.reseller = [];
    this.model.pricelevel = [];
    this.model.pmtterms = [];
    this.model.lengths = {};

    this.tables = [
      'activity',
      'lodging',
      'meals',
      'actgroup',
      'actres',
      'actttot',
      'lodglocn',
      'lodgtype',
      'meallocn',
      'mealtype',
      'company',
      'area',
      'glcode',
      'tax',
      'waiver',
      'template',
      'supplier',
      'reseller',
      'pricelevel',
      'pmtterms',
    ];
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.activity.addView(new TableView({proxy: this.model.activity}));
      Module.tableStores.lodging.addView(new TableView({proxy: this.model.lodging}));
      Module.tableStores.meals.addView(new TableView({proxy: this.model.meals}));
      
      Module.tableStores.actgroup.addView(new TableView({proxy: this.model.actgroup}));
      Module.tableStores.actres.addView(new TableView({proxy: this.model.actres}));
      Module.tableStores.actttot.addView(new TableView({proxy: this.model.actttot}));
      
      Module.tableStores.lodglocn.addView(new TableView({proxy: this.model.lodglocn}));
      Module.tableStores.lodgtype.addView(new TableView({proxy: this.model.lodgtype}));
      
      Module.tableStores.meallocn.addView(new TableView({proxy: this.model.meallocn}));
      Module.tableStores.mealtype.addView(new TableView({proxy: this.model.mealtype}));

      Module.tableStores.company.addView(new TableView({proxy: this.model.company}));
      Module.tableStores.area.addView(new TableView({proxy: this.model.area}));
      Module.tableStores.glcode.addView(new TableView({proxy: this.model.glcode}));
      Module.tableStores.tax.addView(new TableView({proxy: this.model.tax}));
      Module.tableStores.waiver.addView(new TableView({proxy: this.model.waiver}));
      Module.tableStores.template.addView(new TableView({proxy: this.model.template}));
      Module.tableStores.supplier.addView(new TableView({proxy: this.model.supplier}));
      Module.tableStores.reseller.addView(new TableView({proxy: this.model.reseller}));
      Module.tableStores.pricelevel.addView(new TableView({proxy: this.model.pricelevel}));
      Module.tableStores.pmtterms.addView(new TableView({proxy: this.model.pmtterms}));

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