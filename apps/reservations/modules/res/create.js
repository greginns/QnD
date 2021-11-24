import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Rescreate extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.main = {};
    this.model.errors = {};
    this.model.errors.main = {};

    this.model.companies = [];
    this.model.currencies = [];
    this.model.areas = [];

    this.model.name = '';
    this.model.title = '';
    this.model.agentName = '';
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      Module.tableStores.company.addView(new TableView({proxy: this.model.companies, filterFunc}));
      Module.tableStores.area.addView(new TableView({proxy: this.model.areas, filterFunc}));

      this.defaults = await Module.tableStores.main.getDefault(); 

      this.setDefaults();
      this.getCompany();

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.status = params.status || 'A';
    this.contact = params.contact;

    this.makeTitle();
    this.getContact();
  }

  outView() {
    return true;  
  }

  async create(ev) {
    let data = this.model.main.toJSON();

    this.clearErrors();

    data.status = this.status;
    data.contact = this.contact;
    
    let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = await Module.tableStores.main.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Created', 2000);

      let rsvno = res.data.rsvno;

      Module.router.go('/' + rsvno);
    }
    else {
      this.displayErrors(res);
    }
    
    this.stopSpinner(ev, spinner);    
  }

  agentSearch(obj) {
    window.open('/searchpage/contact/search');
  }

  agentFound(id) {
    this.model.main.agent = id;
    this.getAgent();
  }

  async getAgent() {
    if (!this.model.main.agent) return;

    let res = await Module.tableStores.contact.getOne(this.model.main.agent);

    this.model.agentName = res.first + ' ' + res.last;    
  }

  setDefaults() {
    // set entry to default value
    this.model.main = {};

    for (let k in this.defaults) {
      this.model.main[k] = this.defaults[k];
    }
  }

  async getCompany() {
    let co = this.model.main.company;

    if (!co) return;

    let res = await Module.tableStores.company.getOne(co);

    let accepted = res.accepted || [];
    let currencies = [];

    for (let acc of accepted) {
      let res = await Module.tableStores.currency.getOne(acc);

      currencies.push(res);
    }

    this.model.currencies = currencies;
  }

  async getContact() {
    let res = await Module.tableStores.contact.getOne(this.contact);
    
    this.model.name = `${res.first} ${res.last}`;
  }

  makeTitle() {
    this.model.title = (this.status == 'Q') ? 'Quotation' : 'Reservation';
  }

  startSpinner(ev) {
    utils.modals.overlay(true);

    return utils.modals.buttonSpinner(ev.target, true);
  }

  stopSpinner(ev, spinner) {
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('rsvs-rsv-create');   // page html
let setup1 = new Rescreate('rsvs-rsv-create-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/create'], title: 'Reservation', sections: [section1]});

window.searchResults = function(id) {
  setup1.agentFound(id);
}

Module.pages.push(page1);