import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Edittable} from '/~static/lib/client/core/tables.js';

class Lodgreseller extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.lodging = {};
    this.model.lodgrates = [];
    this.model.lodgreseller = {};
    this.model.lodgresellers = [];
    this.model.resellers = [];
    this.model.itemType = 'Lodging';
    this.code = '';
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      this.editTable = new Edittable('#lodgreseller', this, this.saver, this.deleter);
      Module.tableStores.reseller.addView(new TableView({proxy: this.model.resellers, filterFunc}));

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.code = params.code;
    let filters = {lodging: this.code, active: true};

    this.model.lodging = await Module.tableStores.lodging.getOne(this.code);
    this.model.title = this.model.lodging.name;

    let res = await Module.data.lodgrates.getMany({filters});
    if (res.status == 200) {
      this.model.lodgrates = res.data;
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
    // lodgreseller is the entry just edited
    let lodgreseller = this.model.lodgreseller.toJSON();

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = ('_pk' in lodgreseller) ? await Module.tableStores.lodgreseller.update([lodgreseller.lodging, lodgreseller.reseller], {rateno: lodgreseller.rateno, comm: lodgreseller.comm}) : await Module.tableStores.lodgreseller.insert(lodgreseller);

    if (res.status == 200) {
      utils.modals.toast('Resellers', (('_pk' in lodgreseller) ? ' Updated' : ' Created'), 2000);
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

    let lodgresellers = this.model.lodgresellers.toJSON();
    let lodgreseller = lodgresellers[idx];

    ret = Module.tableStores.lodgreseller.delete([lodgreseller.lodging, lodgreseller.reseller]);

    this.getResellers();
    return true;
  }

  newItem() {
    let obj = {};
    
    obj.lodging = this.code;
    obj.rateno = '1';
    obj.comm = '0';

    this.editTable.add(obj);
  }

  async getResellers() {
    let data = [];
    let filters = {lodging: this.code};
    let res = await Module.data.lodgreseller.getMany({filters});

    if (res.status == 200) {
      for (let rec of res.data) {
        let reseller = await Module.tableStores.reseller.getOne(rec.reseller);
        let rate = await Module.tableStores.lodgrates.getOne([this.code, rec.rateno]);

        rec.name = reseller.name;
        rec.ratename = rate.name;

        data.push(rec);
      }

      this.model.lodgresellers = data;
    }
  }

  goBack() {
    Module.pager.go(`/lodging/${this.code}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-lodging-reseller');   // page html
let setup1 = new Lodgreseller('items-lodging-reseller-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: '/lodging/:code/resellers', title: 'Resellers', sections: [section1]});

Module.pages.push(page1);