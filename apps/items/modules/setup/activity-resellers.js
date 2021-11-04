import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Edittable} from '/~static/lib/client/core/tables.js';

class Actreseller extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.activity = {};
    this.model.actrates = [];
    this.model.actreseller = {};
    this.model.actresellers = [];
    this.model.resellers = [];
    this.model.itemType = 'Activity';
    this.code = '';
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      this.editTable = new Edittable('#actreseller', this, this.saver, this.deleter);
      Module.tableStores.reseller.addView(new TableView({proxy: this.model.resellers, filterFunc}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    let filters = {activity: this.code, active: true};

    this.model.activity = await Module.tableStores.activity.getOne(this.code);
    this.model.title = this.model.activity.name;

    let res = await Module.data.actrates.getMany({filters});
    if (res.status == 200) {
      this.model.actrates = res.data;
    }

    this.getResellers();
  }

  outView() {
    return true;  
  }
  
  async saver() {
    // called from editTable
    return await this.save();
  }

  async save(ev) {
    // actreseller is the entry just edited
    let actreseller = this.model.actreseller.toJSON();

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = ('_pk' in actreseller) ? await Module.tableStores.actreseller.update([actreseller.activity, actreseller.reseller], {rateno: actreseller.rateno, comm: actreseller.comm}) : await Module.tableStores.actreseller.insert(actreseller);

    if (res.status == 200) {
      utils.modals.toast('Resellers', (('_pk' in actreseller) ? ' Updated' : ' Created'), 2000);
    }
    else {
      this.displayErrors(res);
    }
    
    //this.stopSpinner(ev, spinner); 
    
    this.getResellers();
    return true;
  }

  async deleter(idx) {
    return await this.delete(idx);
  }

  async delete(idx) {
    let ret = await Module.modal.confirm('Are you sure?');

    if (ret != 0) return false;

    let actresellers = this.model.actresellers.toJSON();
    let actreseller = actresellers[idx];

    ret = Module.tableStores.actreseller.delete([actreseller.activity, actreseller.reseller]);

    this.getResellers();
    return true;
  }

  newItem() {
    let obj = {};
    
    obj.activity = this.code;
    obj.rateno = '1';
    obj.comm = '0';

    this.editTable.add(obj);
  }

  async getResellers() {
    let data = [];
    let filters = {activity: this.code};
    let res = await Module.data.actreseller.getMany({filters});

    if (res.status == 200) {
      for (let rec of res.data) {
        let reseller = await Module.tableStores.reseller.getOne(rec.reseller);
        let rate = await Module.tableStores.actrates.getOne([this.code, rec.rateno]);

        rec.name = reseller.name;
        rec.ratename = rate.name;

        data.push(rec);
      }

      this.model.actresellers = data;
    }
  }

  goBack() {
    Module.pager.go(`/activity/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-activity-reseller');   // page html
let setup1 = new Actreseller('items-activity-reseller-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/activity/:code/resellers', title: 'Resellers', sections: [section1]});

Module.pages.push(page1);