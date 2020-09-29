import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';

import '/~static/project/mixins/overlay.js';
//import moment from 'moment';

class group extends MVC {
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

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.group.update(group.id, diffs) : await Module.tableStores.group.insert(group);

    if (res.status == 200) {
      MVC.$toast('group',(this.model.existingEntry) ? group.type + ' Updated' : 'Created', 2000);
   
      this.originalEntry = this.model.group.toJSON();

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }
    
    MVC.$overlay(false);
    MVC.$buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let group = this.model.group.toJSON();
    let ret = await MVC.$reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.group.delete(group.id);

    if (res.status == 200) {
      MVC.$toast('Group', 'Group Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    MVC.$overlay(false);
    MVC.$buttonSpinner(ev.target, false, spinner);
  }
  
  // Clearing
  async clear(ev) {
    if (await this.canClear(ev)) {
      this.clearIt();
    }
  }

  async canClear(ev) {
    let group = this.model.group.toJSON();
    let orig = this.originalEntry;
    let diffs = utils.object.diff(orig, group);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await MVC.$reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }
  
  clearIt() {
    this.clearErrors();
    this.setDefaults();
    this.clearList();

    this.model.existingEntry = false;

    Module.pager.clearQuery();
    window.scrollTo(0,0);
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
  
  // Error rtns
  displayErrors(res) {
    if ('data' in res && 'errors' in res.data) {
      for (let key of Object.keys(res.data.errors)) {
        if (key == 'message') {
          this.setBadMessage(res.data.errors.message);  
        }
        else {
          if (!res.data.errors.message) this.model.badMessage = 'Please Correct any entry errors';

          for (let k in res.data.errors[key]) {
            this.model.errors[key][k] = res.data.errors[key][k];
          };  
        }
      }
    }
    
    this.model.errors._verify = res.data.errors._verify;
  }
  
  clearErrors() {
    for (let key of Object.keys(this.model.errors)) {
      if (this.model.errors[key] instanceof Object) {
        for (let key2 of Object.keys(this.model.errors[key])) {
          this.model.errors[key][key2] = '';
        }
      }
      else {
        this.model.errors[key] = '';
      }
    }

    this.model.badMessage = '';
  }

  setBadMessage(msg) {
    this.model.badMessage = msg;
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el = document.getElementById('contacts-groups');   // page html
let mvc = new group('contacts-groups-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/groups', group: 'Contact groups', sections: [section1]});
    
Module.pages.push(page);