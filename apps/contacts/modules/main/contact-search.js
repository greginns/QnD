import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Address} from '/~static/apps/contacts/utils/address.js'
import {ContactWithAddress} from '/~static/project/subclasses/simple-entry.js';

class Contact extends ContactWithAddress {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.contact = {};
    this.model.contacts = [];
    this.model.titles = [];
    this.model.groups = [];
    this.model.countries = [];
    this.model.regions = [];
    this.model.postcodes = [];

    this.model.existingEntry = false;
    this.model.badMessage = '';
    this.model.errors = {
      contact: {},
      message: ''
    };

    this.$addWatched('contact.country', this.countryChanged.bind(this));
        
    this.contactOrig = {};
    this.address = new Address();

    //this.ready(); //  use if not in router
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      // fill up on data
      Module.tableStores.title.addView(new TableView({proxy: this.model.titles, filterFunc}));
      Module.tableStores.group.addView(new TableView({proxy: this.model.groups, filterFunc}));
      Module.tableStores.country.addView(new TableView({proxy: this.model.countries}));

      resolve();
    }.bind(this));
  }
  
  inView() {
    if (Module.navbar) Module.navbar.setActive('search');
  }

  outView() {
    if (Module.navbar) Module.navbar.setInactive('search');

    return true;  
  }

  async search() {
    let contact = {};
    
    for (let key in this.model.contact) {
      if (this.model.contact[key] || this.model.contact[key] === false) {
        contact[key] = this.model.contact[key];
      }
    }

    if (Object.keys(contact).length == 0) {
      utils.modals.alert('No Search Criteria entered');
      return;
    }

    Module.pager.go('/contact/results', 'filters=' + JSON.stringify(contact));
  }

  // ghost classes
  accessAccount() {}  

  saveAccount() {}

  addTag() {}

  formatTag() {}

  clearList() {}
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-contact-search');   // page html
let mvc1 = new Contact('contacts-contact-search-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/contact/search', title: 'Contact Search', sections: [section1]});

Module.pages.push(page1);