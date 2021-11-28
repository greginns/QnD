import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {io} from '/~static/lib/client/core/io.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {Notes} from '/~static/lib/client/widgets/notes.js';

class Rescreate extends Verror {
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
    this.origData = {};
    this.modals = {};

    this.notesInst = new Notes();
    this.processed = false;
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

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('rsvs-rsv-update');   // page html
let setup1 = new Rescreate('rsvs-rsv-update-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/:rsvno'], title: 'Reservation', sections: [section1]});

Module.pages.push(page1);