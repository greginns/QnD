import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/router.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Multisel} from '/~static/lib/client/widgets/multisel.js';

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
    this.model.tag='';

    this.model.existingEntry = false;
    this.model.badMessage = '';
    this.model.errors = {
      contact: {},
      message: ''
    };

    //this.model.contact.doe = moment()

    this.$addWatched('contact.country', this.countryChanged.bind(this));
        
    this.contactOrig = {};
    this.defaults = {doe: window.moment()};
    this.contactListEl = document.getElementById('contactList');

    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    // fired when module gets common data
    document.addEventListener('tablestoreready', async function() {
      // fill up on data
      Module.tableStores.contact.addView(new TableView({proxy: this.model.contacts}));
      Module.tableStores.title.addView(new TableView({proxy: this.model.titles, filterFunc}));
      Module.tableStores.group.addView(new TableView({proxy: this.model.groups, filterFunc}));
      Module.tableStores.country.addView(new TableView({proxy: this.model.countries}));
    
      this.defaults.contact = await Module.data.contact.getDefault();
    }.bind(this), {once: true})    

    //this.ready(); //  use if not in router
  }

  ready() {
    var self = this;

    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  async inView(params) {
    if ('id' in params) {
      // update 
      let res = await Module.tableStores.contact.getOne(params.id);
      
      if (Object.keys(res).length > 0) {
        this.setContact(res);
      }
      else {
        alert('Missing Contact');
        Module.pager.go('/contact/search');
      }
    }
    else {
      // create
      this.clearIt();
      this.setDefaults();
    }

    //document.getElementById('admin-manage-navbar-contacts').classList.add('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.add('disabled');
  }

  outView() {
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('disabled');

    return true;  
  }

  // IO
  async save(ev) {
    var contact = this.model.contact.toJSON();
    var diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.contactOrig, contact);
      
      if (Object.keys(diffs).length == 0) {
        this.model.badMessage = 'No Changes to Update';
        
        setTimeout(function() {
          this.model.badMessage = '';
        }.bind(this), 2500);

        return;
      }
    }      

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.contact.update(contact.id, diffs) : await Module.tableStores.contact.insert(contact);

    if (res.status == 200) {
      MVC.$toast('CONTACT',(this.model.existingEntry) ? contact.fullname + ' Updated' : 'Created', 2000);
   
      this.contactOrig = this.model.contact.toJSON();

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }
    
    MVC.$overlay(false);
    MVC.$buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let contact = this.model.contact.toJSON();
    let ret = await MVC.$reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.contact.delete(contact.id);

    if (res.status == 200) {
      MVC.$toast('CONTACT', 'Contact Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    MVC.$overlay(false);
    MVC.$buttonSpinner(ev.target, false, spinner);
  }
  
  // Screen handling
  async clear(ev) {
    if (await this.canClear(ev)) {
      this.clearIt();
    }
  }

  async canClear(ev) {
    let contact = this.model.contact.toJSON();
    let orig = this.contactOrig;
    let diffs = utils.object.diff(orig, contact);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await MVC.$reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }
  
  clearIt() {
    this.clearErrors();
    this.setDefaults();

    this.model.existingEntry = false;
  }
  
  async setContact(contact) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.contact = contact;
    this.contactOrig = this.model.contact.toJSON();
  }
  
  setDefaults() {
    // set contact to default value
    for (let k in this.defaults.contact) {
      this.model.contact[k] = this.defaults.contact[k];
    }

    this.contactOrig = this.model.contact.toJSON();
  }
  
  displayErrors(res) {
    if ('data' in res && 'errors' in res.data) {
      for (let key of Object.keys(res.data.errors)) {
        if (key == 'message') {
          this.setBadMessage(res.data.errors.message);  
        }
        else {
          if (!res.data.errors.message) this.model.badMessage = 'Please Correct any entry errors';

          for (let k in res.data.errors[key]) {
            this.model.errors[key][k] = res.data.errors[key][k];
          };  
        }
      }
    }
    
    this.model.errors._verify = res.data.errors._verify;
  }
  
  clearErrors() {
    for (let key of Object.keys(this.model.errors)) {
      if (this.model.errors[key] instanceof Object) {
        for (let key2 of Object.keys(this.model.errors[key])) {
          this.model.errors[key][key2] = '';
        }
      }
      else {
        this.model.errors[key] = '';
      }
    }

    this.model.badMessage = '';
  }

  setBadMessage(msg) {
    this.model.badMessage = msg;
  }

  // Account
  accessAccount() {
    $(this._section.querySelectorAll('div.contacts-contact-account')[0]).modal('show');
  }

  saveAccount() {
    $(this._section.querySelectorAll('div.contacts-contact-account')[0]).modal('hide');
  }

  // Tags
  async addTag() {
    let tags = this.model.contact.tags;

   var groups = [
     { 
       label: 'Group 1', 
       items: [{text: 'Item 1.1', value: '11'}, {text: 'Item 1.2', value: '12'}],
     },
     {
       label: 'Group 2',
       items: [{text: 'Item 2.1', value: '21'}, {text: 'Item 2.2', value: '22'}]
     }
   ];

    let ms = new Multisel('Tags', groups, []);
    let res = await ms.select();
    let dt = (new Date).toJSON();

    for (let tag of res) {
      tags.push({tag, 'date': dt});
    }

    ms = undefined;
    this.model.contact.tags = tags;
  }

  delTag(ev) {
    let tags = this.model.contact.tags;
    let tag = ev.target.closest('span.tag').getAttribute('data-tag');

    for (let x=0; x<tags.length; x++) {
      if (tags[x].tag == tag) {
        tags.splice(x,1);
        break;
      }
    }

    this.model.contact.tags = tags;
  }

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

  // GOTOs
  goto(ev) {
    let to = ev.target.getAttribute('to');
    let y = utils.findYPosition(this._section.getElementsByClassName(to)[0]);

    window.scrollTo({left: 0, top: y-40, behavior: 'smooth'});
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-contact-create');   // page html
let mvc1 = new Contact('contacts-contact-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/contact/create', title: 'Contact Create', sections: [section1]});

let el2 = document.getElementById('contacts-contact-update');   // page html
let mvc2 = new Contact('contacts-contact-update-section');
let section2 = new Section({mvc: mvc2});
let page2 = new Page({el: el2, path: '/contact/update/:id', title: 'Contact Update', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);