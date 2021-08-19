import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class egroup extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.egroup = {};
    this.model.existingEntry = false;
    this.model.egroups = [];
    this.model.badMessage = '';
    this.model.errors = {
      egroup: {},
      message: ''
    };

    this.egroupOrig = {};
    this.defaults = {};

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let egroups = new TableView({proxy: this.model.egroups});

      Module.tableStores.egroup.addView(egroups);
    
      this.defaults.egroup = await Module.data.egroup.getDefault();      

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
    let egroup = this.model.egroup.toJSON();
    let diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.egroupOrig, egroup);
      
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
    let res = (this.model.existingEntry) ? await Module.tableStores.egroup.update(egroup.id, diffs) : await Module.tableStores.egroup.insert(egroup);

    if (res.status == 200) {
      utils.modals.toast('E-Group', group.type + ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.egroupOrig = this.model.egroup.toJSON();

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

    let egroup = this.model.egroup.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.egroup.delete(egroup.id);

    if (res.status == 200) {
      utils.modals.toast('E-Group', 'E-Group Removed', 1000);
            
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
    let egroup = this.model.egroup.toJSON();
    let orig = this.egroupOrig;
    let diffs = utils.object.diff(orig, egroup);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  newEntry() {
    this.model.egroup = {};
    this.model.existingEntry = false;

    this.setDefaults();
    this.egroupOrig = this.model.egroup.toJSON();

    this.$focus('egroup.id');
    window.scrollTo(0,document.body.scrollHeight);
  }

  async existingEntry(pk) {
    this.model.egroup = await Module.tableStores.egroup.getOne(pk);
    this.model.existingEntry = true;

    this.egroupOrig = this.model.egroup.toJSON();
  }

  setDefaults() {
    // set entry to default value
    for (let k in this.defaults.egroup) {
      this.model.egroup[k] = this.defaults.egroup[k];
    }

    this.egroupOrig = this.model.egroup.toJSON();
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('contacts-egroups-create');   // page html
let el2 = document.getElementById('contacts-egroups-update');   // page html
let egroup1 = new egroup('contacts-egroups-create-section');
let egroup2 = new egroup('contacts-egroups-update-section');
let section1 = new Section({mvc: egroup1});
let section2 = new Section({mvc: egroup2});
let page1 = new Page({el: el1, path: '/egroups', title: 'Add E-Group', sections: [section1]});
let page2 = new Page({el: el2, path: '/egroups/:id', title: 'Update E-Group', sections: [section2]});

Module.pages.push(page1);
Module.pages.push(page2);