import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

class Emailhistory extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.hists = [];
    this.model.count = {};
    this.model.stats = {};

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
  
  async inView(params) {
    this.contact = params.contact;

    let values = [this.contact];
    let res = await Module.data.contact.storedQuery({qid: 'emailhist-basic', values});

    if (res.status == 200) {
      this.model.hists = res.data;
    }
  }

  outView() {
    return true;  
  }

  async getEE(ev) {
    let eid = ev.attrs.eid;
    let obj = {};
    let config = App.config;

    obj.transactionID = eid;
    obj.showDelivered = 'true';
    obj.showOpened = 'true';
    obj.showClicked = 'true';
    obj.showPending = 'true';
    obj.showFailed = 'true';

    let res = await App.utils.ee.getStatus({config, obj});
    let data = res.data;

    this.model.stats.status = data.status;
    this.model.stats.delivered = (data.delivered) ? data.delivered.join(', ') : '';
    this.model.stats.opened = (data.opened) ? data.opened.join(', ') : '';
    this.model.stats.clicked = (data.clicked) ? data.clicked.join(', ') : '';
    this.model.stats.pending = (data.pending) ? data.pending.join(', ') : '';

    if (data.failed) {
      let failed = data.failed.map(function(r) {
        return r.address + ": " + (r.error || 'Unknown Error');
      })
    
      this.model.stats.failed = failed.join(', ');
    }
    else {
      this.model.stats.failed = '';
    }

    this.model.count.delivered = data.deliveredcount;
    this.model.count.opened = data.openedcount;
    this.model.count.clicked = data.clickedcount;
    this.model.count.pending = data.pendingcount;
    this.model.count.failed = data.failedcount;

    this.modal = new bootstrap.Modal(this._section.querySelectorAll('div.contacts-contact-emailhistory-details')[0]);
    this.modal.show();
  }

  close() {
    Module.pager.go('/contact/update/' + this.contact)
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-contact-emailhistory');   // page html
let mvc1 = new Emailhistory('contacts-contact-emailhistory-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/contact/update/:contact/emailhistory', title: 'Email History', sections: [section1]});

Module.pages.push(page1);