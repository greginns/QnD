import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Docsetup extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.docsetup = {};
    this.model.existingEntry = false;
    this.model.badMessage = '';
    this.model.errors = {
      docsetup: {},
      message: ''
    };

    this.model.companies = [
      {text: 'Company-1', value: '1'},
      {text: 'Company-2', value: '2'}
    ];

    this.model.docgroups = [
      {label: 'Reservations', items: [
        {text: 'Customer Invoice', value: 'invoiceA'},
        {text: 'In-House Invoice', value: 'invoiceB'},
        {text: 'Itinerary', value: 'itinerary'},
        {text: 'Quotation', value: 'quote'},
        {text: 'Cancellation', value: 'cancel'},
        {text: 'Payment Receipt', value: 'receipt'},
        {text: 'CC Receipt', value: 'ccreceipt'},
      ]},
      {label: "Online", items: [
        {text: "Token", value: 'token'},
        {text: "Lost Password", value: 'pswdlost'},
        {text: "Temp Password", value: 'pswdtemp'},
        {text: "Signup", value: 'signup'},
      ]},
      {label: "Accounts", items: [
        {text: "Payment Receipt", value: 'accreceipt'},
        {text: "CC Receipt", value: 'accccreceipt'},
      ]},
      {label: "Gift Certificates", items: [
        {text: "Gift Certificate", value: 'giftcert'},
        {text: "Payment Receipt", value: 'gcreceipt'},
        {text: "CC Receipt", value: 'gcccreceipt'},
      ]},
      {label: "Point of Sale", items: [
        {text: "Receipt", value: 'posreceipt'},
        {text: "CC Receipt", value: 'posccreceipt'},
      ]},
      {label: "Other", items: [
        {text: "Letter", value: 'letter'},
        {text: "Voucher", value: 'raincheck'},
      ]},
    ]

    this.docsetupOrig = {};
    this.defaults = {};

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      this.defaults.docsetup = await Module.data.docsetup.getDefault();      

      resolve();
    }.bind(this));
  }
  
  inView(params) {
    this.clearErrors();
    this.setDefaults();
  }

  outView() {
    return true;  
  }

  // IO
  async save(ev) {
    let docsetup = this.model.docsetup.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.docsetupOrig, docsetup);
      
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
    let res = (this.model.existingEntry) ? await Module.tableStores.docsetup.update(docsetup.id, diffs) : await Module.tableStores.docsetup.insert(docsetup);

    if (res.status == 200) {
      utils.modals.toast('Docsetup', ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.docsetupOrig = this.model.docsetup.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let docsetup = this.model.docsetup.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.docsetup.delete(docsetup.id);

    if (res.status == 200) {
      utils.modals.toast('Docsetup', 'docsetup Removed', 1000);
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  // Clearing
  async clear() {
    if (this.canClear()) {
      this.setDefaults();
    }
  }

  async canClear(ev) {
    let docsetup = this.model.docsetup.toJSON();
    let orig = this.docsetupOrig;
    let diffs = utils.object.diff(orig, docsetup);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  async getDocsetup() {
    let docsetup = this.model.docsetup.toJSON();
    let company = docsetup.company;
    let doctype = docsetup.doctype;

    if (!company || !doctype) return;

    let filters = {company, doctype};
    let res = await Module.data.docsetup.getMany({filters});

    if (res.status == 200) {
      if (res.data.length == 0) {
        this.newEntry();
      }
      else {
        this.existingEntry(res.data[0]);
      }
    }
  }

  newEntry() {
    this.model.existingEntry = false;

    this.setDefaults();
    this.docsetupOrig = this.model.docsetup.toJSON();
  }

  async existingEntry(doc) {
    this.model.docsetup = doc;
    this.model.existingEntry = true;

    this.docsetupOrig = this.model.docsetup.toJSON();
  }

  setDefaults() {
    // set entry to default value
    let docsetup = this.model.docsetup.toJSON();
    this.model.docsetup = {};

    for (let k in this.defaults.docsetup) {
      this.model.docsetup[k] = this.defaults.docsetup[k];
    }

    this.model.docsetup.company = docsetup.company;
    this.model.docsetup.doctype = docsetup.doctype;

    this.docsetupOrig = this.model.docsetup.toJSON();
  }

  doc() {
    Module.pager.go('/document/' + this.model.docsetup.id);
  }

  letter() {
    Module.pager.go('/docletter/' + this.model.docsetup.id);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('documents-docsetup');   // page html
let docsetup1 = new Docsetup('documents-docsetup-section');
let section1 = new Section({mvc: docsetup1});
let page1 = new Page({el: el1, path: '/docsetup', title: 'Document setup', sections: [section1]});

Module.pages.push(page1);