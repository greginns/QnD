import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class tagcat extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tagcat = {};
    this.model.existingEntry = false;
    this.model.tagcats = [];
    this.model.badMessage = '';
    this.model.errors = {
      tagcat: {},
      message: ''
    };

    this.tagcatOrig = {};
    this.defaults = {};

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let tagcats = new TableView({proxy: this.model.tagcats});

      Module.tableStores.tagcat.addView(tagcats);
    
      this.defaults.tagcat = await Module.data.tagcat.getDefault();      

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

  // IO
  async save(ev) {
    let tagcat = this.model.tagcat.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.tagcatOrig, tagcat);
      
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
    let res = (this.model.existingEntry) ? await Module.tableStores.tagcat.update(tagcat.id, diffs) : await Module.tableStores.tagcat.insert(tagcat);

    if (res.status == 200) {
      utils.modals.toast('Group', group.type + ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.tagcatOrig = this.model.tagcat.toJSON();

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

    let tagcat = this.model.tagcat.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.tagcat.delete(tagcat.id);

    if (res.status == 200) {
      utils.modals.toast('Tag Cat', 'Category Removed', 1000);
            
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
    
  // Clearing
  async canClear(ev) {
    let tagcat = this.model.tagcat.toJSON();
    let orig = this.tagcatOrig;
    let diffs = utils.object.diff(orig, tagcat);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  newEntry() {
    this.model.tagcat = {};
    this.model.existingEntry = false;

    this.setDefaults();
    this.tagcatOrig = this.model.tagcat.toJSON();

    this.$focus('tagcat.id');
    window.scrollTo(0,document.body.scrollHeight);
  }

  async existingEntry(pk) {
    this.model.tagcat = await Module.tableStores.tagcat.getOne(pk);
    this.model.existingEntry = true;

    this.tagcatOrig = this.model.tagcat.toJSON();
  }

  setDefaults() {
    // set entry to default value
    for (let k in this.defaults.tagcat) {
      this.model.tagcat[k] = this.defaults.tagcat[k];
    }

    this.tagcatOrig = this.model.tagcat.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-tagcats-create');   // page html
let el2 = document.getElementById('contacts-tagcats-update');   // page html
let tagcat1 = new tagcat('contacts-tagcats-create-section');
let tagcat2 = new tagcat('contacts-tagcats-update-section');
let section1 = new Section({mvc: tagcat1});
let section2 = new Section({mvc: tagcat2});
let page1 = new Page({el: el1, path: '/tagcats', title: 'Add E-Group', sections: [section1]});
let page2 = new Page({el: el2, path: '/tagcats/:id', title: 'Update E-Group', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);