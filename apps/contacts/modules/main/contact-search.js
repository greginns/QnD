import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';

import '/~static/project/mixins/overlay.js';

class Contact extends MVC {
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
    Module.navbar.setActive('search');
  }

  outView() {
    Module.navbar.setInactive('search');

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
      MVC.$alert('No Search Criteria entered');
      return;
    }

    Module.pager.go('/contact/results', 'filters=' + JSON.stringify(contact));
  }

  // Account
  accessAccount() {}  

  saveAccount() {}

  addTag() {}

  formatTag() {}

  // ADDRESS
  async countryChanged(nv, ov) {
    if (!nv) return;

    this.model.regions = await Module.widgets.address.getRegions(nv);
  }

  async postcodeChanged() {
    let self = this;
    this.model.errors.contact.postcode = '';

    let postcode = this.model.contact.postcode;
    if (!postcode) return;

    let country = this.model.contact.country;
    let formattedPostcode = Module.widgets.address.formatPostcode(postcode, country);

    if (formattedPostcode == false) {
      this.model.errors.contact.postcode = 'Invalid Postal Code ' + postcode;
      this.model.contact.postcode = '';
      return;
    }

    this.model.contact.postcode = formattedPostcode;
    
    Module.widgets.address.getACity(country, formattedPostcode, function(city, region) {
      if (city) self.model.contact.city = city;
      if (region) self.model.contact.region = region;
    });
  }

  async cityChanged() {
    let self = this;
    let city = this.model.contact.city;
    let region = this.model.contact.region;
    let country = this.model.contact.country;
    let postcode = this.model.contact.postcode;

    if (!city) return;

    if (!postcode) {
      Module.widgets.address.getAPostcode(city, region, country, function(postcode, city, region) {
        if (postcode) self.model.contact.postcode = postcode;
        if (city) self.model.contact.city = city;
        if (region) self.model.contact.region = region;
      })
    }
    else {
      this.savePostalcode();
    }
  }

  savePostalcode() {
    // save postal code. 
    let city = this.model.contact.city;
    let region = this.model.contact.region;
    let country = this.model.contact.country;
    let postcode = this.model.contact.postcode;

    Module.widgets.address.savePostcode(city, region, country, postcode);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-contact-search');   // page html
let mvc1 = new Contact('contacts-contact-search-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/contact/search', title: 'Contact Search', sections: [section1]});

Module.pages.push(page1);