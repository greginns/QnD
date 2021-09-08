import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class Docsend extends Verror {
  constructor(element) {
    super(element);
  }

  async createModel() {
    this.contactID = 444;
    this.model.docsend = {};
    this.model.documents = [];
    this.model.docletters = [];
    this.model.contact = {};
    
    this.model.badMessage = '';
    this.model.errors = {
      docsend: {},
      message: ''
    };

    this.model.companies = [
      {text: 'Company-1', value: '1'},
      {text: 'Company-2', value: '2'}
    ];

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let ret = await Module.data.document.getOne('_doctypes');   

      if (ret.status == 200) {
        this.model.docgroups = JSON.parse(ret.data);
      }

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.clearErrors();

    this.model.docsend.doctype = params.doctype;
    this.model.docsend.ref1 = params.ref1;
    this.model.docsend.ref2 = (params.ref2) ? params.ref2 : '';

    this.company = await this.getCompanyFromDoc();
    this.docsetup = await this.getDocsetup();
    this.model.documents = await this.getDocuments();
    this.model.docletters = await this.getDocletters();
    this.model.contact = await this.getContact();
    this.getDocumentDefaults();
    this.getEmailDefaults();
  }

  outView() {
    return true;  
  }

  async getCompanyFromDoc() {
    let co = '1';

    switch (this.model.docsend.doctype) {
      case 'invoiceA':
      case 'invoiceB':
      case 'quote':
      case 'cancel':
      case 'receipt':
      case 'ccreceipt':
      case 'posreceipt':
      case 'posccreceipt':
        // get from rsv 
        break;

      case 'letter':
      case 'accreceipt':
      case 'accccreceipt':
        // get from contact 
        break;

      case 'giftcert':
      case 'gcreceipt':
      case 'gcccreceipt':
        // get from GC
        break;

      case 'rainchek':
        // get from RC
        break;
    }

    return co;
  }

  async getContact() {
    let contact = {};
    let res = await Module.data.contact.getOne(this.contactID);

    if (res.status == 200) {
      contact = res.data;
      this.model.docsend.custno = contact.id;
    }

    return contact;
  }

  async getDocsetup() {
    let docsetup = {};
    let filters = {company: this.company, doctype: this.model.docsend.doctype};
    let res = await Module.data.docsetup.getMany({filters});

    if (res.status == 200 && res.data.length > 0) {
      docsetup = res.data[0];
    }

    return docsetup;
  }

  async getDocuments() {
    let documents = [];
    let id = this.docsetup.id;
    let filters = {docsetup: id}

    let res = await Module.data.document.getMany({filters});

    if (res.status == 200) {
      documents = res.data;
    }

    return documents;
  }

  async getDocletters() {
    let docletters = [];
    let id = this.docsetup.id;
    let filters = {docsetup: id}

    let res = await Module.data.docletter.getMany({filters});

    if (res.status == 200) {
      docletters = res.data;
    }

    return docletters;
  }

  getDocumentDefaults() {
    let doc = '', ltr = '';

    for (let d of this.model.documents) {
      if (d.default) doc = d.id;
    }

    for (let d of this.model.docletters) {
      if (d.default) ltr = d.id;
    }

    this.model.docsend.document = doc;
    this.model.docsend.docletter = ltr;
  }

  getEmailDefaults() {
    for (let fld of ['fromaddr', 'toaddr', 'ccaddr', 'bccaddr', 'subject']) {
      this.model.docsend[fld] = this.docsetup[fld];
    }

    this.model.docsend['subjlist'] = this.docsetup.subjlist.split('\n');
  }

};


// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('documents-send');   // page html
let docsend1 = new Docsend('documents-send-section');
let section1 = new Section({mvc: docsend1});
let page1 = new Page({el: el1, path: '/docsend/:doctype/:ref1/:ref2', title: 'Document send', sections: [section1]});
//let page2 = new Page({el: el1, path: '/docsend/:doctype/:ref1', title: 'Document send', sections: [section1]});

Module.pages.push(page1);
//Module.pages.push(page2);