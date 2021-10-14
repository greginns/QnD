import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Lodgunit extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'lodgunit';
    this.model.title = 'Lodging Units';
    this.model.itemType = 'Lodging';
    this.model.lodging = {};
    this.model.lodgunit = {};
    this.model.units = [];
    this.model.errors.lodgunit = {};

    this.lodgingCode = '';
    this.url = '/items/v1/lodgunit';
  }

  async ready() {
    return new Promise(async function(resolve) {
      this.editTable = new Edittable('#lodgunits', this, this.saver)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.lodgingCode = params.code;
    let res = await Module.tableStores.lodging.getOne(params.code);
    this.model.lodging = res;
console.log(this.model.lodging.bookbeds)
    this.getUnits();
  }

  outView() {
    return true;  
  }

  async saver() {
    // called from editTable
    if (await this.save()) {
      this.getUnits();

      return true;
    }

    return false;
  }

  async save() {
    // edittable will have set lodgunitOrig
    let data = this.model.lodgunit.toJSON();
    let diffs, res;
    let existingEntry = ('_pk' in data);
    let goodSave = true;

    if (existingEntry) {
      diffs = this.checkDiff(this.lodgunitOrig, data);
      if (diffs === false) return goodSave;
    }      

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    res = (existingEntry) ? await Module.tableStores.lodgunit.update([data.lodging, data.seq], diffs) : await Module.tableStores.lodgunit.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Unit ' + data.lodging, ((existingEntry) ? ' Updated' : ' Created'), 2000);
    }
    else {
      this.displayErrors(res);
      goodSave = false;
    }
    
    //this.stopSpinner(ev, spinner);   
    
    return goodSave;
  }

  async getUnits() {
    let filters = {lodging: this.lodgingCode}
    let res = await Module.data.lodgunit.getMany({filters});

    if (res.status == 200) {
      this.model.units = res.data;
    }
  }

  async newUnit() {
    await this.getUnits();
    
    let seq = this.model.units.length + 1;
    let dflt = this.unitDefault(seq);

    this.editTable.add(dflt);
  }

  unitDefault(seq) {
    return {lodging: this.lodgingCode, seq, name: '', active: true, qtybeds: '0', desc: ''};
  }

  goBack() {
    Module.pager.go(`/lodging/${this.lodgingCode}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-lodgunit');   // page html
let setup1 = new Lodgunit('items-main-lodgunit-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/lodging/:code/units'], title: 'Units', sections: [section1]});

Module.pages.push(page1);