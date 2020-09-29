import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
//import {TableView} from '/~static/lib/client/core/data.js';

import '/~static/project/mixins/overlay.js';

class Searchresults extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.headers = [];
    this.model.contacts = [];
    this.fields = [
      ['first', 'First Name'],
      ['last', 'Last Name'],
      ['email', 'Email Address'],
      ['address1', 'Street Address']
    ]

    return new Promise(function(resolve) {
      resolve();
    })          
    //this.ready(); //  use if not in router
  }

  ready() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView(params) {
    Module.navbar.setActive('search');

    if ('filters' in params) {
      this.search(JSON.parse(decodeURI(params.filters)));
    }
  }

  outView() {
    Module.navbar.setInactive('search');

    return true;  
  }

  async search(filters) {
    let res = await Module.data.contact.getMany({filters});

    if (res.status == 200 && res.data.length > 0) {
      this.display(res.data)
    }
  }

  searchAgain() {
    Module.pager.back();
  }

  newContact() {
    Module.pager.go('/contact/create');
  }

  updateContact(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let id = this.model.contacts[idx][this.model.contacts[idx].length-1]
    
    Module.pager.go('/contact/update/' + id);
  }

  display(data) {
    for (let d of data) {
      if (!d.address) d.address = '-'
    }

    this.model.headers = this.getHeaders();
    this.model.contacts = this.getData(data);
  }

  getHeaders() {
    let headers = this.fields.map(function(rec) {
      return rec[1];
    })

    return headers;    
  }

  getData(data) {
    let recs = [];
    let keys = this.fields.map(function(rec) {
      return rec[0];
    })

    for (let rec of data) {
      let entry = [];

      for (let key of keys) {
        entry.push(rec[key] || '-');
      }

      entry.push(rec.id);

      recs.push(entry);
    }

    return recs;
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-contact-results');   // page html
let mvc1 = new Searchresults('contacts-contact-results-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/contact/results', title: 'Contact Search Results', sections: [section1]});

Module.pages.push(page1);