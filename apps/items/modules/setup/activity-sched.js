import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Datetime} from '/~static/lib/client/core/datetime.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Actsched extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'actsched';
    this.model.itemType = 'Activity'
    this.model.activity = {};
    this.model.actsched = {};
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
      boo: 1,
      bow: 1,
      dowall: true,
      dow: [true, true, true, true, true, true, true]
    };

    this.model.bowo = [
      {text: 'N/A', value: '0'},
      {text: '1', value: '1'},
      {text: '2', value: '2'},
      {text: '3', value: '3'},
      {text: '4', value: '4'},
      {text: '5', value: '5'},
      {text: '6', value: '6'},
      {text: '7', value: '7'},
      {text: '8', value: '8'},
      {text: '9', value: '9'},
      {text: '10', value: '10'},
      {text: '11', value: '11'},
      {text: '12', value: '12'},
    ];

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

      this.editTable = new Edittable('#actsched', this, this.saver)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.activity = await Module.tableStores.activity.getOne(this.code);

    this.model.title = this.activity.name + ', Schedule';
  }

  outView() {
    return true;  
  }

  async saver() {
    // called from editTable

    return await this.save();
  }

  async save(ev) {
    // scheds has our array of scheds for the month
    // one entry per day/time.  Need to repack into [[day1], [day2]], where each day can have x times
    // actsched is the entry just edited
    let actsched = this.model.actsched.toJSON();
    let scheds = this.model.scheds.toJSON();
    let sched = [];
    let dt = new Datetime([this.model.year, this.model.month, 1]);
    let dsim = dt.getDaysInMonth();

    // repack sched
    for (let dayno=0; dayno<dsim; dayno++) {
      sched.push({});
    }

    for (let entry of scheds) {
      sched[entry.dayno][Datetime.timeRound(entry.time)] = {limit: entry.limit, boo: entry.boo, bow: entry.bow};
    }

    // update the one being edited
    sched[actsched.dayno][Datetime.timeRound(actsched.time)] = {limit: actsched.limit, boo: actsched.boo, bow: actsched.bow};

    //sched = JSON.stringify(sched);

    let data = {activity: this.activity.code, year: this.model.year, month: this.model.month, sched};

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.actsched.update([data.activity, data.year, data.month], {sched: data.sched}) : await Module.tableStores.actsched.insert(data);

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
    let dt = new Datetime([this.model.year, this.model.month, 1]);
    let dsim = dt.getDaysInMonth();
    let scheds = [];

    let record = await this.getActsched();

    if (Object.keys(record).length == 0) {
      // new record
      this.model.existingEntry = false;

      for (let d=0; d<dsim; d++) {
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();

        scheds.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), time: null, limit: 0, boo: 1, bow: 1});
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

          scheds.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), time, limit: data.limit, boo: data.boo, bow: data.bow});
        }       
      }
    }

    this.model.scheds = scheds;
  }

  async getActsched() {
    let act = this.activity.code;
    let yy = this.model.year;
    let mm = this.model.month;

    return await Module.tableStores.actsched.getOne([act, yy, mm]);
  }

  async canClear(ev) {
    let data = this.model.actrates.toJSON();
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

    let act = this.activity.code;

    for (let entry of lods) {
      let yy = entry[0], mm = entry[1], dds = entry[2];
      let dt = utils.datetime.make([yy, mm]);
      let dsim = dt.getDaysInMonth();

      let res = await Module.tableStores.actsched.getOne([act, yy, mm]);
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

      //sched = JSON.stringify(sched);
  
      let data = {activity: act, year: yy, month: mm, sched};
  
      // new (post) or old (put)?
      res = (existingEntry) ? await Module.tableStores.actsched.update([data.activity, data.year, data.month], {sched: data.sched}) : await Module.tableStores.actsched.insert(data);
  
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

        dayEntry[Datetime.timeRound(range.time)] = {limit: range.limit, boo: range.boo, bow: range.bow};
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
    Module.pager.go(`/activity/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-sched-activity');   // page html
let setup1 = new Actsched('items-sched-activity-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/activity/:code/sched'], title: 'Activity Schedule', sections: [section1]});

Module.pages.push(page1);