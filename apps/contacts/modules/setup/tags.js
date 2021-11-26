import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class tag extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tag = {};
    this.model.existingEntry = false;
    this.model.tags = [];
    this.model.tagcats = [];
    this.model.badMessage = '';
    this.model.errors = {
      tag: {},
      message: ''
    };

    this.tagOrig = {};
    this.defaults = {};

    this.model.navbarTitle = 'Tags';

    //this.ready(); //  use if not in router
  }

  async ready() {
    let activeFunc = function(rec) {
      return rec.active;
    }

    return new Promise(async function(resolve) {
      let tags = new TableView({proxy: this.model.tags});
      let tagcats = new TableView({proxy: this.model.tagcats, filterFunc: activeFunc});

      Module.tableStores.tag.addView(tags);
      Module.tableStores.tagcat.addView(tagcats);
    
      this.defaults.tag = await Module.data.tag.getDefault();      

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
    let tag = this.model.tag.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.tagOrig, tag);
      
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
    let res = (this.model.existingEntry) ? await Module.tableStores.tag.update(tag.id, diffs) : await Module.tableStores.tag.insert(tag);

    if (res.status == 200) {
      utils.modals.toast('Group', group.type + ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.tagOrig = this.model.tag.toJSON();

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

    let tag = this.model.tag.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.tag.delete(tag.id);

    if (res.status == 200) {
      utils.modals.toast('Tag', 'Tag Removed', 1000);
            
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
    let tag = this.model.tag.toJSON();
    let orig = this.tagOrig;
    let diffs = utils.object.diff(orig, tag);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  newEntry() {
    this.model.tag = {};
    this.model.existingEntry = false;

    this.setDefaults();
    this.tagOrig = this.model.tag.toJSON();

    this.$focus('tag.id');
    window.scrollTo(0,document.body.scrollHeight);
  }

  async existingEntry(pk) {
    this.model.tag = await Module.tableStores.tag.getOne(pk);
    this.model.existingEntry = true;

    this.tagOrig = this.model.tag.toJSON();
  }

  async testID() {
    let id = this.model.tag.id;
    let ret = await Module.tableStores.tag.getOne(id);
    
    if (Object.keys(ret).length == 0) return;

    let options = {text: id + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    this.model.tag.id = '';

    if (btn == 0) {
      // edit
      Module.pager.go('/tags/' + id);
    }
    else {
      // retry
      this.$focus('tag.id');
    }
  }

  setDefaults() {
    // set entry to default value
    for (let k in this.defaults.tag) {
      this.model.tag[k] = this.defaults.tag[k];
    }

    this.tagOrig = this.model.tag.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-tags-create');   // page html
let el2 = document.getElementById('contacts-tags-update');   // page html
let tag1 = new tag('contacts-tags-create-section');
let tag2 = new tag('contacts-tags-update-section');
let section1 = new Section({mvc: tag1});
let section2 = new Section({mvc: tag2});
let page1 = new Page({el: el1, path: '/tags', title: 'Add Tag', sections: [section1]});
let page2 = new Page({el: el2, path: '/tags/:id', title: 'Update Tag', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);