import {QnD} from '/static/lib/client/core/qnd.js';
import {MVC} from '/static/lib/client/core/mvc.js';
import {utils} from '/static/lib/client/core/utils.js';
import {Page, Section} from '/static/lib/client/core/router.js';
import {TableView} from '/static/lib/client/core/data.js';

class Contact extends MVC {
  constructor(element) {
    super(element);

    //var el = document.getElementById('datetime')
    //mobiscroll.calendar(el);
  }

  createModel() {
    this.model.contact = {};
    this.model.contactOrig = {};
    this.model.contactPk = '';
    this.model.contacts = [];
    this.model.errors = {
      contact: {},
      message: ''
    }

    this.model.greg=(new Date()).toJSON();

    this.model.goodMessage = '';
    this.model.badMessage = '';

    this.$addWatched('contactPK', this.contactSelected.bind(this));
        
    this.defaults = {};

    document.addEventListener('tablestoreready', async function() {  // .getElementById('qndPages')
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

  async save() {
    var contact = this.model.contact.toJSON();
    var contactOrig = this.model.contactOrig.toJSON();
    var contactPK = this.model.contactPK;
    var diffs;

    this.clearErrors();
          
    if (contactPK) {
      diffs = utils.object.diff(contactOrig, contact);
      
      if (Object.keys(diffs).length == 0) {
        mobiscroll.alert({message: 'Nothing to update', display: 'center'});
        return;
      }
    }      

    document.getElementById('overlay').style.display = 'block';

    // new (post) or old (put)?
    let res = (contactPK) ? await QnD.tableStores.contact.update(contactPK, {contact: diffs}) : await QnD.tableStores.contact.insert({contact});

    if (res.status == 200) {
      this.setGoodMessage('Contact Saved');
    
      this.model.contactOrig = this.$copy(this.model.contact);
    }
    else {
      this.displayErrors(res);
    }
    
    document.getElementById('overlay').style.display = 'none';
  }
  
  async delete() {
    var contactPK = this.model.contactPK;      
    
    if (!contactPK) return;
    
    let ret = await mobiscroll.confirm({message: 'Are you sure that you wish to delete this Contact?'})

    if (ret != 0) return;
    
    this.clearErrors();
    QnD.widgets.modal.spinner.show();
    
    let res = await QnD.tableStores.contact.delete(contactPk);

    if (res.status == 200) {
      this.setGoodMessage('Contact Deleted');

      this.clearit();
    }
    else {
      this.displayErrors(res);
    }

    QnD.widgets.modal.spinner.hide();
  }
  
  async clear() {
    if (await this.canClear()) {
      this.clearIt();
    }
  }
  
  async newContact() {
    if (await this.canClear()) {
      this.clearIt(); 
    }
  }
  
  async canClear() {
    var contact = this.model.contact.toJSON();
    var orig = this.model.contactOrig.toJSON();
    var diffs = utils.object.diff(orig, contact);
    var ret;

    if (Object.keys(diffs).length > 0) {
      ret = await mobiscroll.confirm({message: 'Abandon changes?'});
      if (ret != 0) return false;
    }

    return true;
  }
  
  clearIt() {
    this.clearErrors();
    this.setDefaults();
  }
  
  contactSelected(nv) {
    // new contact select from list
    if (nv) {
      this.setContact(nv);  
    }
  }

  async getContactFromList(pk) {
    return (pk) ? await QnD.tableStores.contact.getOne(pk) : {};
  }
  
  async setContact(pk) {
    this.clearErrors();

    this.model.contact = await this.getContactFromList(pk);
    this.model.contactOrig = this.$copy(this.model.contact);
  }
  
  setDefaults() {
    var dflts = this.defaults.contact;
    
    for (var k in dflts) {
      this.model['contact.'+k] = dflts[k];
    }
    
    this.model.contactPK = '';
    this.model.contactOrig = this.$copy(this.model.contact);
  }
  
  displayErrors(res) {
    if ('data' in res && 'errors' in res.data) {
      for (let key of Object.keys(res.data.errors)) {
        if (key == 'message') {
          this.setBadMessage(res.data.errors.message);  
        }
        else {
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
  
  setGoodMessage(msg) {
    this.model.goodMessage = msg;

    setTimeout(function() {
      this.model.goodMessage = '';
    }.bind(this), 5000);
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