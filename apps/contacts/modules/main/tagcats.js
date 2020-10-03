import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class tagcat extends Verror {
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

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.tagcat.update(tagcat.id, diffs) : await Module.tableStores.tagcat.insert(tagcat);

    if (res.status == 200) {
      utils.modals.toast('Category',(this.model.existingEntry) ? tagcat.desc + ' Updated' : 'Created', 2000);
   
      this.tagcatOrig = this.model.tagcat.toJSON();

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

    let tagcat = this.model.tagcat.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.tagcat.delete(tagcat.id);

    if (res.status == 200) {
      utils.modals.toast('tagcat', 'tagcat Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  async canClear(ev) {
    let tagcat = this.model.tagcat.toJSON();
    let orig = this.tagcatOrig;
    let diffs = utils.object.diff(orig, tagcat);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
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

    Module.pager.replaceQuery('id=' + pk);
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
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el = document.getElementById('contacts-tagcats');   // page html
let mvc = new tagcat('contacts-tagcats-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/tagcats', title: 'Contact tagcats', sections: [section1]});
    
Module.pages.push(page);