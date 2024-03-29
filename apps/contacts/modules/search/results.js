import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

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
    if ('filters' in params) {
      this.search(JSON.parse(decodeURI(params.filters)));
    }
  }

  outView() {
    return true;  
  }

  async search(filters) {
    const ilikes = [
      'first',
      'last',
      'group',
      'address1',
      'address2',
      'city',
      'email',
      'email2',
      'emgname',
      'emgrelation',
      'occupation',
    ];
    
    const json = ['tags'];

    // build where rather than a plain select
    let idx = 0;
    let where = [], values = [];

    for (let field in filters) {
      idx++;

      if (ilikes.indexOf(field) > -1) {
        where.push(`"${field}" ILIKE $${idx} || '%'`);  // ILIKE and Starts with  ||'%'
        values.push(filters[field]);
      }
      else if (json.indexOf(field) > -1) {
        if (filters[field].indexOf(',') > -1) {
          // array
          where.push(`"${field}"::jsonb ?& $${idx}`);  // "field"::jsonb ?& ['1','2']  do all elements exist?
          values.push(filters[field].split(','));
        }
        else {
          where.push(`"${field}"::jsonb ? $${idx}`);  // "field"::jsonb ? '1'  does element exist?
          values.push(filters[field]);  
        }
      }
      else {
        where.push(`"${field}" = $${idx}`);
        values.push(filters[field]);
      }
    }

    where = where.join(' AND ');

    let res = await Module.data.contact.getMany({where, values});

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

    window.opener.searchResults(id);
    window.close();
    //Module.pager.go('/contact/update/' + id);
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