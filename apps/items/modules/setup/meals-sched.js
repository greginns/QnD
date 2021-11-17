import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Datetime} from '/~static/lib/client/core/datetime.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Mealsched extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'mealsched';
    this.model.itemType = 'Meal'
    this.model.meals = {};
    this.model.mealsched = {};
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
      time: '',
      limit: 0,
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

      this.editTable = new Edittable('#mealsched', this, this.saver)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.meals = await Module.tableStores.meals.getOne(this.code);

    this.model.title = this.meals.name + ', Schedule';
  }

  outView() {
    return true;  
  }

  async saver() {
    // called from editTable

    return await this.save();
  }

  async save(ev) {
    // scheds has our array of scheds
    // one entry per day/time.  Need to repack into [[day1], [day2]], where each day can have x times
    // mealsched is the entry just edited
    let mealsched = this.model.mealsched.toJSON();
    let scheds = this.model.scheds.toJSON();
    let sched = [];
    let dt = new Datetime([this.model.year, this.model.month, 1]);
    let dsim = dt.getDaysInMonth();

    // repack sched
    for (let dayno=0; dayno<dsim; dayno++) {
      sched.push({});
    }

    for (let entry of scheds) {
      sched[entry.dayno][entry.time] = {limit: entry.limit};
    }

    // update the one being edited
    sched[mealsched.dayno][mealsched.time] = {limit: mealsched.limit};

    sched = JSON.stringify(sched);

    let data = {meal: this.meals.code, year: this.model.year, month: this.model.month, sched};

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.mealsched.update([data.meal, data.year, data.month], {sched: data.sched}) : await Module.tableStores.mealsched.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Schedule', ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
    }
    else {
      this.displayErrors(res);
    }
    
    //this.stopSpinner(ev, spinner); 
    
    this.getScheds();
    return true;
  }

  async getScheds() {
    // need a one level array, so [[{time1, time2}], [day2]]
    let dt = new Datetime([this.model.year, this.model.month, 1]);
    let dsim = dt.getDaysInMonth();
    let scheds = [];

    let record = await this.getmealsched();

    if (Object.keys(record).length == 0) {
      // new record
      this.model.existingEntry = false;

      for (let d=0; d<dsim; d++) {
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();

        scheds.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), time: null, limit: 0});
      }
    }
    else {
      // unpack array entries into multiple entries, one per day/time
      this.model.existingEntry = true;

      for (let d=0; d<dsim; d++) {    // for each day
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();
        let day = record.sched[d];

        for (let time in day) {  // multiple time entries for each day
          let data = day[time];

          scheds.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), time, limit: data.limit});
        }       
      }
    }

    this.model.scheds = scheds;
  }

  async getmealsched() {
    let act = this.meals.code;
    let yy = this.model.year;
    let mm = this.model.month;

    return await Module.tableStores.mealsched.getOne([act, yy, mm]);
  }

  async canClear(ev) {
    let data = this.model.mealrates.toJSON();
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

    if (!range.time) {
      this.model.errors.range.time = 'Required';
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

    for (let entry of lods) {
      let yy = entry[0], mm = entry[1], dds = entry[2];
      let dt = utils.datetime.make([yy, mm]);
      let dsim = dt.getDaysInMonth();

      let res = await Module.tableStores.mealsched.getOne([act, yy, mm]);
      let existingEntry = Object.keys(res).length > 0;

      let sched;
      
      if (!existingEntry) {
        sched = this.createRangeSched(dsim);
        this.updateRangeSched(sched, yy, mm, dds);
      }
      else {
        sched = res.sched;
        this.updateRangeSched(sched, yy, mm, dds);
      }

      sched = JSON.stringify(sched);
  
      let data = {meal: act, year: yy, month: mm, sched};
  
      // new (post) or old (put)?
      res = (existingEntry) ? await Module.tableStores.mealsched.update([data.meal, data.year, data.month], {sched: data.sched}) : await Module.tableStores.mealsched.insert(data);
  
      if (res.status == 200) {
        utils.modals.toast('Schedule', ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
     
      }
      else {
        this.displayErrors(res);
      }
    }
  }

  createRangeSched(dsim) {
    let sched = [];

    for (let i=0; i<dsim; i++) {
      sched.push({});
    }

    return sched;
  }

  updateRangeSched(sched, yy, mm, dds) {
    // sched has one entry per date.  Each daily entry has X time entries
    // go through each day and either replace or add an entry with the new range data
    let range =  this.model.range.toJSON();
    let dows = range.dow;

    for (let dd of dds) {   // for each day of the month
      let dt = utils.datetime.make([yy, mm, dd]);
      let dow = dt.dow();

      if (dows[dow]) {
        // have one, what to do with it?
        let dayEntry = sched[dd-1];   // that day's entry

        dayEntry[range.time] = {limit: range.limit};
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
    Module.pager.go(`/meals/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-sched-meals');   // page html
let setup1 = new Mealsched('items-sched-meals-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/meals/:code/sched'], title: 'Meal Schedule', sections: [section1]});

Module.pages.push(page1);