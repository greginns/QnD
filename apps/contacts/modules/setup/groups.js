import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class group extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.group = {};
    this.model.existingEntry = false;
    this.model.groups = [];
    this.model.badMessage = '';
    this.model.errors = {
      group: {},
      message: ''
    };

    this.groupOrig = {};
    this.defaults = {};

    this.model.navbarTitle = 'Group Types';

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let groups = new TableView({proxy: this.model.groups});

      Module.tableStores.group.addView(groups);
    
      this.defaults.group = await Module.data.group.getDefault();      

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
    let group = this.model.group.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.groupOrig, group);
      
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
    let res = (this.model.existingEntry) ? await Module.tableStores.group.update(group.id, diffs) : await Module.tableStores.group.insert(group);

    if (res.status == 200) {
      utils.modals.toast('Group', group.type + ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.groupOrig = this.model.group.toJSON();

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

    let group = this.model.group.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.group.delete(group.id);

    if (res.status == 200) {
      utils.modals.toast('Group', 'Group Removed', 1000);
            
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
    let group = this.model.group.toJSON();
    let orig = this.groupOrig;
    let diffs = utils.object.diff(orig, group);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  newEntry() {
    this.model.group = {};
    this.model.existingEntry = false;

    this.setDefaults();
    this.groupOrig = this.model.group.toJSON();

    this.$focus('group.id');
    window.scrollTo(0,document.body.scrollHeight);
  }

  async existingEntry(pk) {
    this.model.group = await Module.tableStores.group.getOne(pk);
    this.model.existingEntry = true;

    this.groupOrig = this.model.group.toJSON();
  }

  async testID() {
    let id = this.model.group.id;
    let ret = await Module.tableStores.group.getOne(id);
    
    if (Object.keys(ret).length == 0) return;

    let options = {text: id + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    this.model.group.id = '';

    if (btn == 0) {
      // edit
      Module.pager.go('/groups/' + id);
    }
    else {
      // retry
      this.$focus('group.id');
    }
  }

  setDefaults() {
    // set entry to default value
    for (let k in this.defaults.group) {
      this.model.group[k] = this.defaults.group[k];
    }

    this.groupOrig = this.model.group.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-groups-create');   // page html
let el2 = document.getElementById('contacts-groups-update');   // page html
let group1 = new group('contacts-groups-create-section');
let group2 = new group('contacts-groups-update-section');
let section1 = new Section({mvc: group1});
let section2 = new Section({mvc: group2});
let page1 = new Page({el: el1, path: '/groups', title: 'Add Group', sections: [section1]});
let page2 = new Page({el: el2, path: '/groups/:id', title: 'Update Group', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);