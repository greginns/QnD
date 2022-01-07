import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {io} from '/~static/lib/client/core/io.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {datetimer} from '/~static/lib/client/core/datetime.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {Notes} from '/~static/lib/client/widgets/notes.js';

const AGEGROUPS = ['infants', 'children', 'youth', 'adults', 'seniors'];
const DATEFMT = 'YYYY-MM-DD';
const TIMEFMT = 'H:mm A';
const TIMEFMTRAW = 'H:mm:SS';

class Reserv extends Verror {
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
    this.itemManager.setRsvno(this.rsvno);
    this.itemManager.displayItems(this.rsvno);

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
  }

  async ready() {
  }

  setRsvno(rsvno) {
    this.rsvno = rsvno;
  }

  async displayItems() {
    let filters = {rsvno: this.rsvno};
    let res = await Module.data.item.getMany({filters});

    if (res.status != 200) return;

    for (let item of res.data) {
      let inst = await this.makeNewInstance(item.cat);

      inst.display(item);
    }
  }

  setRsvno(rsvno) {
    this.rsvno = rsvno;
  }

  async bookNew(cat) {
    let inst = await this.makeNewInstance(cat);
    
    inst.bookNew(this.bookRemove.bind(this));
  }

/*
  bookOld(obj) {
    let idx = obj.target.closest('div.row').getAttribute('data-index');
    let item = this.itemList[idx];

    this.createItem(item.cat);
    this.currentItem.bookOld(item, this.bookRemove.bind(this));
    this.displayItem();    
  }
*/
  bookRemove(posn) {
    console.log('remove',posn)
  }

  async makeNewInstance(cat) {
    let el = this.copyTemplate(cat);
    let inst = this.createItemInstance(cat, el);

    await inst.ready();

    inst.setRsvno(this.rsvno);

    return inst;
  }

  copyTemplate(cat) {
    let tid = 'entry-item-' + cat;
    let template = document.getElementById(tid);
    let clone = template.content.firstElementChild.cloneNode(true);

    this.home.appendChild(clone);

    return clone;
  }

  createItemInstance(cat, el) {
    let inst;

    switch(cat) {
      case 'A':
        inst = new Activity(el);
        break;

      case 'M':
        inst = new Meal(el);
        break;
    }

    return inst;
  }
}

class IncludesManager {
  constructor(section) {
    this.section = section.querySelector('div.includes');
    this.includes = [];
    this.mainItem = {};
  }

  clear() {
    this.section.innerHTML = '';
  }

  process(includes, mainItem, cat) {
    this.includes = includes;
    this.mainItem = mainItem;

    switch(cat) {
      case 'M':
        this.processM();
        break;
    }
  }

  processM() {
    //meals
    for (let incl of this.includes) {
      let obj = {};
      let day = parseInt(incl.day);
      let offset = parseInt(incl.offset);
      let date = this.mainItem.date;
      let datex = datetimer(date, DATEFMT);

      obj.cat = 'M';
      obj.meal = incl.meal;
      obj.code = incl.meal;
      obj.rateno = incl.mealrate;
      obj.dur = parseInt(incl.dur);
      obj.ppl = this.mainItem.ppl;
      obj.date = datex.add(day - 1, 'days').format(DATEFMT);
      obj.times = [];

      // age group numbers
      for (let ag of AGEGROUPS) {
        obj[ag] = this.mainItem[ag];
      }

      // times.
      for (let d=0; d<obj.dur; d++) {
        let t = (d < this.mainItem.times.length) ? this.mainItem.times[d] : this.mainItem.times[0];

        if (t) {
          let timer = datetimer(t, TIMEFMTRAW);

          obj.times.push(timer.add(offset, 'minutes').format(TIMEFMTRAW));
        }
        else {
          obj.times.push(t);
        }
      }

      console.log(obj)
    }    
  }
}

class BookItem extends Verror {
  // Needs res/ttot data from server
  // factor that in to space
  // sort times by boo/time
  constructor(el) {
    super(el);
  }

  createModel() {
    this.model.items = [];
    this.model.item = {};
    this.model.codes = [];
    this.model.days = [];
    this.model.rate = {};

    this.model.productGroups = [];      // groups
    this.model.products = [];           // all products
    this.model.groupProducts = [];      // products within a group

    this.model.product = {};
    this.model.discounts = [];
    this.model.discount = {};
    this.model.facade = {};

    this.model.viewState = 'view';

    this.existingData = {};
    this.klasses = {
      'A': 'act-color',
      'L': 'lodge-color',
      'R': 'rent-color',
      'M': 'meal-color',
      'O': 'other-color',
      'S': 'store-color',
      'T': 'trans-color',
      'P': 'package-color'
    };    

    this.rsvno = '';
    this.posn = -1;

    this.bookRemoveCallback;
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      Module.tableStores.discount.addView(new TableView({proxy: this.model.discounts, filterFunc}));

      resolve();
    }.bind(this));
  }

  setRsvno(rsvno) {
    this.rsvno = rsvno;
  }

  removeSelf() {
    this.model.viewState = 'view';

    this._section.remove();
  }

  bookNew(cb) {
    this.model.viewState = 'edit';
    this.existingData = {};
    this.bookRemoveCallback = cb;
    this.initItem();
  }

  display(item) {
    this.model.viewState = 'view';
    this.model.item = item;
    this.model.facade = item.snapshot.facade;

    delete this.model.item.snapshot;
  }

  endEdit() {
    this.model.viewState = 'view';
  }

  initItem() {
    this.model.facade = {};
    this.model.item = {
      rsvno: this.rsvno,
      cat: this.cat, 
      infants: 0, 
      children: 0, 
      youth: 0, 
      adults: 0, 
      seniors: 0, 
      times: [],
      ttimes: [],
      units: [],
      dur: 1,
      rateno: '',
      pdesc: ['','','','','','',''], 
      prices: [0,0,0,0,0,0,0], 
      pqty: [0,0,0,0,0,0,0], 
      pextn: [0,0,0,0,0,0,0],
    };
  }

// I/O
  async save(ev) {
    let item = this.model.item.toJSON();
    
    item.rsvno = this.rsvno;
    item.snapshot = JSON.parse(JSON.stringify(item));
    item.snapshot.facade = this.model.facade.toJSON();

    let res = (item.seq1) ? await Module.tableStores.item.update([item.rsvno, item.seq1], item) : await Module.tableStores.item.insert(item);
    if (res.status == 200) {
      this.model.item.seq1 = res.data.seq1;
      this.existingData = this.model.item.toJSON();
      this.model.viewState = 'view';
    }
    else {
      alert(res.message);
    }
  }

  async delete(ev) {
    if ('seq1' in this.model.item) {
      let res = await Module.data.item.delete([this.model.item.rsvno, this.model.item.seq1]);
      if (res.status == 200) {
        this.removeSelf();
      }
      else {
        alert(res.message);
      }
    }
    else {
      this.removeSelf();
    }
  }

// Calc Rtns  
  calcQty() {
    this.model.item.qty = Math.ceil(this.model.item.ppl / parseInt(this.model.product.maxppl) || 1);
  }

  calcEndDate() {
    let date = this.model.item.date, dur = this.model.item.dur;

    dur = parseInt(dur);
    if (this.model.item.cat != 'L') dur--;

    let dtx = datetimer(date, DATEFMT);
    dtx.add(dur, 'days');

    this.model.item.enddate = dtx.format(DATEFMT);
  }

  calcPpl() {
    let ppl = 0;

    for (let g of AGEGROUPS) {
      ppl += parseInt(this.model.item[g]);
    }

    this.model.item.ppl = ppl;
  }

  calcCharges() {
    let charges = 0, qty = this.model.item.pqty.toJSON(), price = this.model.item.price.toJSON();
    let extn = [0,0,0,0,0,0,0,0];

    for (let i=0; i<8; i++) {   // 8 is comped
      extn[i] = qty[i]*price[i];

      if (i<7) charges += extn[i];

      extn[i] = extn[i].toFixed(2);
    };

    this.model.item.pextn = extn;
    this.model.item.charges = charges.toFixed(2);
  }

// Rates
  async rateChanged(obj) {
    // rate selected by user
    await this.rePrice();

    this.doIncluded();
  }

  async rePrice() {
    await this.getPriceData();
    this.calcCharges();
  }

  async getPriceData() {
    let pobj = this.model.item.toJSON();

    pobj.rateno = this.model.item.rateno;

    if (pobj.rateno) {
      let res = await io.post({calc: pobj}, `/reservations/v1/calc/pricing`);

      if (res.status == 200) {
        this.model.item.pdesc = res.data.pdesc;
        this.model.item.pqty = res.data.pqty;
        this.model.item.price = res.data.price;
        this.model.item.pextn = res.data.pextn;
      }
    }
    else {
      this.model.item.pdesc = ['','','','','','','',''];
      this.model.item.pqty = [0,0,0,0,0,0,0,0];
      this.model.item.price = [0,0,0,0,0,0,0,0];
      this.model.item.pextn = [0,0,0,0,0,0,0,0];
    }
  }

  chooseRate() {
    let pastRate = this.existingData.rateno || '';
    let rateno = '';

    for (let rate of this.model.rates) {
      if (pastRate && pastRate == rate.rateno) {
        rateno = rate.rateno;
        break;
      }
    }

    if (!rateno) {
      rateno = (this.model.rates.length > 1) ? this.model.rates[1].rateno : '';   // [0] is "No Rate Selected"
    }

    this.model.item.rateno = rateno;
  }

// Discount Rtns
  changeDiscount() {
    let disc;

    if (!this.model.item.disccode) {
      this.model.item.discount = '0.00';
      this.model.item.discamt = '0';
      this.model.discount = {};

      return;
    }

    for (disc of this.model.discounts) {
      if (disc.code == this.model.item.disccode) {
        this.model.discount = disc;
        break;
      }
    }

    if (parseFloat(disc.amount) != 0) {
      this.model.item.discamt = disc.amount;
      this.model.discount.manual = false;
      this.calcDiscount();
    }
    else {
      this.model.discount.manual = true;
      this.model.item.discamt = '';
    }
  }

  async calcDiscount() {
    let pobj = {};    

    pobj.ppl = this.model.item.ppl;
    pobj.dur = this.model.item.dur;
    pobj.disccode = this.model.item.disccode;
    pobj.discamt = this.model.item.discamt;
    pobj.charges = this.model.item.charges;

    let res = await io.post({calc: pobj}, `/reservations/v1/calc/discount`);

    if (res.status == 200) {
      this.model.item.discount = res.data;
    }
  }

  removeDiscount(obj) {
    this.model.item.disccode = '';

    this.calcDiscount();
  }

// data gatherers ---------------------------------------------
  async getAvailForGroup() {
    // cat /cat
    // grp /cat/grp
    // code /cat/grp/code, or /cat//code
    let cat = this.model.item.cat;
    let code = '';
    let group = this.model.item.group;
    let dt = this.model.item.date.substring(0,10);
    let filters = {};

    filters.fromdate = dt;
    filters.todate = dt;
    filters.time = '';

    let opts = {};
    let url = `/avail/v1/avail/${cat}`;

    if (group) url += `/${group}`;
    if (code) url += `/${code}`;

    opts.filters = JSON.stringify(filters);
        
    utils.modals.overlay(true);
    let res = await io.get(opts, url);
    utils.modals.overlay(false);

    if (res.status == 200) {
      this.availData = res.data;
    }
    else {
      Module.modal.alert(res.data.errors.message);
      this.availData = {};
    }
  }

  async getRates() {
    let code = this.model.item.code;
    let filters = {[this.rateKey]: code, active: true}
    let rates = [{rateno: '', name: 'No Rate Selected'}];

    utils.modals.overlay(true);
    let res = await Module.data[this.rateTable].getMany({filters});
    utils.modals.overlay(false);    

    if (res.status == 200) {
      for (let rate of res.data) {
        rates.push(rate);
      }
    }

    this.model.rates = rates;
  }

// Facade
  makeFacadePpl() {
    let text = [];

    for (let g of AGEGROUPS) {
      if (this.model.item[g] > 0) {
        text.push(this.model.item[g] + '/' + g.substring(0,1).toUpperCase());
      }
    }

    return text.join(' ');
  }

  makeFacadeRate() {
    this.model.rate = {};
    let rateno = this.model.item.rateno;
    let text = '';

    if (rateno) {
      for (let rate of this.model.rates) {
        if (rate.rateno == rateno) {
          this.model.rate = rate;
          text = rate.name;
          break;
        }
      }
    }

    return text + '  $' + this.model.item.charges;
  }

  doIncluded() {

  }
}

/*********** ACTIVITY ************/
class Activity extends BookItem {
  // Needs res/ttot data from server
  // factor that in to space
  // sort times by boo/time
  constructor(el) {
    super(el);
  }

  createModel() {
    super.createModel();

    this.cat = 'A';
    this.rateKey = 'activity';
    this.rateTable = 'actrates';
    this.includes = new IncludesManager(this._section);
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    await super.ready();

    return new Promise(async function(resolve) {
      Module.tableStores.actgroup.addView(new TableView({proxy: this.model.productGroups, filterFunc}));
      Module.tableStores.activity.addView(new TableView({proxy: this.model.products, filterFunc}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  async edit() {
    this.model.viewState = 'edit';
    this.model.item.desc = this.model.product.name;
    this.model.item.activity = this.model.item.code;

    // setup all data
    await this.getRates();
    await this.handleGroupChange();
    this.handleTimes();
    await this.rePrice();
  }


// dropper close routines -------------------------------------------------
  async date(obj) {
    // date was changed
    if (this.model.item.code) {
      this.calcEndDate();
      await this.handleGroupChange();  // avail data
      this.handleTimes();        // re-select times
      await this.rePrice();         // get prices

      this.model.facade.time = this.makeFacadeTime();
      this.model.facade.rate = this.makeFacadeRate();
    }
  }

  async ppl(ev) {
    if (ev.state == 'close' && ev.accept) {
      this.model.facade.ppl = this.makeFacadePpl();
      this.calcPpl();

      if (this.model.item.code) {
        this.calcQty();
        this.handleTimes();        // re-select times
        await this.rePrice();         // get prices
        
        this.model.facade.time = this.makeFacadeTime();
        this.model.facade.rate = this.makeFacadeRate();
      }
    }
  }

  async code(ev) {
    if (ev.state == 'close' && ev.accept) {
      this.model.facade.code = this.makeFacadeCode();

      this.model.item.activity = this.model.item.code;
      this.model.item.dur = this.model.product.durdays;
      this.model.item.desc = this.model.product.name;
      this.model.item.rateno = '';

      this.calcQty();
      this.handleTimes();
      await this.getRates();
      this.chooseRate();
      await this.rateChanged();         // get prices

      this.model.facade.time = this.makeFacadeTime();
      this.model.facade.rate = this.makeFacadeRate();
    }
  }

  async time(ev) {
    if (ev.state == 'close' && ev.accept) {
      await this.rePrice();         // get prices

      this.model.facade.time = this.makeFacadeTime();     
      this.model.facade.rate = this.makeFacadeRate();
    }
  }

  rate(ev) {
    if (ev.state == 'close') {
      this.model.facade.rate = this.makeFacadeRate();
    }
  }

// derived fields -------------------------------------------------
  handleTimes() {
    this.makeTimeList();
    this.chooseTimes();
  }

  makeTimeList() {
    // [[{time info}, {time info}], [], ...]
    let dt = this.model.item.date.substring(0,10);
    let dtx = datetimer(dt, DATEFMT);
    let data = this.availData[this.model.item.code].dates || {}, timedata = {}, resdata = {}, ttotdata = {};
    let days = [];
    let dayCount = (this.model.product.multi) ? this.model.product.durdays : 1;

    for (let day=0, dtn; day<dayCount; day++) {
      let times = [];
      dtx.add(day, 'days');
      dtn = dtx.format(DATEFMT);

      if (dtn in data) {
        timedata = data[dtn].times || {};
        resdata = data[dtn].res || {};
        ttotdata = data[dtn].ttot || {};

        for (let tm in timedata) {
          let text = tm.substring(0,5).padEnd(10, ' ') + String(timedata[tm]['limit']).padStart(10, ' ') + String(timedata[tm]['booked']).padStart(10, ' ') + String(timedata[tm]['avail']).padStart(10, ' ');
          text = text.replaceAll(' ', '\xA0');

          timedata[tm]['time'] = tm;
          timedata[tm]['text'] = text;

          times.push(timedata[tm]);
        }

        days.push({day: day+1, times});
      }
      else {
        days.push([{day: day+1, times: [{text: 'No Time', time: ''}]}]);  // no times for you! (on this date)
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
    }
  }

  chooseTimes() {
    // [[{time info}, {time info}], [], ...]
    let existingTimes = this.model.item.times || [];
    let ppl = this.model.item.ppl;
    let exPpl = this.existingData.ppl || 0;
    let dt = this.model.item.date.substring(0,10);
    let dtx = datetimer(dt, DATEFMT);
    let data = this.availData[this.model.item.code].dates || {}, timedata = {}, resdata = {}, ttotdata = {};
    let dayCount = (this.model.product.multi) ? this.model.product.durdays : 1;
    let timeList = [];

    for (let day=0, dtn; day<dayCount; day++) {
      dtx.add(day, 'days');
      dtn = dtx.format(DATEFMT);

      if (dtn in data) {
        timedata = data[dtn].times || {};
        resdata = data[dtn].res || {};
        ttotdata = data[dtn].ttot || {};

        let found = false;
        let exTime = (existingTimes.length > day) ? existingTimes[day] : '';

        if (exTime in timedata && timedata[exTime].avail + exPpl >= ppl) {
          timeList.push(exTime);
          found = true;
        }

        if (!found) {
          for (let tm in timedata) {
            if (timedata[tm].avail + exPpl >= ppl) {
              timeList.push(tm);
              found = true;
              break;
            }
          }
        }

        if (!found) timeList.push('');
      }
      else {
        timeList.push('');
      }
    }

    this.model.item.times = timeList;
  }

// element events -----------------------------------------------
  async groupChanged() {
    await this.handleGroupChange();
  }

  async handleGroupChange() {
    // get avail
    // build list of items with space
    let codeList = [];
    let dt = this.model.item.date.substring(0,10);
    let ppl = parseInt(this.model.item.ppl) || 1;
    let exPpl = parseInt(this.existingData.ppl) || 0;    
    
    const determineSpace = function(rec) {
      if (! (dt in rec.dates)) return 'text-danger';
  
      let dtInfo = rec.dates[dt];
      let klass = 'text-success';
      let maxAvail = 99999;
  
      for (let time in dtInfo.times) {
        let tmInfo = dtInfo.times[time];
        let avail = parseInt(tmInfo.avail);
  
        if (avail + exPpl >= ppl) {
          maxAvail = Math.min(maxAvail, avail + exPpl);
        }
      }
  
      if (maxAvail < ppl*1.1) klass = 'text-warning'
      if (maxAvail < ppl) klass = 'text-danger';
      
      return klass;
    }    

    await this.getAvailForGroup();

    for (let code in this.availData) {
      let rec = this.availData[code];
      let klass = determineSpace(rec);

      codeList.push({code: rec.code, name: rec.name, class: klass});
    }

    this.model.groupProducts = codeList;    
  }

  async doIncluded() {
    // get included items - Meals, Rentals, Other
    let item = this.model.item.toJSON();

    if (!item.rateno) {
      this.includes.clear();
      return;
    }

    let filters = {activity: item.code, rateno: item.rateno};
    let res = await Module.data.actinclm.getMany({filters})

    if (res.status != 200) {
      alert(res.message);
      return;
    }

    this.includes.process(res.data, item, 'M');
  }

// facade routines -----------------------------------------------
  makeFacadeCode() {
    let code = this.model.item.code;
    let text = '';

    if (!code) return;

    this.model.product = {};

    for (let act of this.model.products) {
      if (act.code == code) {
        this.model.product = act;
        text = act.name;
        break;
      }
    }

    return text;
  }

  makeFacadeTime() {
    return (this.model.item.times.length>0) ? this.model.item.times[0] : '';
  }
};

class Meal extends BookItem {
  // Needs res/ttot data from server
  // factor that in to space
  // sort times by boo/time
  constructor(el) {
    super(el);
  }

  createModel() {
    super.createModel();
    
    this.cat = 'M';
    this.rateKey = 'meal';
    this.rateTable = 'mealrates';
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    await super.ready();

    return new Promise(async function(resolve) {
      Module.tableStores.meallocn.addView(new TableView({proxy: this.model.productGroups, filterFunc}));
      Module.tableStores.meals.addView(new TableView({proxy: this.model.products, filterFunc}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  async edit() {
    this.model.viewState = 'edit';
    this.model.item.desc = this.model.product.name;
    this.model.item.meal = this.model.item.code;

    // setup all data
    await this.getRates();
    await this.handleGroupChange();
    this.handleTimes();
    await this.rePrice();
  }

  buildInclude(item) {
    this.model.item = item;

    this.calcPpl();
    this.handleGroupChange();

    this.model.item.desc = this.model.product.name;
    this.model.item.meal = this.model.item.code;
    this.model.item.rateno = '';

    this.calcQty();
    this.handleTimes();
    await this.getRates();
    await this.rateChanged();         // get prices

    this.model.facade.ppl = this.makeFacadePpl();
    this.model.facade.code = this.makeFacadeCode();
    this.model.facade.time = this.makeFacadeTime();
    this.model.facade.rate = this.makeFacadeRate();
  }

// dropper close routines -------------------------------------------------
  async date(obj) {
    // date was changed
    this.processDate();
  }

  async ppl(ev) {
    if (ev.state == 'close' && ev.accept) {
      this.processPpl();
    }
  }

  async code(ev) {
    if (ev.state == 'close' && ev.accept) {
      this.processCode();
    }
  }

  async time(ev) {
    if (ev.state == 'close' && ev.accept) {
      this.processTime();
    }
  }

  rate(ev) {
    if (ev.state == 'close') {
      this.processRate();
    }
  }

  // processes
  processDate() {
    if (this.model.item.code) {
      this.calcEndDate();
      await this.handleGroupChange();  // avail data
      this.handleTimes();        // re-select times
      await this.rePrice();         // get prices
    }
  }

  processPpl() {
    this.model.facade.ppl = this.makeFacadePpl();
    this.calcPpl();

    if (this.model.item.code) {
      this.calcQty();
      this.handleTimes();        // re-select times
      await this.rePrice();         // get prices

      this.model.facade.time = this.makeFacadeTime();
      this.model.facade.rate = this.makeFacadeRate();        
    }    
  }

  processCode() {
    this.model.facade.code = this.makeFacadeCode();

    this.model.item.desc = this.model.product.name;
    this.model.item.meal = this.model.item.code;
    this.model.item.rateno = '';

    this.calcQty();
    this.handleTimes();
    await this.getRates();
    this.chooseRate();
    await this.rateChanged();         // get prices

    this.model.facade.time = this.makeFacadeTime();
    this.model.facade.rate = this.makeFacadeRate();    
  }

  processTime() {
    await this.rePrice();         // get prices

    this.model.facade.time = this.makeFacadeTime();
    this.model.facade.rate = this.makeFacadeRate();          
  }

  processRate() {
    this.model.facade.rate = this.makeFacadeRate();
  }

// derived fields -------------------------------------------------
  handleTimes() {
    this.makeTimeList();
    this.chooseTimes();
  }

  makeTimeList() {
    // [[{time info}, {time info}], [], ...]
    let dt = this.model.item.date.substring(0,10);
    let dtx = datetimer(dt, DATEFMT);
    let data = this.availData[this.model.item.code].dates || {}, timedata = {}, resdata = {}, ttotdata = {};
    let days = [];
    let dayCount = (this.model.product.multi) ? this.model.product.durdays : 1;

    for (let day=0, dtn; day<dayCount; day++) {
      let times = [];
      dtx.add(day, 'days');
      dtn = dtx.format(DATEFMT);

      if (dtn in data) {
        timedata = data[dtn].times || {};
        resdata = data[dtn].res || {};
        ttotdata = data[dtn].ttot || {};

        for (let tm in timedata) {
          let text = tm.substring(0,5).padEnd(10, ' ') + String(timedata[tm]['limit']).padStart(10, ' ') + String(timedata[tm]['booked']).padStart(10, ' ') + String(timedata[tm]['avail']).padStart(10, ' ');
          text = text.replaceAll(' ', '\xA0');

          timedata[tm]['time'] = tm;
          timedata[tm]['text'] = text;

          times.push(timedata[tm]);
        }

        days.push({day: day+1, times});
      }
      else {
        days.push([{day: day+1, times: [{text: 'No Time', time: ''}]}]);  // no times for you! (on this date)
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
    }
  }

  chooseTimes() {
    // [[{time info}, {time info}], [], ...]
    let existingTimes = this.model.item.times || [];
    let ppl = this.model.item.ppl;
    let exPpl = this.existingData.ppl || 0;
    let dt = this.model.item.date.substring(0,10);
    let dtx = datetimer(dt, DATEFMT);
    let data = this.availData[this.model.item.code].dates || {}, timedata = {}, resdata = {}, ttotdata = {};
    let dayCount = (this.model.product.multi) ? this.model.product.durdays : 1;
    let timeList = [];

    for (let day=0, dtn; day<dayCount; day++) {
      dtx.add(day, 'days');
      dtn = dtx.format(DATEFMT);

      if (dtn in data) {
        timedata = data[dtn].times || {};
        resdata = data[dtn].res || {};
        ttotdata = data[dtn].ttot || {};

        let found = false;
        let exTime = (existingTimes.length > day) ? existingTimes[day] : '';

        if (exTime in timedata && timedata[exTime].avail + exPpl >= ppl) {
          timeList.push(exTime);
          found = true;
        }

        if (!found) {
          for (let tm in timedata) {
            if (timedata[tm].avail + exPpl >= ppl) {
              timeList.push(tm);
              found = true;
              break;
            }
          }
        }

        if (!found) timeList.push('');
      }
      else {
        timeList.push('');
      }
    }

    this.model.item.times = timeList;
  }

// element events -----------------------------------------------
  async groupChanged() {
    await this.handleGroupChange();
  }

  async handleGroupChange() {
    // get avail
    // build list of items with space
    let codeList = [];
    let dt = this.model.item.date.substring(0,10);
    let ppl = parseInt(this.model.item.ppl) || 1;
    let exPpl = parseInt(this.existingData.ppl) || 0;    
    
    const determineSpace = function(rec) {
      if (! (dt in rec.dates)) return 'text-danger';
  
      let dtInfo = rec.dates[dt];
      let klass = 'text-success';
      let maxAvail = 99999;
  
      for (let time in dtInfo.times) {
        let tmInfo = dtInfo.times[time];
        let avail = parseInt(tmInfo.avail);
  
        if (avail + exPpl >= ppl) {
          maxAvail = Math.min(maxAvail, avail + exPpl);
        }
      }
  
      if (maxAvail < ppl*1.1) klass = 'text-warning'
      if (maxAvail < ppl) klass = 'text-danger';
      
      return klass;
    }    

    await this.getAvailForGroup();

    for (let code in this.availData) {
      let rec = this.availData[code];
      let klass = determineSpace(rec);

      codeList.push({code: rec.code, name: rec.name, class: klass});
    }

    this.model.groupProducts = codeList;    
  }

// facade routines -----------------------------------------------
  makeFacadeCode() {
    let code = this.model.item.code;
    let text = '';

    if (!code) return;

    this.model.product = {};

    for (let act of this.model.products) {
      if (act.code == code) {
        this.model.product = act;
        text = act.name;
        break;
      }
    }

    return text;
  }

  makeFacadeTime() {
    return (this.model.item.times.length>0) ? this.model.item.times[0] : '';
  }
};

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('rsvs-rsv-update');   // page html

let setup1 = new Reserv('rsvs-rsv-update-section');
let section1 = new Section({mvc: setup1});

let page1 = new Page({el: el1, path: ['/:rsvno'], title: 'Reservation', sections: [section1]});

Module.pages.push(page1);