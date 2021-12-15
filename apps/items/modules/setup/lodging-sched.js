import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Datetime} from '/~static/lib/client/core/datetime.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

/*
  non-unitized: no units, qty=?
  unitized: units, qty=1
  unitized+bookbeds: units, qty=?
*/

class Lodgsched extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'lodgsched';
    this.model.itemType = 'Lodging'
    this.model.lodging = {};
    this.model.lodgsched = {};
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
    this.model.unit = '';

    this.model.range = {
      fromdate: '2021-10-01',
      todate: '2021-10-31',
      units: [],
      limit: 0,
      dowall: true,
      dow: [true, true, true, true, true, true, true]
    };

    this.model.drop = {units: ''};
    this.model.unitlist = [];
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

      this.editTable = new Edittable('#lodgsched', this, this.saver)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    this.model.lodging = await Module.tableStores.lodging.getOne(this.code);
    let list = [];

    let filters = {lodging: this.code}
    let res = await Module.data.lodgunit.getMany({filters});

    if (res.status == 200) {
      for (let u of res.data) {
        list.push({value: u.seq, text: u.name});
      }
    }

    this.model.unitlist = list;
    this.model.title = this.model.lodging.name + ', Schedule';
    this.model.unitDesc = (this.model.lodging.bookbeds) ? 'Beds' : 'Qty';
  }

  outView() {
    return true;  
  }

  async saver() {
    // called from editTable

    return await this.save();
  }

  async save(ev) {
    // scheds has our array of days, for one unit
    // one entry per day/time.  Need to repack into [[day1], [day2]], where each day can have x units
    // lodgsched is the entry just edited
    let lodgsched = this.model.lodgsched.toJSON();
    let scheds = this.model.scheds.toJSON();
    let sched = [];
    let unit = (this.model.lodging.unitized) ? this.model.unit : '-1';

    if (this.model.existingEntry) {
      let record = await this.getLodgsched();
      sched = record.sched || {};
    }
    else {
      for (let entry of scheds) {   // for each day
        sched.push({[unit]: {limit: entry.limit}});
      }
    }

    // update the one being edited
    sched[lodgsched.dayno][unit] = {limit: lodgsched.limit};    

    //sched = JSON.stringify(sched);

    let data = {lodging: this.model.lodging.code, year: this.model.year, month: this.model.month, sched};

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.lodgsched.update([data.lodging, data.year, data.month], {sched: data.sched}) : await Module.tableStores.lodgsched.insert(data);

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
    let unit = (this.model.lodging.unitized) ? this.model.unit : '-1';
    let scheds = [];

    let record = await this.getLodgsched();

    if (Object.keys(record).length == 0) {
      // new record
      this.model.existingEntry = false;

      for (let d=0; d<dsim; d++) {
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();

        scheds.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), limit: 0});
      }
    }
    else {
      // look for specific unit
      this.model.existingEntry = true;

      for (let d=0; d<dsim; d++) {    // for each day
        let dt2 = (new Datetime(dt)).add(d, 'day');
        let dow = dt2.day();
        let day = record.sched[d];

        for (let xunit in day) {
          if (xunit == unit) {
            let data = day[xunit];
            scheds.push({dayno: d, weekend: (dow==0 || dow==6), date: dt2.format('dddd, MMM Do, YYYY'), limit: data.limit || 0});
          }
        }        
      }
    }

    this.model.scheds = scheds;
  }

  async getLodgsched() {
    let lodge = this.model.lodging.code;
    let yy = this.model.year;
    let mm = this.model.month;

    return await Module.tableStores.lodgsched.getOne([lodge, yy, mm]);
  }

  async canClear(ev) {
    let data = this.model.lodgrates.toJSON();
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

    if (range.units.length == 0 && this.model.lodging.unitized) {
      this.model.errors.range.units = 'Required';
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

    let lodge = this.model.lodging.code;
    let qty = (!this.model.lodging.unitized || this.model.lodging.bookbeds) ? range.limit : 1;
    let units = (this.model.lodging.unitized) ? range.units : [-1];

    for (let entry of lods) {
      let yy = entry[0], mm = entry[1], dds = entry[2];
      let dt = utils.datetime.make([yy, mm]);
      let dsim = dt.getDaysInMonth();

      let res = await Module.tableStores.lodgsched.getOne([lodge, yy, mm]);
      let existingEntry = Object.keys(res).length > 0;

      let sched;
      
      if (!existingEntry) {
        sched = this.createRangeSched(dsim);
        this.updateRangeSched(sched, yy, mm, dds, units, qty);
      }
      else {
        sched = res.sched;
        this.updateRangeSched(sched, yy, mm, dds, units, qty);
      }

      //sched = JSON.stringify(sched);
  
      let data = {lodging: lodge, year: yy, month: mm, sched};
  
      // new (post) or old (put)?
      res = (existingEntry) ? await Module.tableStores.lodgsched.update([data.lodging, data.year, data.month], {sched: data.sched}) : await Module.tableStores.lodgsched.insert(data);
  
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

  updateRangeSched(sched, yy, mm, dds, units, qty) {
    // sched has one entry per date.  Each entry is a {} with unit and qty
    let range = this.model.range.toJSON();
    let dows = range.dow;

    for (let dd of dds) {   // for each day of the month
      let dt = utils.datetime.make([yy, mm, dd]);
      let dow = dt.dow();

      if (dows[dow]) {
        // have one, what to do with it?
        let dayEntry = sched[dd-1];   // that day's entry
        
        for (let unit of units) {
          dayEntry[unit] = {limit: qty};
        }
      }
    }
  }

  dowallChanged() {
    let dowall = this.model.range.dowall;

    for(let i=0; i<7; i++) {
      this.model.range.dow[i] = dowall;
    }
  }

  dropdownUnits(ev) {
    if (ev.state == 'close' && ev.accept) {
      let text = [];
      let units = [];

      for (let unit of this.model.unitlist) {
        if (unit.checked) {
          text.push(unit.text);
          units.push(unit.value);
        }
      }

      this.model.drop.units = text.join(', ');
      this.model.range.units = units;
    }
  }

  test(ev) {
    console.log(this.model.range.toJSON())
  }

  goBack() {
    Module.pager.go(`/lodging/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-sched-lodging');   // page html
let setup1 = new Lodgsched('items-sched-lodging-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/lodging/:code/sched'], title: 'Lodging Schedule', sections: [section1]});

Module.pages.push(page1);