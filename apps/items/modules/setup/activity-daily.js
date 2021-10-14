import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Actdaily extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'actdaily';
    this.model.title = 'Activity Daily';
    this.model.itemType = 'Activity';
    this.model.actdaily = {};
    this.model.actress = [];
    this.model.actttots = [];
    this.model.errors.actdaily = {};
    this.model.days = [];
    this.model.dailies = [];

    this.activityCode = '';
    this.url = '/items/v1/actdaily';
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.actres.addView(new TableView({proxy: this.model.actress}));
      Module.tableStores.actttot.addView(new TableView({proxy: this.model.actttots}));

      this.editTable = new Edittable('#actdailies', this, this.saver)

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.activityCode = params.code;
    let res = await Module.tableStores.activity.getOne(params.code);
    this.activity = res;

    let count = res.durdays || 1;
    let days = [];

    for (let x=1; x<=count; x++) {
      days.push({no: x});
    }

    this.getDailies();
  }

  outView() {
    return true;  
  }

  async saver() {
    // called from editTable
    if (await this.save()) {
      this.getDailies();

      return true;
    }

    return false;
  }

  async save() {
    // edittable will have set actdailyOrig
    let data = this.model.actdaily.toJSON();
    let diffs, res;
    let existingEntry = ('_pk' in data);
    let goodSave = true;

    if (existingEntry) {
      diffs = this.checkDiff(this.actdailyOrig, data);
      if (diffs === false) return goodSave;
    }      

    //let spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    res = (existingEntry) ? await Module.tableStores.actdaily.update([data.activity, data.dayno], diffs) : await Module.tableStores.actdaily.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Daily ' + data.activity, ((existingEntry) ? ' Updated' : ' Created'), 2000);
    }
    else {
      this.displayErrors(res);
      goodSave = false;
    }
    
    //this.stopSpinner(ev, spinner);   
    
    return goodSave;
  }

  async getDailies() {
    let filters = {activity: this.activityCode}
    let res = await Module.data.actdaily.getMany({filters});
    let data = [];
    let durdays = Math.max(this.activity.durdays, 1); 

    if (res.status == 200) {
      for (let rec of res.data) {

        for (let idx=1,ret,fld; idx<5; idx++) {
          fld = rec['actres'+idx];

          if (fld) {
            ret = await Module.tableStores.actres.getOne(fld);
            rec['resdesc'+idx] = ret.name;
          }

          fld = rec['acttot'+idx];

          if (fld) {
            ret = await Module.tableStores.actttot.getOne(fld);
            rec['totdesc'+idx] = ret.name;
          }
        }

        data.push(rec)
      }

      if (data.length < durdays) {
        for (let dayno = data.length+1; dayno <= durdays; dayno++) {
          data.push(this.dayDefault(dayno));
        }
      }

      this.model.dailies = data;
    }
  }

  dayDefault(dayno) {
    return {activity: this.activityCode, dayno, actres1: '', actres2: '', actres3: '', actres4: '', acttot1: '', acttot2: '', acttot3: '', acttot4: ''};
  }

  goBack() {
    Module.pager.go(`/activity/${this.activityCode}`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-actdaily');   // page html
let setup1 = new Actdaily('items-main-actdaily-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/activity/:code/daily'], title: 'Daily', sections: [section1]});

Module.pages.push(page1);