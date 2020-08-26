import {QnD} from '/static/v1/static/lib/client/core/qnd.js';
import {MVC} from '/static/v1/static/lib/client/core/mvc.js';
import {utils} from '/static/v1/static/lib/client/core/utils.js';
import {Page, Section} from '/static/v1/static/lib/client/core/router.js';
import {TableView} from '/static/v1/static/lib/client/core/data.js';

import '/static/v1/static/project/mixins/overlay.js';
//import moment from 'moment';

class title extends MVC {
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

    this.$addWatched('title.id', this.titleEntered.bind(this));
        
    this.titleOrig = {};
    this.defaults = {};
    this.titleListEl = document.getElementById('titleList');

    // fired when module gets common data
    document.addEventListener('tablestoreready', async function() {
      let titles = new TableView({proxy: this.model.titles});

      QnD.tableStores.title.addView(titles);
    
      this.defaults.title = await QnD.tableStores.title.getDefault();      
    }.bind(this), {once: true})    

    //this.ready(); //  use if not in router
  }

  ready() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
    //document.getElementById('admin-manage-navbar-titles').classList.add('active');
    //document.getElementById('admin-manage-navbar-titles').classList.add('disabled');
  }

  outView() {
    //document.getElementById('admin-manage-navbar-titles').classList.remove('active');
    //document.getElementById('admin-manage-navbar-titles').classList.remove('disabled');

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

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await QnD.tableStores.title.update(title.id, {title: diffs}) : await QnD.tableStores.title.insert({title});

    if (res.status == 200) {
      MVC.$toast('title',(this.model.existingEntry) ? title.fullname + ' Updated' : 'Created', 2000);
   
      this.titleOrig = this.model.title.toJSON();

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

    let title = this.model.title.toJSON();
    let ret = await MVC.$reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    this.clearErrors();
    
    let res = await QnD.tableStores.title.delete(title.id);

    if (res.status == 200) {
      MVC.$toast('title', 'title Removed', 1000);

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
    let title = this.model.title.toJSON();
    let orig = this.titleOrig;
    let diffs = utils.object.diff(orig, title);
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

  newTitle() {
    this.$focus('title.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // title selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.title.id = id;

    window.scrollTo(0,document.body.scrollHeight);
  }

  async titleEntered(nv) {
    // title ID entered
    if (!nv) return;

    let ret = await this.getTitleFromList(nv);

    if (ret.id) this.setTitle(ret.id);
  }

  async getTitleFromList(pk) {
    return (pk) ? await QnD.tableStores.title.getOne(pk) : {};
  }
  
  async setTitle(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.title = await this.getTitleFromList(pk);
    this.titleOrig = this.model.title.toJSON();

    this.highlightList(pk);
  }

  highlightList(pk) {
    // highlight chosen title in list
    let btn = this.titleListEl.querySelector(`button[data-pk="${pk}"]`);
    
    if (btn) btn.classList.add('active');
  }

  clearList() {
    // clear list of active entry
    let btn = this.titleListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
  }
  
  setDefaults() {
    // set title to default value
    for (let k in this.defaults.title) {
      this.model.title[k] = this.defaults.title[k];
    }

    this.titleOrig = this.model.title.toJSON();
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
let el = document.getElementById('contacts-titles');   // page html
let mvc = new title('contacts-titles-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/titles', title: 'Contact Titles', sections: [section1]});
    
QnD.pages.push(page);