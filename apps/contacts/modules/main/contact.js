import {App} from '/~static/lib/client/core/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Multisel} from '/~static/lib/client/widgets/multisel.js';
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
    this.model.egroups = [];
    this.model.tagcats = [];
    this.model.tags = [];
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

    this.$addWatched('contact.country', this.countryChanged.bind(this));
        
    this.contactOrig = {};
    this.defaults = {doe: window.dayjs()};
    this.contactListEl = document.getElementById('contactList');
    this.address = new Address();
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      // fill up on data
      Module.tableStores.contact.addView(new TableView({proxy: this.model.contacts}));
      Module.tableStores.title.addView(new TableView({proxy: this.model.titles, filterFunc}));
      Module.tableStores.group.addView(new TableView({proxy: this.model.groups, filterFunc}));
      Module.tableStores.egroup.addView(new TableView({proxy: this.model.egroups, filterFunc}));
      Module.tableStores.tagcat.addView(new TableView({proxy: this.model.tagcats}));
      Module.tableStores.tag.addView(new TableView({proxy: this.model.tags}));
      Module.tableStores.country.addView(new TableView({proxy: this.model.countries}));
    
      this.defaults.contact = await Module.data.contact.getDefault();

      resolve();
    }.bind(this));
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
  }

  outView() {
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

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.contact.update(contact.id, diffs) : await Module.tableStores.contact.insert(contact);

    if (res.status == 200) {
      utils.modals.toast('CONTACT',(this.model.existingEntry) ? contact.fullname + ' Updated' : 'Created', 2000);
   
      this.contactOrig = this.model.contact.toJSON();

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let contact = this.model.contact.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.contact.delete(contact.id);

    if (res.status == 200) {
      utils.modals.toast('CONTACT', 'Contact Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  // Screen handling
  async canClear(ev) {
    let contact = this.model.contact.toJSON();
    let orig = this.contactOrig;
    let diffs = utils.object.diff(orig, contact);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
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

  // Account
  accessAccount() {
    this.accessModal = new bootstrap.Modal(this._section.querySelectorAll('div.contacts-contact-account')[0]);
    this.accessModal.show();
  }

  saveAccount() {
    this.accessModal.hide();
  }

  // Tags
  formatTag(entry) {
    let span = document.createElement('span');
    let textspan = document.createElement('span');
    let xspan = document.createElement('span');
    let dt = dayjs(entry.date);
    let dtx = dt.format(App.dateFormat);
    let tmx = dt.format(App.timeFormat);

    xspan.classList.add('tagx');
    xspan.innerHTML = '&times;';
    xspan.addEventListener('click', this.delTag.bind(this));

    textspan.classList.add('tagtext');
    textspan.innerText = this.getTagDesc(entry.tag);

    span.classList.add('tag');
    span.classList.add('mb-2');
    span.title = dtx + ' ' + tmx;
    span.setAttribute('data-tag', entry.tag);
    span.setAttribute('data-toggle', 'tooltip');
    span.setAttribute('data-placement', 'top');
    span.appendChild(textspan);
    span.appendChild(xspan);

    (new bootstrap.Tooltip(span)).enable();

    return span;
  }

  getTagDesc(tag) {
    let desc = '';
    let cat = '';

    for (let t=0; t<this.model.tags.length; t++) {
      if (this.model.tags[t].id == tag) {
        desc += this.model.tags[t].desc;
        cat = this.model.tags[t].cat;
        break;
      }
    }

    if (cat) {
      for (let c=0; c<this.model.tagcats.length; c++) {
        if (this.model.tagcats[c].id == cat) {
          desc += '[' + this.model.tagcats[c].desc + ']';
          break;
        }
      }
    }

    return desc;
  }

  reorgTags() {
    // organize for multisel display
     /*{ 
       label: 'Group 1', 
       items: [{text: 'Item 1.1', value: '11'}, {text: 'Item 1.2', value: '12'}],
     },
     {
       label: 'Group 2',
       items: [{text: 'Item 2.1', value: '21'}, {text: 'Item 2.2', value: '22'}]
     }
   ];*/    
    let groups = [];

    for (let c=0; c<this.model.tagcats.length; c++) {
      if (this.model.tagcats[c].active) {
        groups.push({id: this.model.tagcats[c].id, label: this.model.tagcats[c].desc, items:[]});
      }
    }

    for (let t=0; t<this.model.tags.length; t++) {
      if (this.model.tags[t].active) {
        for (let g of groups) {
          if (g.id == this.model.tags[t].cat) {
            g.items.push({text: this.model.tags[t].desc, value: this.model.tags[t].id});
          }
        }
      }
    }

    return groups;
  }

  async addTag() {
    let tags = this.model.contact.tags;
    let groups = this.reorgTags();
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
    let span = ev.target.closest('span.tag')
    let tag = span.getAttribute('data-tag');

    (bootstrap.Tooltip.getInstance(span)).displose();

    for (let x=0; x<tags.length; x++) {
      if (tags[x].tag == tag) {
        tags.splice(x,1);
        break;
      }
    }

    this.model.contact.tags = tags;
  }

  // GOTOs
  goto(ev) {
    let to = ev.target.getAttribute('to');
    let y = utils.findYPosition(this._section.getElementsByClassName(to)[0]);

    window.scrollTo({left: 0, top: y-40, behavior: 'smooth'});
  }

  // ghost classes
  clearList() {}
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