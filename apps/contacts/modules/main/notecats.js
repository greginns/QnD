import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

class notecats extends Verror {
  constructor(element) {
    super(element);
  }

  // Lifecycle
  createModel() {
    this.model.notecats = '';
    this.model.badMessage = '';
    this.model.existingEntry = false;
    this.model.errors = {
    };

    this.configID = 'notecats';

    //this.ready(); //  use if not in router
  }

  async ready() {
    let self = this;

    let getNoteCats = async function() {
      // get the note categories
      let topics = [];
      let rec = await Module.tableStores.config.getOne(self.configID);
      let data = rec.data || [];

      self.model.existingEntry = Object.keys(rec).length > 0;

      for (let cat of data) {
        topics.push(cat);
      }

      self.model.notecats = topics.join('\n');
    };

    return new Promise(async function(resolve) {
      Module.tableStores.config.addWatchedRecord(self.configID, getNoteCats);
      getNoteCats();

      resolve();
    });
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  // IO
  async save(ev) {
    let data = JSON.stringify(this.model.notecats.split('\n'));

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    utils.modals.overlay(true);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.config.update(this.configID, {data}) : await Module.tableStores.config.insert({id: this.configID, data});

    if (res.status == 200) {
      utils.modals.toast('Group', group.type + ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
    
    Module.pager.back();
  }


  async exit(ev) {
    this.go();
  }

  go() {
    Module.pager.go('/setup');
  }
  
  // Clearing
  async canClear(ev) {
    let group = this.model.group.toJSON();
    let orig = this.originalEntry;
    let diffs = utils.object.diff(orig, group);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }
  
  clearList() {
    // clear list of active entry
    let btn = this.groupListEl.querySelector('button.active');

    if (btn) btn.classList.remove('active');
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el = document.getElementById('contacts-notecats');   // page html
let mvc = new notecats('contacts-notecats-section');
let section1 = new Section({mvc});
let page = new Page({el, path: '/notecats', title: 'Contact notecats', sections: [section1]});
    
Module.pages.push(page);