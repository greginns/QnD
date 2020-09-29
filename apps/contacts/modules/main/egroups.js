import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';

import '/~static/project/mixins/overlay.js';
//import moment from 'moment';

class egroup extends MVC {
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

    this.$addWatched('egroup.id', this.idEntered.bind(this));
        
    this.egroupOrig = {};
    this.defaults = {};
    this.egroupListEl = document.getElementById('egroupList');

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let egroups = new TableView({proxy: this.model.egroups});

      Module.tableStores.egroup.addView(egroups);
    
      this.defaults.egroup = await Module.data.egroup.getDefault();   
      this.setDefaults();   

      resolve();

    }.bind(this));
  }
  
  inView(params) {
    setTimeout(function() {
      if ('id' in params && params.id) {
        this.idEntered(params.id);
      }
    }.bind(this), 1000)

  }

  outView() {
    return true;  
  }

  async save(ev) {
    var egroup = this.model.egroup.toJSON();
    var diffs;

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

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.egroup.update(egroup.id, diffs) : await Module.tableStores.egroup.insert(egroup);

    if (res.status == 200) {
      MVC.$toast('group',(this.model.existingEntry) ? egroup.desc + ' Updated' : 'Created', 2000);
   
      this.egroupOrig = this.model.egroup.toJSON();

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

    let egroup = this.model.egroup.toJSON();
    let ret = await MVC.$reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.egroup.delete(egroup.id);

    if (res.status == 200) {
      MVC.$toast('egroup', 'Egroup Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    MVC.$overlay(false);
    MVC.$buttonSpinner(ev.target, false, spinner);
  }
  
  async clear(ev) {
    if (await this.canClear(ev)) {
      this.clearIt();
    }
  }

  async canClear(ev) {
    let egroup = this.model.egroup.toJSON();
    let orig = this.egroupOrig;
    let diffs = utils.object.diff(orig, egroup);
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

  newgroup() {
    this.$focus('egroup.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // group selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.egroup.id = id;

    Module.pager.replaceQuery('id=' + id);
    window.scrollTo(0,document.body.scrollHeight);
  }

  async idEntered(id) {
    // group ID entered
    if (!id) return;

    let ret = await this.getEgroupFromList(id);

    if (ret.id) this.setEgroup(ret.id);

    Module.pager.replaceQuery('id=' + id);
  }

  async getEgroupFromList(pk) {
    return (pk) ? await Module.tableStores.egroup.getOne(pk) : {};
  }
  
  async setEgroup(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.egroup = await this.getEgroupFromList(pk);
    this.egroupOrig = this.model.egroup.toJSON();

    this.highlightList(pk);
  }

  highlightList(pk) {
    // highlight chosen group in list
    let btn = this.egroupListEl.querySelector(`button[data-pk="${pk}"]`);

    if (btn) btn.classList.add('active');
  }

  clearList() {
    // clear list of active entry
    let btn = this.egroupListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
  }
  
  setDefaults() {
    // set group to default value
    for (let k in this.defaults.egroup) {
      this.model.egroup[k] = this.defaults.egroup[k];
    }

    this.egroupOrig = this.model.egroup.toJSON();
  }
  
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
let el = document.getElementById('contacts-egroups');   // page html
let mvc = new egroup('contacts-egroups-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/egroups', egroup: 'Contact Egroups', sections: [section1]});
    
Module.pages.push(page);