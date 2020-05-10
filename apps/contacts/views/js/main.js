import {QnD} from '/static/lib/client/core/qnd.js';
import {MVC} from '/static/lib/client/core/mvc.js';
import {utils} from '/static/lib/client/core/utils.js';
import {Page, Section} from '/static/lib/client/core/router.js';
import {TableView} from '/static/lib/client/core/data.js';

//console.log(MVC)
import '/static/project/mixins/overlay.js';

class Contact extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.contact = {};
    this.model.existingEntry = false;
    this.model.contacts = [];
    this.model.badMessage = '';
    this.model.errors = {
      contact: {},
      message: ''
    }

    this.$addWatched('contact.id', this.contactEntered.bind(this));
        
    this.contactOrig = {};
    this.defaults = {};
    this.contactListEl = document.getElementById('contactList');

    document.addEventListener('tablestoreready', async function() {
      let contacts = new TableView({proxy: this.model.contacts});

      QnD.tableStores.contact.addView(contacts);
    
      this.defaults.contact = await QnD.tableStores.contact.getDefault();      
    }.bind(this), {once: true})    

    //this.ready(); //  use if not in router
  }

  ready() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
    //document.getElementById('admin-manage-navbar-contacts').classList.add('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.add('disabled');
  }

  outView() {
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('disabled');

    return true;  
  }

  async save(ev) {
    var contact = this.model.contact.toJSON();
    var diffs;

    this.clearErrors();
          
    if (this.model.existingEntry) {
      diffs = utils.object.diff(this.contactOrig, contact);
      
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
    let res = (this.model.existingEntry) ? await QnD.tableStores.contact.update(contact.id, {contact: diffs}) : await QnD.tableStores.contact.insert({contact});

    if (res.status == 200) {
      MVC.$toast('CONTACT',(this.model.existingEntry) ? contact.fullname + ' Updated' : 'Created', 2000);
   
      this.contactOrig = this.model.contact.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    MVC.$overlay(false);
    MVC.$buttonSpinner(ev.target, false, spinner);
  }
  
  async delete(ev) {
    if (!this.model.existingEntry) return;

    let contact = this.model.contact.toJSON();
    let ret = await MVC.$reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = MVC.$buttonSpinner(ev.target, true);
    MVC.$overlay(true);

    this.clearErrors();
    
    let res = await QnD.tableStores.contact.delete(contact.id);

    if (res.status == 200) {
      MVC.$toast('CONTACT', 'Contact Removed', 1000);

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
    let contact = this.model.contact.toJSON();
    let orig = this.contactOrig;
    let diffs = utils.object.diff(orig, contact);
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

  newContact() {
    this.$focus('contact.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // Contact selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.contact.id = id;

    window.scrollTo(0,document.body.scrollHeight);
  }

  async contactEntered(nv) {
    // Contact ID entered
    if (!nv) return;

    let ret = await this.getContactFromList(nv);

    if (ret.id) this.setContact(ret.id);
  }

  async getContactFromList(pk) {
    return (pk) ? await QnD.tableStores.contact.getOne(pk) : {};
  }
  
  async setContact(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.contact = await this.getContactFromList(pk);
    this.contactOrig = this.model.contact.toJSON();

    this.highlightList(pk);
  }

  highlightList(pk) {
    // highlight chosen contact in list
    let btn = this.contactListEl.querySelector(`button[data-pk="${pk}"]`);
    
    if (btn) btn.classList.add('active');
  }

  clearList() {
    // clear list of active entry
    let btn = this.contactListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
  }
  
  setDefaults() {
    // set contact to default value
    for (let k in this.defaults.contact) {
      this.model.contact[k] = this.defaults.contact[k];
    }

    this.contactOrig = this.model.contact.toJSON();
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

// instantiate MVCs
let mvc= new Contact('contacts-main-section');

// hook them up to sections that will eventually end up in a page (done in module)
let section1 = new Section({mvc});
let el = document.getElementById('contacts-main');   // page html
let page = new Page({el, path: '/main', title: 'Contacts', sections: [section1]});
    
QnD.pages.push(page);