import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/router.js';
import {TableView} from '/~static/lib/client/core/data.js';

import '/~static/project/mixins/overlay.js';
//import moment from 'moment';

class tag extends MVC {
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

    this.$addWatched('tag.id', this.catEntered.bind(this));
        
    this.tagOrig = {};
    this.defaults = {};
    this.tagListEl = document.getElementById('tagList');
    
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    // fired when module gets common data
    document.addEventListener('tablestoreready', async function() {
      let tags = new TableView({proxy: this.model.tags});
      let tagcats = new TableView({proxy: this.model.tagcats, filterFunc});

      Module.tableStores.tag.addView(tags);
      Module.tableStores.tagcat.addView(tagcats);
    
      this.defaults.tag = await Module.data.tag.getDefault();   
      this.setDefaults();   
    }.bind(this), {once: true})    

    //this.ready(); //  use if not in router
  }

  ready() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
    //document.getElementById('admin-manage-navbar-groups').classList.add('active');
    //document.getElementById('admin-manage-navbar-groups').classList.add('disabled');
  }

  outView() {
    //document.getElementById('admin-manage-navbar-groups').classList.remove('active');
    //document.getElementById('admin-manage-navbar-groups').classList.remove('disabled');

    return true;  
  }

  async save(ev) {
    var tag = this.model.tag.toJSON();
    var diffs;

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

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.tag.update(tag.id, diffs) : await Module.tableStores.tag.insert(tag);

    if (res.status == 200) {
      MVC.$toast('tag',(this.model.existingEntry) ? tag.desc + ' Updated' : 'Created', 2000);
   
      this.tagOrig = this.model.tag.toJSON();

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

    let tag = this.model.tag.toJSON();
    let ret = await MVC.$reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.tag.delete(tag.id);

    if (res.status == 200) {
      MVC.$toast('tag', 'tag Removed', 1000);

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
    let tag = this.model.tag.toJSON();
    let orig = this.tagOrig;
    let diffs = utils.object.diff(orig, tag);
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
    window.scrollTo(0,0);
  }

  newCat() {
    this.$focus('tag.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // cat selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.tag.id = id;

    window.scrollTo(0,document.body.scrollHeight);
  }

  async catEntered(nv) {
    // tag ID entered
    if (!nv) return;

    let ret = await this.gettagFromList(nv);

    if (ret.id) this.settag(ret.id);
  }

  async gettagFromList(pk) {
    return (pk) ? await Module.tableStores.tag.getOne(pk) : {};
  }
  
  async settag(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.tag = await this.gettagFromList(pk);
    this.tagOrig = this.model.tag.toJSON();

    this.highlightList(pk);
  }

  highlightList(pk) {
    // highlight chosen cat in list
    let btn = this.tagListEl.querySelector(`button[data-pk="${pk}"]`);
    
    if (btn) btn.classList.add('active');
  }

  clearList() {
    // clear list of active entry
    let btn = this.tagListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
  }
  
  setDefaults() {
    // set cat to default value
    for (let k in this.defaults.tag) {
      this.model.tag[k] = this.defaults.tag[k];
    }

    this.tagOrig = this.model.tag.toJSON();
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
let el = document.getElementById('contacts-tags');   // page html
let mvc = new tag('contacts-tags-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/tags', title: 'Contact Tags', sections: [section1]});
    
Module.pages.push(page);