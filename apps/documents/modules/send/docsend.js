import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {io} from '/~static/lib/client/core/io.js';

class Docsend extends Verror {
  constructor(element) {
    super(element);
  }

  async createModel() {
    this.model.docsend = {};
    this.model.documents = [];
    this.model.docletters = [];
    this.model.contact = {};
    
    this.model.badMessage = '';
    this.model.errors = {
      docsend: {},
      message: ''
    };

    this.document = {};
    this.docletter = {};

    //this.ready(); //  use if not in router
  }

  async ready() {
    nunjucks.configure({ autoescape: true });

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
    
    this.getDocumentDefaults();
    this.getEmailDefaults();

    let docEl = this.$getElement('docsend.document');
    let ltrEl = this.$getElement('docsend.docletter');
    let ev = new Event('change');

    docEl.dispatchEvent(ev);
    ltrEl.dispatchEvent(ev);
  }

  outView() {
    return true;  
  }

  async send() {
    // test all email fields.
    this.clearErrors();

    if (this.testEmailFields1()) return;
    if (this.testEmailFields2()) return;

    // all good
    let doc = await this.buildDoc();
    let obj = {};
    let [from, fromName] = this.splitFromAddress(this.model.docsend.fromaddr);

    obj.from = from;
    if (fromName) obj.fromName = fromName;
    obj.msgTo = this.model.docsend.toaddr;
    if (this.model.docsend.ccaddr) obj.msgCC = this.model.docsend.ccaddr;
    if (this.model.docsend.bccaddr) obj.msgBCC = this.model.docsend.bccaddr;
    obj.subject = this.model.docsend.subject;
    obj.bodyHTML = doc;
    obj.attachments = [];

    let res = await App.utils.ee.sendOne({config: App.config, obj});

    if (res.success) {
      await this.recordEmailHistory(res.data);
      Module.modal.alert('Email Sent');
    }
    else {
      alert(res.message);
    }
  }

  async previewHTML() {
    let win = window.open('about:blank', '_preview');
    let doc = await this.buildDoc();

    win.document.write(doc);
    win.document.close();
  }

  async previewPDF() {
    let doc = await this.buildDoc();

    var f = document.createElement('form');
    f.setAttribute('method', 'post');
    f.setAttribute('target', 'new');
    f.setAttribute('action', '/documents/v1/puppeteer/html2pdf');
    f.setAttribute('name', 'html2pdf');

    var inp = document.createElement('input');
    inp.setAttribute('name', 'html');
    inp.setAttribute('type', 'hidden');
    inp.value = doc;

    f.appendChild(inp);
    document.body.appendChild(f);

    f.submit();

    //let res = await io.post({html: doc}, '/documents/v1/puppeteer/html2pdf');
    //console.log(res)
  }

  async buildDoc() {
    let body = await this.doMerge();
    let head = this.docsetup.head;
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

    return doc;
  }

  async doMerge() {
    let context = {};
    let doc = this.model.docsend.docsource;
    let ltr = this.model.docsend.ltrsource;
    let html;

    context.letter = ltr;
    
    switch (this.docsetup.ltrplace) {
      case 'A':
        html = doc + '<br>' + ltr;
        break;
      case 'B':
        html = ltr + '<br>' + doc;
        break;
      case 'X':
        // not sure yet.
        html = ltr;
        break;
    }

    await this.getMergeData(context);

    let txt = nunjucks.renderString(html, context);
    
    return txt;
  }

  async getMergeData(context) {
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
        co = '';
        contact = '';
        break;

      case 'letter':
      case 'accreceipt':
      case 'accccreceipt':
        // get from Contact
        let values = [this.model.docsend.contact];
        let res = await Module.data.contact.storedQuery({qid: 'contact-basic', values});

        if (res.status == 200) {
          context.contact = res.data[0];
        }
        break;

      case 'giftcert':
      case 'gcreceipt':
      case 'gcccreceipt':
        // get from GC
        co = '';
        contact = '';
        break;

      case 'rainchek':
        // get from RC
        co = '';
        contact = '';
        break;
    }
  }

  splitFromAddress(addr) {
    // <Send Name> emailaddress
    // return [email address, send name]
    let parts = addr.split('>');

    if (parts.length == 1) return [parts[0].trim(), ''];

    return [parts[1].trim(), parts[0].substr(1).trim()];
  }

  async getCompanyFromDoc() {
    // get company, set contact
    let co, contact;

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
        co = '';
        contact = '';
        break;

      case 'letter':
      case 'accreceipt':
      case 'accccreceipt':
        // get from Contact
        co = '';
        contact = this.model.docsend.ref1;
        break;

      case 'giftcert':
      case 'gcreceipt':
      case 'gcccreceipt':
        // get from GC
        co = '';
        contact = '';
        break;

      case 'rainchek':
        // get from RC
        co = '';
        contact = '';
        break;
    }

    this.model.docsend.contact = contact;
    this.model.contact = await this.getContact();

    if (!co) {
      co = this.model.contact.company;
    }

    return co;
  }

  async getContact() {
    let contact = {};
    let res = await Module.data.contact.getOne(this.model.docsend.contact);

    if (res.status == 200) {
      contact = res.data;
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

    if (!this.docsetup.fromaddr) this.model.docsend.fromaddr = `<${App.USER.name}> ${App.USER.email}`;
    if (!this.docsetup.toaddr) this.model.docsend.toaddr = this.model.contact.email;
  }

  async docChanged(obj) {
    let docID = this.model.docsend.document;
    this.document = {};

    if (docID) {
      let ret = await Module.data.document.getOne(docID);

      if (ret.status == 200) {
        this.document = ret.data;
        this.model.docsend.docsource = ret.data.body;
      }
    }
    else {
      this.model.docsend.docsource = '';
    }
  }

  async ltrChanged(obj) {
    let docID = this.model.docsend.docletter;
    this.docletter = {};

    if (docID) {
      let ret = await Module.data.docletter.getOne(docID);

      if (ret.status == 200) {
        this.docletter = ret.data;
        this.model.docsend.ltrsource = ret.data.body;
      }
    }
    else {
      this.model.docsend.ltrsource = '';
    }
  }
  
  testEmailFields1() {
    let anyErrors = false;

    for (let fld of ['fromaddr', 'toaddr', 'subject']) {
      if (!this.model.docsend[fld]) {
        this.model.errors.docsend[fld] = 'Required';
        anyErrors = true;
      }
    }

    return anyErrors;
  }

  testEmailFields2() {
    let anyErrors = false;
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/;

    for (let fld of ['fromaddr', 'toaddr', 'ccaddr', 'bccaddr']) {
      for (let addr of this.model.docsend[fld].split(',')) {
        if (addr) {
          if (addr.indexOf('>') > -1) addr = addr.substr(addr.indexOf('>')+1);
          addr = addr.trim();

          if (!re.test(addr)) {
            this.model.errors.docsend[fld] = 'Invalid Email Address Format: ' + addr;
            anyErrors = true;
          }
        }
      }
    }

    return anyErrors;
  }

  async recordEmailHistory(data) {
    let tid = data.transactionid;
    let hist = {};
    
    hist.contact = this.model.docsend.contact;
    hist.ref1 = this.model.docsend.ref1;
    hist.ref2 = this.model.docsend.ref2;
    hist.transid = tid;
    hist.datesent = (new Date()).toJSON();
    hist.doctype = this.model.docsend.doctype;
    hist.document = this.document.id;
    hist.docletter = this.docletter.id;
    hist.subject = this.model.docsend.subject;
    hist.from = this.model.docsend.fromaddr;
    hist.to = this.model.docsend.toaddr;
    hist.cc = this.model.docsend.ccaddr;
    hist.bcc = this.model.docsend.bccaddr;
    hist.user = App.USER.code;

    let res = await Module.data.emailhist.insert(hist);
  }

};

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('documents-send');   // page html
let docsend1 = new Docsend('documents-send-section');
let section1 = new Section({mvc: docsend1});
let page1 = new Page({el: el1, path: ['/docsend/:doctype/:ref1/:ref2', '/docsend/:doctype/:ref1'], title: 'Document send', sections: [section1]});

Module.pages.push(page1);