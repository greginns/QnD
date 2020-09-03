import {QnD} from '/~static/lib/client/core/qnd.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/router.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {io} from '/~static/lib/client/core/io.js';

import '/~static/project/mixins/overlay.js';
//import { stringify } from 'uuid';
//import moment from 'moment';

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
    this.model.ctrycode = 'CA';
    //this.model.contact.doe = moment()

    this.$addWatched('contact.country', this.countryChanged.bind(this));
    //this.$addWatched('contact.postcode', this.postcodeChanged.bind(this));
    this.$addWatched('contact.id', this.contactEntered.bind(this));
        
    this.contactOrig = {};
    this.defaults = {doe: window.moment()};
    this.contactListEl = document.getElementById('contactList');

    // fired when module gets common data
    document.addEventListener('tablestoreready', async function() {
      QnD.tableStores.contact.addView(new TableView({proxy: this.model.contacts}));
      QnD.tableStores.title.addView(new TableView({proxy: this.model.titles}));
      QnD.tableStores.group.addView(new TableView({proxy: this.model.groups}));
      QnD.tableStores.country.addView(new TableView({proxy: this.model.countries}));
    
      this.defaults.contact = await QnD.tableStores.contact.getDefault();
      this.setDefaults();      
    }.bind(this), {once: true})    

    //this.ready(); //  use if not in router
  }

  ready() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
    //document.getElementById('admin-manage-navbar-contacts').classList.add('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.add('disabled');
  }

  outView() {
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('disabled');

    return true;  
  }

  async test () {
    var title = 'test'
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

    var value = '12';

    let res = await QnD.widgets.singlesel.select(title, groups, value);
    console.log(res)
  }

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
    let res = (this.model.existingEntry) ? await QnD.tableStores.contact.update(contact.id, {contact: diffs}) : await QnD.tableStores.contact.insert({contact});

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
    
    let res = await QnD.tableStores.contact.delete(contact.id);

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
    this.clearList();

    this.model.existingEntry = false;
    window.scrollTo(0,0);
  }

  newContact() {
    this.$focus('contact.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // Contact selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.contact.id = id;

    window.scrollTo(0,document.body.scrollHeight);
  }

  async contactEntered(nv) {
    // Contact ID entered
    if (!nv) return;

    let ret = await this.getContactFromList(nv);

    if (ret.id) this.setContact(ret.id);
  }

  async getContactFromList(pk) {
    return (pk) ? await QnD.tableStores.contact.getOne(pk) : {};
  }
  
  async setContact(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.contact = await this.getContactFromList(pk);
    this.contactOrig = this.model.contact.toJSON();

    this.highlightList(pk);
  }

  highlightList(pk) {
    // highlight chosen contact in list
    let btn = this.contactListEl.querySelector(`button[data-pk="${pk}"]`);
    
    if (btn) btn.classList.add('active');
  }

  clearList() {
    // clear list of active entry
    let btn = this.contactListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
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

  // ADDRESSES
  async countryChanged(nv, ov) {
    if (!nv) return;

    await this.getRegions(nv);
  }

  async postcodeChanged() {
    let nv = this.model.contact.postcode;
    if (!nv) return;

    let pc = this.formatPostcode(nv);
    this.model.contact.postcode = pc;
    
    await this.getPostcodes(pc);
    this.handlePostcodes();
  }

  async getRegions(country) {
    let res = await io.get({filters: {country}}, '/contacts/v1/region');

    if (res.status == 200) {
      this.model.regions = res.data;
    }
  }

  async getPostcodes(postcode) {
    let country = this.model.contact.country;
    let res = await io.get({filters: {country, postcode}}, '/contacts/v1/postcode');

    if (res.status == 200) {
      this.model.postcodes = res.data;
    }
  }

  formatPostcode(pc) {
    // CC - country code.
    // A - alpha
    // N - numeric
    // rest is literal
    const country = this.model.contact.country;
    let formats;

    function getFormats(countries) {
      for (let ctry of countries) {
        if (ctry.id == country) {
          return ctry.format.split(',');
        }
      }

      return [];
    };

    function cleanupPostcode(npc) {
      return npc.toUpperCase().replace(/\s/g, "");
    }

    function formatIt(pc, formats) {
      const alphas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const max = 15;
      let antiloop = 0;

      for (let format of formats) {
        let pcw = pc, pcf = '', pidx=-1, fidx=-1;

        if (format.substr(0,2) == 'CC' && pcw.substr(0,2) != country) pcw = country + pcw;

        while(true) {
          fidx++;
          pidx++;
          antiloop++;
          if (antiloop > max) break;

          if (pidx >= pcw.length) break;

          let p = pcw.substr(pidx,1);
          let f = format.substr(fidx,1) || '';

          switch (f) {
            case 'A':
              // valid alpha?
              if (alphas.indexOf(p) == -1) continue;  // invalid character, skip it
              pcf += p;
              break;

            case 'N':
              // valid numeric?
              if (numbers.indexOf(p) == -1) continue;  // invalid character, skip it
              pcf += p;
              break;

            case 'C':
              // country character?
              pcf += p;
              break;
              
            default:
              // literal
              pcf += f;
              pidx--;
              break;
          }
        }

        if (pcf.length == format.length) {
          return pcf;
        }
      }

      return pc;
    }
    
    formats = getFormats(this.model.countries);
    if (!formats[0]) return pc;

    pc = cleanupPostcode(pc);
    pc = formatIt(pc, formats);

    return pc;
  }

  handlePostcodes() {
    let pcs = this.model.postcodes;

    if (pcs.length == 1) {
      this.model.contact.city = pcs[0].city;
      return;
    }

    if (pcs.length >= 1) {
      this.postcodeModalOpen();
    }
  }

  postcodeSelected(ev) {
    let pcs = this.model.postcodes;
    let idx = ev.target.closest('li').getAttribute('data-index');

    this.model.contact.city = pcs[idx].city;
    this.postcodeModalClose();

    this.$display(this.model.contact)
  }

  postcodeNotSelected() {
    this.postcodeModalClose();
  }

  postcodeModalOpen() {
    $('#contact-modal-postcode').modal('show');
  }

  postcodeModalClose() {
    $('#contact-modal-postcode').modal('hide');
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el = document.getElementById('contacts-contact');   // page html
let mvc = new Contact('contacts-contact-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/contact', title: 'Contacts', sections: [section1]});
    
QnD.pages.push(page);