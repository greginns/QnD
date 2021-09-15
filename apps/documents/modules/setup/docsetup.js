import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
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

    this.docsetupOrig = {};
    this.defaults = {};

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      this.defaults.docsetup = await Module.data.docsetup.getDefault();   
      this.model.companies = await Module.tableStores.company.getAll(); 

      let ret = await Module.data.document.getOne('_doctypes');   

      if (ret.status == 200) {
        this.model.docgroups = JSON.parse(ret.data);
      }

      resolve();
    }.bind(this));
  }
  
  inView(params) {
    this.clearErrors();
    this.setDefaults();
    this.getDocsetup();
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

    if (!this.model.existingEntry) delete docsetup.id;

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
        let doc = res.data[0];
        this.existingEntry(doc);

        filters = {default: true};

        let docres = await Module.data.document.getMany({filters});
        if (docres.status == 200 && docres.data.length> 0) {
          this.model.defaultDoc = docres.data[0].name;
        }

        let ltrres = await Module.data.docletter.getMany({filters});
        if (ltrres.status == 200 && ltrres.data.length> 0) {
          this.model.defaultLtr = ltrres.data[0].name;
        }
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

    this.model.defaultDoc = '';
    this.model.defaultLtr = '';
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