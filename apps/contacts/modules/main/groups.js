import {QnD} from '/~static/lib/client/core/qnd.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/router.js';
import {TableView} from '/~static/lib/client/core/data.js';

import '/~static/project/mixins/overlay.js';
//import moment from 'moment';

class group extends MVC {
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

    this.$addWatched('group.id', this.groupEntered.bind(this));
        
    this.groupOrig = {};
    this.defaults = {};
    this.groupListEl = document.getElementById('groupList');

    // fired when module gets common data
    document.addEventListener('tablestoreready', async function() {
      let groups = new TableView({proxy: this.model.groups});

      QnD.tableStores.group.addView(groups);
    
      this.defaults.group = await QnD.data.group.getDefault();      
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
    var group = this.model.group.toJSON();
    var diffs;

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

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await QnD.tableStores.group.update(group.id, {group: diffs}) : await QnD.tableStores.group.insert({group});

    if (res.status == 200) {
      MVC.$toast('group',(this.model.existingEntry) ? group.fullname + ' Updated' : 'Created', 2000);
   
      this.groupOrig = this.model.group.toJSON();

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
    
    let res = await QnD.tableStores.group.delete(group.id);

    if (res.status == 200) {
      MVC.$toast('group', 'group Removed', 1000);

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
    let group = this.model.group.toJSON();
    let orig = this.groupOrig;
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
    window.scrollTo(0,0);
  }

  newgroup() {
    this.$focus('group.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // group selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.group.id = id;

    window.scrollTo(0,document.body.scrollHeight);
  }

  async groupEntered(nv) {
    // group ID entered
    if (!nv) return;

    let ret = await this.getgroupFromList(nv);

    if (ret.id) this.setgroup(ret.id);
  }

  async getgroupFromList(pk) {
    return (pk) ? await QnD.tableStores.group.getOne(pk) : {};
  }
  
  async setgroup(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.group = await this.getgroupFromList(pk);
    this.groupOrig = this.model.group.toJSON();

    this.highlightList(pk);
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
  
  setDefaults() {
    // set group to default value
    for (let k in this.defaults.group) {
      this.model.group[k] = this.defaults.group[k];
    }

    this.groupOrig = this.model.group.toJSON();
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
let el = document.getElementById('contacts-groups');   // page html
let mvc = new group('contacts-groups-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/groups', group: 'Contact groups', sections: [section1]});
    
QnD.pages.push(page);