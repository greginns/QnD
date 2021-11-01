import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Datetime} from '/~static/lib/client/core/datetime.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Mealminppl extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'mealminppl';
    this.model.itemType = 'Rate'
    this.model.meals = {};
    this.model.mealminppl = {};
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

    this.model.month = '';
    this.model.year = '';

    this.model.range = {
      fromdate: '2021-10-01',
      todate: '2021-10-31',
      minppl: 0,
      dowall: true,
      dow: [true, true, true, true, true, true, true]
    };

    this.model.errors = {range: {}};

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

      this.editTable = new Edittable('#mealminppl', this, this.saver)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.rateno = params.rateno;
    this.meals = await Module.tableStores.meals.getOne(this.code);

    this.model.title = this.meals.name + ', Rate ' + this.rateno;
  }

  outView() {
    return true;  
  }

  async saver() {
    // called from editTable

    return await this.save();
  }

  async save(ev) {
    // minppls has our array of minppls
    // one entry per day/time.  Need to repack into [[day1], [day2]], where each day can have x times
    // mealminppl is the entry just edited
    let mealminppl = this.model.mealminppl.toJSON();
    let minppl = this.model.minppls.toJSON();

    // update the one being edited
    minppl[mealminppl.dayno] = {minppl: mealminppl.minppl};

    minppl = JSON.stringify(minppl);

    let data = {meal: this.meals.code, rateno: this.rateno, year: this.model.year, month: this.model.month, minppl};

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.mealminp.update([data.meal, data.rateno, data.year, data.month], {minppl: data.minppl}) : await Module.tableStores.mealminp.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Minimum', ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
    }
    else {
      this.displayErrors(res);
    }
    
    //this.stopSpinner(ev, spinner); 
    
    this.getMinppls();
    return true;
  }

  async getMinppls() {
    // need a one level array, so [[{time1, time2}], [day2]]
    let dt = new Datetime([this.model.year, this.model.month, 1]);
    let dsim = dt.getDaysInMonth();
    let minppls = [];

    let record = await this.getMinppl();

    if (Object.keys(record).length == 0) {
      // new record
      this.model.existingEntry = false;

      for (let d=0; d<dsim; d++) {
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();

        minppls.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), minppl: 0});
      }
    }
    else {
      this.model.existingEntry = true;

      for (let d=0; d<dsim; d++) {    // for each day
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();
        let rec = record.minppl[d];

        minppls.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), minppl: rec.minppl});
      }
    }

    this.model.minppls = minppls;
  }

  async getMinppl() {
    let act = this.meals.code;
    let rateno = this.rateno;
    let yy = this.model.year;
    let mm = this.model.month;

    return await Module.tableStores.mealminp.getOne([act, rateno, yy, mm]);
  }

  async canClear(ev) {
    let data = this.model.mealminppl.toJSON();
    return super.canClear(ev, data);
  }

  async saveRange(obj) {
    this.model.errors.range = {};

    let range =  this.model.range.toJSON();

    if (!range.fromdate) {
      this.model.errors.range.fromdate = 'Required';
      return;
    }

    if (!range.todate) {
      this.model.errors.range.todate = 'Required';
      return;
    }

    let dt1 = utils.datetime.pgDateToDatetime(this.model.range.fromdate);
    let dt2 = utils.datetime.pgDateToDatetime(this.model.range.todate);

    if (!dt1.isBefore(dt2)) {
      this.model.errors.range.todate = 'Must be after From Date';
      return;
    }

    let lods = dt1.listOfDays(dt2);   // [[yr, mo, [days]], [yr, mo, [days]]]

    if (lods.length > 12) {
      this.model.errors.range.todate = 'Too long of a date range';
      return;
    }

    let act = this.meals.code;
    let rateno = this.rateno;

    for (let entry of lods) {
      let yy = entry[0], mm = entry[1], dds = entry[2];
      let dt = utils.datetime.make([yy, mm]);
      let dsim = dt.getDaysInMonth();

      let res = await Module.tableStores.mealminp.getOne([act, rateno, yy, mm]);
      let existingEntry = Object.keys(res).length > 0;

      let minppl;
      
      if (!existingEntry) {
        minppl = this.createRangeMinppl(dsim);
        this.updateRangeMinppl(minppl, yy, mm, dds);
      }
      else {
        minppl = res.minppl;
        this.updateRangeMinppl(minppl, yy, mm, dds);
      }

      minppl = JSON.stringify(minppl);
  
      let data = {meal: act, rateno, year: yy, month: mm, minppl};
  
      // new (post) or old (put)?
      res = (existingEntry) ? await Module.tableStores.mealminp.update([data.meal, data.rateno, data.year, data.month], {minppl: data.minppl}) : await Module.tableStores.mealminp.insert(data);
  
      if (res.status == 200) {
        utils.modals.toast('Minimum', ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
     
      }
      else {
        this.displayErrors(res);
      }
    }
  }

  createRangeMinppl(dsim) {
    let minppl = [];

    for (let i=0; i<dsim; i++) {
      minppl.push({minppl: 0});
    }

    return minppl;
  }

  updateRangeMinppl(minppl, yy, mm, dds) {
    // minppl has one entry per date.  
    let range =  this.model.range.toJSON();
    let dows = range.dow;

    for (let dd of dds) {   // for each day of the month
      let dt = utils.datetime.make([yy, mm, dd]);
      let dow = dt.dow();

      if (dows[dow]) {
        minppl[dd-1] = {minppl: range.minppl};
      }
    }
  }

  dowallChanged() {
    let dowall = this.model.range.dowall;

    for(let i=0; i<7; i++) {
      this.model.range.dow[i] = dowall;
    }
  }

  test(ev) {
    console.log(this.model.range.toJSON())
  }

  goBack() {
    Module.pager.go(`/meals/${this.code}/rate/${this.rateno}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-minppl-meals');   // page html
let setup1 = new Mealminppl('items-minppl-meals-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/meals/:code/rate/:rateno/minppl'], title: 'meals Minimum People', sections: [section1]});

Module.pages.push(page1);