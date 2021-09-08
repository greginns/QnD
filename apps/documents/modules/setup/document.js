import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Document extends Verror {
  constructor(element, docOrLetter) {
    super(element);

    this.docOrLetter = docOrLetter;
    this.modelName = (this.docOrLetter == 'letter') ? 'docletter' : 'document';
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

    this.docUl = this._section.querySelector('ul.docul');

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      this.defaults.document = await Module.data[this.modelName].getDefault();      

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.docsetupID = params.docsetup;
    this.model.docDesc = '';

    this.getAllDocs();
    let res = await Module.data.docsetup.getOne(this.docsetupID);
    
    if (res.status == 200) {
      this.docsetup = res.data;
      this.getDocDesc();
    }

    this.clearErrors();
    this.setDefaults();
    this.newDoc();
  }

  outView() {
    return true;  
  }

  // IO
  async save(ev) {
    let document = this.model.document.toJSON();
    let diffs;

    this.clearErrors();

    if (!document.name) {
      this.model.badMessage = 'No Document Name';
      return;
    }
          
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
    let res = (this.model.existingEntry) ? await Module.tableStores[this.modelName].update(document.id, diffs) : await Module.tableStores[this.modelName].insert(document);

    this.handleSaveResponse(res);
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  async saveQuiet() {
    let document = this.model.document.toJSON();

    if (!document.name) {
      return;
    }

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores[this.modelName].update(document.id, diffs) : await Module.tableStores[this.modelName].insert(document);

    this.handleSaveResponse(res);
  }
    
  handleSaveResponse(res) {
    if (res.status == 200) {
      utils.modals.toast(res.data.name, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);

      let document = res.data;
   
      if (this.model.existingEntry) {
        this.updateDocList(document);
      }
      else {
        this.model.existingEntry = true;
        this.insertDocList(document);
      }
      
      this.activateLi(document.id);
      this.model.document = document;
      this.documentOrig = document;

      if (document.default) this.handleDefaults(document);
    }
    else {
      this.displayErrors(res);
    }
  }

  async handleDefaults(doc) {
    // make sure only this one is the default document.
    let filters = {docsetup: this.docsetupID, default: true};
    let res = await Module.data[this.modelName].getMany({filters});

    if (res.status == 200) {
      for (let rec of res.data) {
        if (rec.id != doc.id && rec.default === true) {
          rec.default = false;

          await Module.tableStores[this.modelName].update(rec.id, {default: rec.default});
          this.updateDocList(rec);          
        }
      }
    }
  }

  async delete(ev) {
    if (!this.model.existingEntry) return;

    let document = this.model.document.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores[this.modelName].delete(document.id);

    if (res.status == 200) {
      utils.modals.toast(document.name, 'Removed', 1000);
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
      this.clearLIs();
      this.newEntry();
    }
  }

  async canClear(ev) {
    let document = this.model.document.toJSON();
    let orig = this.documentOrig;
    let ret = true;

    let diffs = utils.object.diff(orig, document);

    if (Object.keys(diffs).length > 0) {
      ret = await Module.modal.confirm('Abandon changes?');

      if (ret == 0) ret = true;
    }

    return ret;
  }

  clearLIs() {
    let lis = this.docUl.querySelectorAll('li');

    for (let li of Array.from(lis)) {
      li.classList.remove('active');
    }
  }

  activateLi(id) {
    let sel = `li[data-id="${id}"]`;
    let li = Array.from(this.docUl.querySelectorAll(sel))[0];

    li.classList.add('active');
  }

  insertDocList(doc) {
    let docs = this.model.documents.toJSON();
    docs.push(doc);

    this.sortDocList(docs);

    this.model.documents = docs;
  }

  updateDocList(doc) {
    let docs = this.model.documents.toJSON();

    for (let l=0; l<docs.length; l++) {
      if (doc.id == docs[l].id) {
        docs[l] = doc;
        break;
      }
    }

    this.sortDocList(docs);

    this.model.documents = docs;
  }

  sortDocList(docs) {
    docs.sort(function(a,b) {
      return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
    })
  }

  async newDoc() {
    if (await this.canClear()) {
      this.newEntry();
    }
  }

  async oldDoc(obj) {
    if (await this.canClear()) {
      this.clearLIs();

      let id = obj.attrs['data-id'];

      this.activateLi(id);
      this.getDocument(id);
    }
  }

  async getAllDocs() {
    this.model.documents = [];

    let filters = {docsetup: this.docsetupID};
    let res = await Module.data[this.modelName].getMany({filters});

    if (res.status == 200) {
      this.sortDocList(res.data);
      this.model.documents = res.data;
    }
  }

  async getDocument(id) {
    let res = await Module.data[this.modelName].getOne(id);

    if (res.status == 200) {
      let doc = res.data;
      this.existingEntry(doc);
    }
  }

  newEntry() {
    this.model.document = {};
    this.model.existingEntry = false;
    this.setDefaults();
    this.$focus('document.name');

    this.documentOrig = this.model.document.toJSON();
  }

  async existingEntry(doc) {
    this.model.document = doc;
    this.model.existingEntry = true;

    this.documentOrig = this.model.document.toJSON();
  }

  setDefaults() {
    // set entry to default value
    this.model.document = {};

    for (let k in this.defaults.document) {
      this.model.document[k] = this.defaults.document[k];
    }

    this.model.document.docsetup = this.docsetupID;
    delete this.model.document.id;

    this.documentOrig = this.model.document.toJSON();
  }

  getDocDesc() {
    let data = this.docsetup;
    this.doctype = data.doctype;

    for (let group of this.docgroups) {
      for (let item of group.items) {
        if (item.value == this.doctype) {
          this.model.docDesc = item.text;

          if (this.docOrLetter == 'letter') this.model.docDesc += ' Letter'
        }
      }
    }
  }

  view() {
    let head = this.docsetup.head;
    let body = this.model.document.body;
    let win = window.open('about:blank', '_testview');

    let doc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          ${head}
        </head>
        <body>
          ${body}
        </body>
      </html>
    `;

    win.document.write(doc);
    win.document.close();
  }

  async getExample() {
    if (!await this.canClear()) return;

    this.clear();

    let doctype = (this.docOrLetter == 'letter') ? 'letter' : this.doctype;

    let res = await Module.data[this.modelName].getOne('_'+doctype);

    if (res.status == 200) {
      this.model.document.body = res.data;
    }    
  }

  go() {
    Module.pager.go('/docsetup')
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('documents-document');   // page html
let document1 = new Document('documents-document-section', 'document');
let section1 = new Section({mvc: document1});
let page1 = new Page({el: el1, path: '/document/:docsetup', title: 'Document Design', sections: [section1]});

let el2 = document.getElementById('documents-docletter');   // page html
let document2 = new Document('documents-docletter-section', 'letter');
let section2 = new Section({mvc: document2});
let page2 = new Page({el: el2, path: '/docletter/:docsetup', title: 'Letter Design', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);