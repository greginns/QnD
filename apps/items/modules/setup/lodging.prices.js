import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Datetime} from '/~static/lib/client/core/datetime.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Lodgprices extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'lodgprices';
    this.model.itemType = 'Rate'
    this.model.lodging = {};
    this.model.actrates = {};
    this.model.pricelevel = {};
    this.model.lodgprices = {};
    this.model.years = [];
    this.model.months = [
      {value: '1', text: 'January'},
      {value: '2', text: 'February'},
      {value: '3', text: 'March'},
      {value: '4', text: 'April'},
      {value: '5', text: 'May'},
      {value: '6', text: 'June'},
      {value: '7', text: 'July'},
      {value: '8', text: 'August'},
      {value: '9', text: 'September'},
      {value: '10', text: 'October'},
      {value: '11', text: 'November'},
      {value: '12', text: 'December'},
    ];

    this.model.prices = [];
    this.model.pdesc = [];
    this.model.month = '';
    this.model.year = '';
    this.model.time = '';
    this.hour = '0';
    this.minute = '0';

    this.model.existingEntry = false;
  }

  async ready() {
    return new Promise(async function(resolve) {
      let years = [];
      let dt = new Date();
      let yr = dt.getFullYear();

      for (let i=yr-2; i<yr+4; i++) {
        years.push({value: i, text: i});
      }

      this.model.years = years;
      this.model.year = yr;
      this.model.month = dt.getMonth()+1;

      this.editTable = new Edittable('#lodgprices', this, this.saver)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let pdesc = ['','','','','','',''];

    this.code = params.code;
    this.rateno = params.rateno || '';
    this.lodging = await Module.tableStores.lodging.getOne(this.code);
    this.actrates = await Module.tableStores.actrates.getOne([this.code, this.rateno]);
    this.pricelevel = await Module.tableStores.pricelevel.getOne(this.actrates.pricelevel);

    this.model.title = this.lodging.name + ' Rate ' + this.rateno;

    for (let i=1; i<=6; i++) {
      if (this.pricelevel['desc'+i]) pdesc[i-1] = this.pricelevel['desc'+i];
    }

    if (this.pricelevel.addl) pdesc[6] = this.pricelevel.addl;

    this.model.pdesc = pdesc;
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
    // lodgprices is the entry just edited
    const nullify = function(val) {
      return (val == '') ? null : val;
    }

    let lodgprices = this.model.lodgprices.toJSON();
    let prices = this.model.prices;
    let data = {lodging: this.lodging.code, rateno: this.actrates.rateno, year: this.model.year, month: this.model.month, prices: []};

    prices[lodgprices.dayno] = lodgprices;

    for (let entry of prices) {
      data.prices.push([nullify(entry.price0), nullify(entry.price1), nullify(entry.price2), nullify(entry.price3), nullify(entry.price4), nullify(entry.price5), nullify(entry.price6)]);
    }

    data.prices = JSON.stringify(data.prices);

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.lodgprices.update([data.lodging, data.rateno, data.year, data.month, data.hour, data.minute], {prices: data.prices}) : await Module.tableStores.lodgprices.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Rate ' + data.rateno, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
    }
    else {
      this.displayErrors(res);
    }
    
    //this.stopSpinner(ev, spinner); 
    
    this.getPrices();
    return true;
  }

  async getPrices() {
    let dt = new Datetime([this.model.year, this.model.month, 1]);
    let dsim = dt.getDaysInMonth();
    let prices = [];

    let record = await this.getLodgprices();

    if (Object.keys(record).length == 0) {
      // new record
      this.model.existingEntry = false;

      for (let d=0; d<dsim; d++) {
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();

        prices.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), price0: null, price1: null, price2: null, price3: null, price4: null, price5: null, price6: null, price7: null});
      }
    }
    else {
      this.model.existingEntry = true;

      for (let d=0; d<dsim; d++) {
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();

        prices.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), price0: record.prices[d][0], price1: record.prices[d][1], price2: record.prices[d][2], price3: record.prices[d][3], price4: record.prices[d][4], price5: record.prices[d][5], price6: record.prices[d][6], price7: record.prices[d][7]});        
      }
    }

    this.model.prices = prices;
  }

  async getLodgprices() {
    let act = this.lodging.code;
    let rateno = this.actrates.rateno;
    let yy = this.model.year;
    let mm = this.model.month;
    let hh = this.hour;
    let mins = this.minute;

    return await Module.tableStores.lodgprices.getOne([act, rateno, yy, mm, hh, mins]);
  }

  async canClear(ev) {
    let data = this.model.actrates.toJSON();
    return super.canClear(ev, data);
  }

  goBack() {
    Module.pager.go(`/lodging/${this.code}/rate/${this.rateno}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-price-lodging');   // page html
let setup1 = new Lodgprices('items-price-lodging-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/lodging/:code/rate/:rateno/prices'], title: 'Lodging Prices', sections: [section1]});

Module.pages.push(page1);