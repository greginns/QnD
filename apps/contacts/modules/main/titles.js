import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class title extends Verror {
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

    this.$addWatched('title.id', this.idEntered.bind(this));
        
    this.titleOrig = {};
    this.defaults = {};
    this.titleListEl = document.getElementById('titleList');

    //this.ready(); //  use if not in router
  }

  async ready() {
    return new Promise(async function(resolve) {
      let titles = new TableView({proxy: this.model.titles});

      Module.tableStores.title.addView(titles);
    
      this.defaults.title = await Module.data.title.getDefault();      

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

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.title.update(title.id, diffs) : await Module.tableStores.title.insert(title);

    if (res.status == 200) {
      utils.modals.toast('title',(this.model.existingEntry) ? title.title + ' Updated' : 'Created', 2000);
   
      this.titleOrig = this.model.title.toJSON();

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

    let title = this.model.title.toJSON();
    let ret = await utils.modals.reConfirm(ev.target, 'Confirm Deletion?');

    if (!ret) return;

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    this.clearErrors();
    
    let res = await Module.tableStores.title.delete(title.id);

    if (res.status == 200) {
      utils.modals.toast('title', 'title Removed', 1000);

      this.clearIt();
    }
    else {
      this.displayErrors(res);
    }

    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  async canClear(ev) {
    let title = this.model.title.toJSON();
    let orig = this.titleOrig;
    let diffs = utils.object.diff(orig, title);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
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

    Module.pager.replaceQuery('id=' + id);
    window.scrollTo(0,document.body.scrollHeight);
  }

  async idEntered(id) {
    // title ID entered
    if (!id) return;

    let ret = await this.getTitleFromList(id);

    if (ret.id) this.setTitle(ret.id);
  }

  async getTitleFromList(pk) {
    return (pk) ? await Module.tableStores.title.getOne(pk) : {};
  }
  
  async setTitle(pk) {
    this.clearErrors();

    this.model.existingEntry = true;
    this.model.title = await this.getTitleFromList(pk);
    this.titleOrig = this.model.title.toJSON();

    this.highlightList(pk);

    Module.pager.replaceQuery('id=' + pk);    
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
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el = document.getElementById('contacts-titles');   // page html
let mvc = new title('contacts-titles-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/titles', title: 'Contact Titles', sections: [section1]});
    
Module.pages.push(page);