import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {io} from '/~static/lib/client/core/io.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {datetimer} from '/~static/lib/client/core/datetime.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {Notes} from '/~static/lib/client/widgets/notes.js';

class Resupdate extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.main = {};
    this.model.contact = {};
    this.model.company = {};
    this.model.area = {};
    this.model.cancreas = {};
    this.model.agent = {};
    this.model.currency = {};
    this.model.pmtterms = {};
    this.model.pmttermsx = {};

    this.model.errors = {};
    this.model.errors.main = {};

    this.model.companies = [];
    this.model.currencies = [];
    this.model.areas = [];
    this.model.pmttermss = [];

    this.model.text = {};

    this.model.days = [];

    this.origData = {};
    this.modals = {};
    this.availData = {};
    this.notesInst = new Notes();
    this.processed = false;
    this.itemManager;
  }

  async ready() {
    let self = this;

    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    let getNoteCats = async function() {
      // get the note categories
      let topics = [];

      let rec = await Module.tableStores.config.getOne('notecats');
      let data = rec.data || [];

      for (let cat of data) {
        topics.push({desc: cat});
      }

      self.notesInst.setTopics(topics);
    };

    this.itemManager = new ItemManager('rsvs-rsv-items-section');
    await this.itemManager.ready();

    return new Promise(async function(resolve) {
      Module.tableStores.company.addView(new TableView({proxy: this.model.companies, filterFunc}));
      Module.tableStores.area.addView(new TableView({proxy: this.model.areas, filterFunc}));
      Module.tableStores.pmtterms.addView(new TableView({proxy: this.model.pmttermss, filterFunc}));

      let opts = {keyboard: false, backdrop: 'static'};

      this.modals.status = new bootstrap.Modal(document.getElementById('editStatus'), opts);
      this.modals.guest = new bootstrap.Modal(document.getElementById('editGuest'), opts);
      this.modals.financials = new bootstrap.Modal(document.getElementById('editFinancials'), opts);
      this.modals.terms = new bootstrap.Modal(document.getElementById('editTerms'), opts);

      Module.tableStores.config.addWatchedRecord('notecats', getNoteCats);
      getNoteCats();

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    if (this.processed) return;   // to prevent redoing everthing if pager.back() to.  
    // if loading a new rsv, then set this.processed = false.

    this.rsvno = params.rsvno;

    this.model.main = await Module.tableStores.main.getOne(this.rsvno); 
    this.origData = this.$copy(this.model.main);

    await this.getContact();
    await this.getCompany();
    await this.getArea();
    await this.getAgent();
    await this.getCurrency();
    await this.getPmtTerms();

    this.makeTexts();

    this.processed = true;
  }

  outView() {
    return true;  
  }

  async update(ev) {
    let data = this.model.main.toJSON();
    let diffs = utils.object.diff(this.origData, data);
      
    if (Object.keys(diffs).length == 0) return;

    this.clearErrors();

    let spinner = this.startSpinner(ev);

    let res = await Module.tableStores.main.update(data.rsvno, diffs);
    
    if (res.status == 200) {
      if (data.contact != this.origData.contact) await this.getContact();
      if (data.company != this.origData.company) await this.getCompany();
      if (data.agent != this.origData.area) await this.getAgent();
      if (data.currency != this.origData.area) await this.getCurrency();
      if (data.pmttermsx != this.origData.pmttermsx) await this.getPmtTerms();

      this.makeTexts();

      utils.modals.toast('Updated', 2000);
      this.origData = res.data;
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  send() {
    let doctype = (this.model.main.status == 'A') ? 'invoiceA' : (this.model.main.status == 'Q') ? 'quote' : 'cancel';

    Module.pager.go(`/docsend/${doctype}/${this.model.main.rsvno}/${this.model.main.contact}`);
  }

  gotoContact() {
    window.open('/contactpage/contact/update/' + this.model.main.contact);
  }

  book(obj) {
    let cat = obj.args[0];

    this.itemManager.bookNew(cat);
  }

  /* Modals */
  getAModal(id) {
    let el = document.getElementById(id);
    return bootstrap.Modal.getInstance(el);
  }

  resetFromBailedOutModal() {
    // bailed out of modal, so set things back.
    for (let k in this.origData) {
      if (this.model.main[k] != this.origData[k]) {
        this.model.main[k] = this.origData[k];

        if (k == 'contact') this.getContact();
        if (k == 'agent') this.getAgent();
      }
    }

    this.makeTexts();
  }

  /* Status */
  editStatus() {
    this.modals.status.show();
  }

  async updateStatus(ev) {
    await this.update(ev)

    this.modals.status.hide();
  }
  
  resetStatus() {
    this.modals.status.hide();

    this.resetFromBailedOutModal();
  }

  async quote() {
    let res = await io.patch({}, `reservations/v1/main/${this.model.main.rsvno}/quote`);

    this.modals.status.hide();
  }

  async unQuote() {
    let res = await io.patch({}, `reservations/v1/main/${this.model.main.rsvno}/unquote`);

    this.modals.status.hide();
  }

  async cancel() {
    let res = await io.patch({}, `reservations/v1/main/${this.model.main.rsvno}/cancel`);

    this.modals.status.hide();
  }

  async unCancel() {
    let res = await io.patch({}, `reservations/v1/main/${this.model.main.rsvno}/uncancel`);

    this.modals.status.hide();
  }

  /* Guest */
  editGuest() {
    this.modals.guest.show();
  }

  async updateGuest(ev) {
    await this.update(ev)

    this.modals.guest.hide();
  }
  
  resetGuest() {
    this.modals.guest.hide();

    this.resetFromBailedOutModal();
  }

  contactSearch(obj) {
    window.searchResults = this.contactFound.bind(this);
    
    window.open('/searchpage/contact/search');
  }

  contactFound(id) {
    this.model.main.contact = id;
    this.getContact();
  }

  /* Financials */
  editFinancials() {
    this.modals.financials.show();
  }

  async updateFinancials(ev) {
    await this.update(ev)

    this.modals.financials.hide();
  }
  
  resetFinancials() {
    this.modals.financials.hide();

    this.resetFromBailedOutModal();
  }

  agentSearch(obj) {
    window.searchResults = this.agentFound.bind(this);
    
    window.open('/searchpage/contact/search');
  }

  agentFound(id) {
    this.model.main.agent = id;
    this.getAgent();
  }
  
  /* Pmt Terms */
  editTerms() {
    this.modals.terms.show();
  }

  async updateTerms(ev) {
    await this.update(ev)

    this.modals.terms.hide();
  }
  
  resetTerms() {
    this.modals.terms.hide();

    this.resetFromBailedOutModal();
  }

  /* Notes */

  async notesEdit(ev) {
    let notes = this.model.main.notes || [];
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let note = notes[idx];

    try {
      let ret = await this.notesInst.edit(note.topic, note.subject, note.operator, note.datetime, note.text);

      notes[idx] = {topic: ret.topic, subject: ret.subject, operator: note.operator, datetime: ret.datetime || utils.datetime.getCurrentDatetime(), text: ret.text};
      this.model.main.notes = notes;
      this.update();
    }
    catch(e) {
    }
  }

  async notesAdd(ev) {
    let notes = this.model.main.notes || [];
    let topic = '';
    let subject = '';
    let operator = App.USER.code;
    let datetime = utils.datetime.getCurrentDatetime();
    let text = '';

    try {
      let ret = await this.notesInst.edit(topic, subject, operator, datetime, text);

      notes.push({topic: ret.topic, subject: ret.subject, operator, datetime: ret.datetime || utils.datetime.getCurrentDatetime(), text: ret.text});
      
      this.model.main.notes = notes;
      this.update(ev);
    }
    catch(e) {
    }
  }

  /* Data Getters */
  async getCompany() {
    this.model.company = await Module.tableStores.company.getOne(this.model.main.company);

    let accepted = this.model.company.accepted || [];
    let currencies = [];

    for (let acc of accepted) {
      let res = await Module.tableStores.currency.getOne(acc);

      currencies.push(res);
    }

    this.model.currencies = currencies;
  }

  async getArea() {
    this.model.area = await Module.tableStores.area.getOne(this.model.main.area);
  }

  async getContact() {
    this.model.contact = await Module.tableStores.contact.getOne(this.model.main.contact);
  }

  async getAgent() {
    this.model.agent = (this.model.main.agent) ? await Module.tableStores.contact.getOne(this.model.main.contact) : {};
  }

  async getCurrency() {
    this.model.currency = await Module.tableStores.currency.getOne(this.model.main.currency);
  }

  async getCancreas() {
    this.model.cancreas = {};

    if (this.model.main.status == 'X') {
      this.model.cancreas = await Module.tableStores.cancreas.getOne(this.model.main.cancreas);
    }
  }

  async getPmtTerms() {
    this.model.pmtterms = (this.model.main.pmtterms) ? await Module.tableStores.pmtterms.getOne(this.model.main.pmtterms) : {};
    this.model.pmttermsx = (this.model.main.pmttermsx) ? await Module.tableStores.pmtterms.getOne(this.model.main.pmttermsx) : {};
  }

  makeTexts() {
    switch(this.model.main.status) {
      case 'A':
        this.model.text.status = 'Active';
        break;
      case 'Q':
        this.model.text.status = 'Quotation';
        break;
      case 'X':
        this.model.text.status = 'Cancelled';
        break;
      case 'I':
        this.model.text.status = 'Internet';
        break;
    }

    this.model.text.contact = this.model.contact.first + ' ' + this.model.contact.last;
  }

  startSpinner(ev) {
    utils.modals.overlay(true);

    return (ev) ? utils.modals.buttonSpinner(ev.target, true) : null;
  }

  stopSpinner(ev, spinner) {
    utils.modals.overlay(false);
    if (ev) utils.modals.buttonSpinner(ev.target, false, spinner);
  }
}

class ItemManager extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.home = document.getElementById('rsvs-rsv-items-list');
    this.els = {
      A: 'entry-item-A',
    };
    this.cats = {};
  }

  async ready() {
    this.cats['A'] = new Activity(this.els['A']);
    this.cats['A'].ready();
  }

  bookNew(cat) {
    let itemmgr = this.cats[cat]._section;

    this.home.prepend(itemmgr);
    itemmgr.style.display = 'block';
  }
}

class Activity extends Verror {
  // Needs res/ttot data from server
  // factor that in to space
  // sort times by boo/time
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.items = [];
    this.model.cats = [
      {text: 'Package', value: 'P'},
      {text: 'Transportation', value: 'T'},
      {text: 'Retail', value: 'S'},
      {text: 'Miscellaneous', value: 'O'},
      {text: 'Rental', value: 'R'},
      {text: 'Meal', value: 'M'},
      {text: 'Lodging', value: 'L'},
      {text: 'Activity', value: 'A'},
    ];

    this.model.codes = [];
    this.model.days = [];

    this.model.item = {cat: "A", pdesc: ['','','','','','',''], price: [0,0,0,0,0,0,0], pqty: [0,0,0,0,0,0,0], pextn: [0,0,0,0,0,0,0]};
    this.activity = {};

    this.model.actgroups = [];
    this.model.activity = [];       // overall list of activities from table
    this.model.activities = [];     // activites within a group
    this.model.facade = {};
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }
/*
    document.addEventListener('dropper-init', function(ev) {
      console.log('init', ev.detail)
    })

    document.addEventListener('dropper-open', function(ev) {
      console.log('open', ev.detail)
    })

    document.addEventListener('dropper-close', function(ev) {
      console.log('close', ev.detail)
    })
*/
    return new Promise(async function(resolve) {
      Module.tableStores.actgroup.addView(new TableView({proxy: this.model.actgroups, filterFunc}));
      Module.tableStores.activity.addView(new TableView({proxy: this.model.activity, filterFunc}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  ppl(ev) {
    if (ev.state == 'close' && ev.accept) {
      let text = [];
      let ppl = 0, qty = 0;

      for (let g of ['infants', 'children', 'youth', 'adults', 'seniors']) {
        if (this.model.item[g] > 0) {
          text.push(this.model.item[g] + '/' + g.substr(0,1).toUpperCase());
          ppl += parseInt(this.model.item[g]);
        }
      }

      this.model.facade.ppl = text.join(' ');
      this.model.item.ppl = ppl;
    }
  }

  code(ev) {
    if (ev.state == 'close' && ev.accept) {
      let code = this.model.item.code;
      let text = '';

      if (!code) return;

      this.activity = {};

      for (let act of this.model.activity) {
        if (act.code == code) {
          this.activity = act;
          text = act.name;
          break;
        }
      }

      this.model.facade.code = text;

      this.model.item.qty = Math.ceil(this.model.item.ppl / parseInt(this.activity.maxppl) || 1);
      this.model.item.dur = this.activity.durdays;

      this.processTimes();
      this.getRates();
    }
  }

  time(ev) {
    if (ev.state == 'close' && ev.accept) {
      this.model.facade.time = this.model.item.times[0];
    }
  }

  rate(ev) {
    if (ev.state == 'close' && ev.accept) {
      let rateno = this.model.item.rateno;
      let text = '';

      if (rateno) {
        for (let rate of this.model.rates) {
          if (rate.rateno == rateno) {
            text = rate.name;
            break;

          }
        }
      }

      this.model.facade.rate = text;
      console.log(this.model.item.toJSON())      
    }
  }

  processTimes() {
    this.model.facade.time = '';

    // [[{time info}, {time info}], [], ...]
    let fmt = 'YYYY-MM-DD';
    let dt = this.model.item.date;
    let dtx = datetimer(dt, fmt);
    let data = this.availData[this.model.item.code].dates, timedata = {},resdata = {}, ttotdata = {};
    let days = [];
    let dayCount = (this.activity.multi) ? this.activity.durdays : 1;
    let timeList = [];

    for (let day=0; day<dayCount; day++) {
      let times = [];
      dtx.add(day, 'days');
      let dtn = dtx.format(fmt);

      if (dtn in data) {
        timedata = data[dtn].times || {};
        resdata = data[dtn].res || {};
        ttotdata = data[dtn].ttot || {};

        for (let tm in timedata) {
          let text = tm.substr(0,5).padEnd(10, ' ') + String(timedata[tm]['limit']).padStart(10, ' ') + String(timedata[tm]['booked']).padStart(10, ' ') + String(timedata[tm]['avail']).padStart(10, ' ');
          text = text.replaceAll(' ', '\xA0');

          timedata[tm]['time'] = tm;
          timedata[tm]['text'] = text;

          times.push(timedata[tm]);
        }

        days.push({day: day+1, times});
        timeList.push(times[0].time);
      }
      else {
        days.push([{day: day+1, times: [{text: 'No Time', time: ''}]}]);  // no times for you! (on this date)
        timeList.push('');
      }
    }

    // sort times by boo/time
    if (days.length > 0) {
      //for (let time of times)
      //  time.sort(function(a,b) {
      //    return (a.boo < b.boo) ? -1 : (a.boo > b.boo) ? 1 : (a.time < b.time) ? -1 : (a.time > b.time) ? 1 : 0;
      //  })
  
      // find first time with space, for each day
      this.model.days = days;
      this.model.item.times = timeList;

      this.model.facade.time = timeList[0];
    }
  }

  async getAvail(cat, grp, code, filters) {
    // cat /cat
    // grp /cat/grp
    // code /cat/grp/code, or /cat//code
    let opts = {};
    let url = `/avail/v1/avail/${cat}`;

    if (grp ) url += `/${grp}`;
    if (code) url += `/${code}`;

    opts.filters = JSON.stringify(filters);

    return await io.get(opts, url);
  }

  determineSpace(rec, dt, ppl, alreadyBooked) {
    if (! (dt in rec.dates)) return 'text-danger';

    let dtInfo = rec.dates[dt];
    let klass = 'text-success';
    let maxAvail = 99999;

    ppl = parseInt(ppl);
    alreadyBooked = parseInt(alreadyBooked);

    for (let time in dtInfo.times) {
      let tmInfo = dtInfo.times[time];
      let avail = parseInt(tmInfo.avail);

      if (avail + alreadyBooked >= ppl) {
        maxAvail = Math.min(maxAvail, avail + alreadyBooked);
      }
    }

    if (maxAvail < ppl*1.1) klass = 'text-warning'
    if (maxAvail < ppl) klass = 'text-danger';
    
    return klass;
  }

  async groupChanged() {
    let codeList = [];
    let filters = {};
    let ppl = this.model.item.ppl || 1;
    let alreadyBooked = 0;
    let dt = this.model.item.date;

    filters.fromdate = dt;
    filters.todate = dt;
    filters.time = '';

    utils.modals.overlay(true);

    let group = this.model.item.group;
    let res = await this.getAvail('A', group, '', filters);
    
    if (res.status == 200) {
      this.availData = res.data;

      for (let code in res.data) {
        let rec = res.data[code];
        let klass = this.determineSpace(rec, dt, ppl, alreadyBooked);

        codeList.push({code: rec.code, name: rec.name, class: klass});
      }
    }
    else {
      Module.modal.alert(res.data.errors.message);
    }

    this.model.activities = codeList;

    utils.modals.overlay(false);
  }

  async getRates() {
    let code = this.model.item.code;
    let filters = {activity: code, active: true}
    let res = await Module.data.actrates.getMany({filters});
    let rates = [];

    this.model.item.rateno = '';

    rates = [{rateno: '', name: 'No Rate Selected'}];

    if (res.status == 200) {
      for (let rate of res.data) {
        rates.push(rate);
      }
    }

    this.model.rates = rates;
  }

  async rateChanged(obj) {
    let pobj = this.model.item.toJSON();

    pobj.rateno = this.model.item.rateno;

    if (!pobj.rateno) return;

    let res = await Module.data.pricing.insert(pobj);

    if (res.status == 200) {
      this.model.item.pdesc = res.data.pdesc;
      this.model.item.pqty = res.data.pqty;
      this.model.item.price = res.data.price;
      this.model.item.pextn = res.data.pextn;
    }
  }  
};

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('rsvs-rsv-update');   // page html

let setup1 = new Resupdate('rsvs-rsv-update-section');
let section1 = new Section({mvc: setup1});

//let setup2 = new Resitems('rsvs-rsv-items-section');
//let section2 = new Section({mvc: setup2});

let page1 = new Page({el: el1, path: ['/:rsvno'], title: 'Reservation', sections: [section1]});

Module.pages.push(page1);