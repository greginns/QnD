import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';

import '/~static/project/mixins/overlay.js';
//import moment from 'moment';

class tagcat extends MVC {
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

    this.$addWatched('tagcat.id', this.idEntered.bind(this));
        
    this.tagcatOrig = {};
    this.defaults = {};
    this.tagcatListEl = document.getElementById('tagcatList');

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let tagcats = new TableView({proxy: this.model.tagcats});

      Module.tableStores.tagcat.addView(tagcats);
    
      this.defaults.tagcat = await Module.data.tagcat.getDefault();   
      this.setDefaults();   

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

  async save(ev) {
    var tagcat = this.model.tagcat.toJSON();
    var diffs;

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

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.tagcat.update(tagcat.id, diffs) : await Module.tableStores.tagcat.insert(tagcat);

    if (res.status == 200) {
      MVC.$toast('Category',(this.model.existingEntry) ? tagcat.desc + ' Updated' : 'Created', 2000);
   
      this.tagcatOrig = this.model.tagcat.toJSON();

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

    let tagcat = this.model.tagcat.toJSON();
    let ret = await MVC.$reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.tagcat.delete(tagcat.id);

    if (res.status == 200) {
      MVC.$toast('tagcat', 'tagcat Removed', 1000);

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
    let tagcat = this.model.tagcat.toJSON();
    let orig = this.tagcatOrig;
    let diffs = utils.object.diff(orig, tagcat);
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

  newCat() {
    this.$focus('tagcat.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // cat selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.tagcat.id = id;

    Module.pager.replaceQuery('id=' + id);

    window.scrollTo(0,document.body.scrollHeight);
  }

  async idEntered(id) {
    // tagcat ID entered
    if (!id) return;

    let ret = await this.getTagcatFromList(id);

    if (ret.id) this.setTagcat(ret.id);

    Module.pager.replaceQuery('id=' + id);
  }

  async getTagcatFromList(pk) {
    return (pk) ? await Module.tableStores.tagcat.getOne(pk) : {};
  }
  
  async setTagcat(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.tagcat = await this.getTagcatFromList(pk);
    this.tagcatOrig = this.model.tagcat.toJSON();

    this.highlightList(pk);
  }

  highlightList(pk) {
    // highlight chosen cat in list
    let btn = this.tagcatListEl.querySelector(`button[data-pk="${pk}"]`);
    
    if (btn) btn.classList.add('active');
  }

  clearList() {
    // clear list of active entry
    let btn = this.tagcatListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
  }
  
  setDefaults() {
    // set cat to default value
    for (let k in this.defaults.tagcat) {
      this.model.tagcat[k] = this.defaults.tagcat[k];
    }

    this.tagcatOrig = this.model.tagcat.toJSON();
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
let el = document.getElementById('contacts-tagcats');   // page html
let mvc = new tagcat('contacts-tagcats-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/tagcats', title: 'Contact tagcats', sections: [section1]});
    
Module.pages.push(page);