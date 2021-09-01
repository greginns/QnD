import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Editor} from '/~static/project/editor.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Document extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.document = {};
    this.model.documents = [];
    this.model.existingEntry = false;
    this.model.badMessage = '';
    this.model.errors = {
      document: {},
      message: ''
    };

    this.documentOrig = {};
    this.defaults = {};
    this.model.haveDoc = false;
    
    this.docgroups = [
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
    ];

    let editorEl = this._section.querySelector('div.editor-container');
    let toolbarEl = this._section.querySelector('div.toolbar-container');
    this.editor = new Editor(editorEl, toolbarEl);

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      this.defaults.document = await Module.data.document.getDefault();      

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.docsetup = params.docsetup;
    this.doctype = '';
    this.model.docDesc = '';

    this.getAllDocs();
    let res = await Module.data.docsetup.getOne(this.docsetup);
    
    if (res.status == 200) {
      this.doctype = res.data.doctype;

      for (let group of this.docgroups) {
        for (let item of group.items) {
          if (item.value == this.doctype) {
            this.model.docDesc = item.text;
          }
        }
      }
    }

    this.clearErrors();
    this.setDefaults();
  }

  outView() {
    return true;  
  }

  // IO
  async save(ev) {
    let document = this.model.document.toJSON();
    let diffs;

    document.text = this.editor.getText();

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.documentOrig, document);
      
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
    let res = (this.model.existingEntry) ? await Module.tableStores.document.update(document.id, diffs) : await Module.tableStores.document.insert(document);

    if (res.status == 200) {
      utils.modals.toast('document', ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.getdocument();  // re-get data to set statuses, etc
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let document = this.model.document.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.document.delete(document.id);

    if (res.status == 200) {
      utils.modals.toast('document', 'document Removed', 1000);
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);

    this.newEntry();
  }
  
  // Clearing
  async clear() {
    if (await this.canClear()) {
      this.newEntry();
    }
  }

  async canClear(ev) {
    let document = this.model.document.toJSON();
    let orig = this.documentOrig;
    let diffs = utils.object.diff(orig, document);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.confirm('Abandon changes?');
    }

    return ret;
  }

  async newDoc() {
    if (await this.canClear()) {
      this.newEntry();
    }
  }

  async oldDoc(ev) {
console.log(ev)    
    if (await this.canClear()) {
      let ul = ev.target.closest('ul');
      let lis = ul.querySelectorAll('li');

      for (let li of ArrayFrom(lis)) {
        li.classList.remove('active');
      }

      let li = ev.target.closest('li');
      let idx = li.getAttribute('data-index');
      li.classList.add('active');

      this.existingEntry(this.documents[idx]);
    }
  }

  async getAllDocs() {
    this.model.documents = [];

    let filters = {docsetup: this.docsetup};
    let res = await Module.data.document.getMany({filters});

    if (res.status == 200) {
      this.model.documents = res.data;
    }
  }

  async getDocument(ev) {
    console.log(ev)
  }

  newEntry(doc) {
    this.model.document = doc;
    this.model.existingEntry = false;
    this.model.haveDoc = true;
    this.setDefaults();
    this.model.haveDoc = true;
    this.editor.setText('');

    this.documentOrig = this.model.document.toJSON();
  }

  async existingEntry(doc) {
    this.model.document = doc;
    this.model.existingEntry = true;
    this.editor.setText(doc.text);

    this.documentOrig = this.model.document.toJSON();
  }

  setDefaults() {
    // set entry to default value
    this.model.document = {};

    for (let k in this.defaults.document) {
      this.model.document[k] = this.defaults.document[k];
    }

    this.model.document.docsetup = this.docsetup;

    this.documentOrig = this.model.document.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('documents-document');   // page html
let document1 = new Document('documents-document-section');
let section1 = new Section({mvc: document1});
let page1 = new Page({el: el1, path: '/document/:docsetup', title: 'Document Design', sections: [section1]});

Module.pages.push(page1);