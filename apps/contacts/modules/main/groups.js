import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class group extends Verror {
  constructor(element) {
    super(element);
  }

  // Lifecycle
  createModel() {
    this.model.group = {};
    this.model.existingEntry = false;
    this.model.groups = [];
    this.model.badMessage = '';
    this.model.errors = {
      group: {},
      message: ''
    };

    this.$addWatched('group.id', this.idEntered.bind(this));
        
    this.originalEntry = {};
    this.defaults = {};
    this.groupListEl = document.getElementById('groupList');

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
    if ('id' in params && params.id) {
      this.idEntered(params.id);
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
      diffs = utils.object.diff(this.originalEntry, group);
      
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
      utils.modals.toast('group',(this.model.existingEntry) ? group.type + ' Updated' : 'Created', 2000);
   
      this.originalEntry = this.model.group.toJSON();

      this.clearIt();
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

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }
  
  // Clearing
  async canClear(ev) {
    let group = this.model.group.toJSON();
    let orig = this.originalEntry;
    let diffs = utils.object.diff(orig, group);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  // DB Entry routines
  newEntry() {
    this.$focus('group.id');

    window.scrollTo(0,document.body.scrollHeight);
  }
  
  async idEntered(id) {
    // ID entered
    if (!id) return;

    let ret = await this.getEntryFromList(id);

    if (ret.id) this.setEntry(ret.id);

    Module.pager.replaceQuery('id=' + id);
  }

  async getEntryFromList(pk) {
    return (pk) ? await Module.tableStores.group.getOne(pk) : {};
  }
  
  async setEntry(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.group = await this.getEntryFromList(pk);
    this.originalEntry = this.model.group.toJSON();

    this.highlightList(pk);
  }

  setDefaults() {
    // set entry to default value
    for (let k in this.defaults.group) {
      this.model.group[k] = this.defaults.group[k];
    }

    this.originalEntry = this.model.group.toJSON();
  }
  
  // List routines
  listClicked(ev) {
    // entry selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.group.id = id;

    Module.pager.replaceQuery('id=' + id);
    
    window.scrollTo(0,document.body.scrollHeight);
  }

  highlightList(pk) {
    // highlight chosen group in list
    let btn = this.groupListEl.querySelector(`button[data-pk="${pk}"]`);
    
    if (btn) btn.classList.add('active');
  }

  clearList() {
    // clear list of active entry
    let btn = this.groupListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el = document.getElementById('contacts-groups');   // page html
let mvc = new group('contacts-groups-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/groups', title: 'Contact groups', sections: [section1]});
    
Module.pages.push(page);