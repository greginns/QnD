import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class title extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.title = {};
    this.model.existingEntry = false;
    this.model.titles = [];
    this.model.badMessage = '';
    this.model.errors = {
      title: {},
      message: ''
    };
        
    this.titleOrig = {};
    this.defaults = {};

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let titles = new TableView({proxy: this.model.titles});

      Module.tableStores.title.addView(titles);
    
      this.defaults.title = await Module.data.title.getDefault();      

      //this.$addWatched('title.id', this.testID.bind(this));

      resolve();
    }.bind(this));
  }
  
  inView(params) {
    this.clearErrors();

    if ('id' in params && params.id) {
      this.existingEntry(params.id);
    }    
    else {
      this.newEntry();
    }
  }

  outView() {
    return true;  
  }

  async save(ev) {
    var title = this.model.title.toJSON();
    var diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.titleOrig, title);
      
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
    let res = (this.model.existingEntry) ? await Module.tableStores.title.update(title.id, diffs) : await Module.tableStores.title.insert(title);

    if (res.status == 200) {
      utils.modals.toast('Title', title.title + ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.titleOrig = this.model.title.toJSON();

      setTimeout(function() {
        if (this.model.existingEntry) {
          this.go();
        }
        else {
          this.clearIt();
        }
      }.bind(this), 1000);
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let title = this.model.title.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.title.delete(title.id);

    if (res.status == 200) {
      utils.modals.toast('Title', 'Title Removed', 1000);
      
      setTimeout(function() {
        Module.pager.back();
      }, 1000)
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  async exit(ev) {
    if (await this.canClear(ev)) {
      this.go();
    }
  }

  go() {
    Module.pager.go('/setup');
  }

  async canClear(ev) {
    let title = this.model.title.toJSON();
    let orig = this.titleOrig;
    let diffs = utils.object.diff(orig, title);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  newEntry() {
    this.model.title = {};
    this.model.existingEntry = false;

    this.setDefaults();
    this.titleOrig = this.model.title.toJSON();

    window.scrollTo(0,document.body.scrollHeight);
    this.$focus('title.id');
  }

  async existingEntry(pk) {
    this.model.title = await Module.tableStores.title.getOne(pk);
    this.model.existingEntry = true;

    this.titleOrig = this.model.title.toJSON();
  }

  async testID() {
    let id = this.model.title.id;
    let ret = await Module.tableStores.title.getOne(id);
    
    if (Object.keys(ret).length == 0) return;

    let options = {text: id + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    this.model.title.id = '';

    if (btn == 0) {
      // edit
      Module.pager.go('/titles/' + id);
    }
    else {
      // retry
      this.$focus('title.id');
    }
  }

  setDefaults() {
    // set title to default value
    for (let k in this.defaults.title) {
      this.model.title[k] = this.defaults.title[k];
    }

    this.titleOrig = this.model.title.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-titles-create');   // page html
let el2 = document.getElementById('contacts-titles-update');   // page html
let title1 = new title('contacts-titles-create-section');
let title2 = new title('contacts-titles-update-section');
let section1 = new Section({mvc: title1});
let section2 = new Section({mvc: title2});
let page1 = new Page({el: el1, path: '/titles', title: 'Add Title', sections: [section1]});
let page2 = new Page({el: el2, path: '/titles/:id', title: 'Update Title', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);