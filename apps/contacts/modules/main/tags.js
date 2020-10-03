import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class tag extends Verror {
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

    this.$addWatched('tag.id', this.idEntered.bind(this));
        
    this.tagOrig = {};
    this.defaults = {};
    this.tagListEl = document.getElementById('tagList');

    //this.ready(); //  use if not in router
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      let tags = new TableView({proxy: this.model.tags});
      let tagcats = new TableView({proxy: this.model.tagcats, filterFunc});

      Module.tableStores.tag.addView(tags);
      Module.tableStores.tagcat.addView(tagcats);
    
      this.defaults.tag = await Module.data.tag.getDefault();   
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

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.tag.update(tag.id, diffs) : await Module.tableStores.tag.insert(tag);

    if (res.status == 200) {
      utils.modals.toast('Tag',(this.model.existingEntry) ? tag.desc + ' Updated' : 'Created', 2000);
   
      this.tagOrig = this.model.tag.toJSON();

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

    let tag = this.model.tag.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.tag.delete(tag.id);

    if (res.status == 200) {
      utils.modals.toast('tag', 'tag Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  async canClear(ev) {
    let tag = this.model.tag.toJSON();
    let orig = this.tagOrig;
    let diffs = utils.object.diff(orig, tag);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  newTag() {
    this.$focus('tag.id');
    window.scrollTo(0,document.body.scrollHeight);
  }
  
  listClicked(ev) {
    // cat selected from list
    let el = ev.target.closest('button');
    if (!el) return;

    let id = el.getAttribute('data-pk');
    if (id) this.model.tag.id = id;

    Module.pager.replaceQuery('id=' + id);

    window.scrollTo(0,document.body.scrollHeight);
  }

  async idEntered(id) {
    // tag ID entered
    if (!id) return;

    let ret = await this.gettagFromList(id);

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

    Module.pager.replaceQuery('id=' + pk);
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
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el = document.getElementById('contacts-tags');   // page html
let mvc = new tag('contacts-tags-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/tags', title: 'Contact Tags', sections: [section1]});
    
Module.pages.push(page);