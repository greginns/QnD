import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Edittable} from '/~static/lib/client/core/tables.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Supplier extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    super.createModel();

    this.model.catname = 'supplier';
    this.model.title = 'Suppliers'
    this.model.supplier = {};
    this.model.item = {};
    this.model.errors.supplier = {};

    this.model.suppliers = [];
    this.model.itemcats = [
      {value: 'A', text: 'Activity'},
      {value: 'L', text: 'Lodging'},
      {value: 'M', text: 'Meal'}
    ];
  }

  async ready() {
    return new Promise(async function(resolve) {
      Module.tableStores.supplier.addView(new TableView({proxy: this.model.suppliers}));
      this.defaults = await Module.tableStores.supplier.getDefault();   

      //this.editTable = new Edittable('#supplier-items', this, this.saver, this.deleter);

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    await super.inView(params);
  }

  outView() {
    return true;  
  }

  async saver() {
    let item = this.model.item.toJSON();
    let data = this.model.supplier.toJSON();

    if (item.new) {
      delete item.new;

      if (! ('items' in data) || !data.items) {
        data.items = [];
      }

      data.items.push(item);
    }
    else {
      for (let idx=0; idx<data.items.length; idx++) {
        if (data.items[idx].cat == item.cat && data.items[idx].code == item.code) {
          data.items[idx] = item;
        }
      }
    }

    data.items.sort(function(a,b) {
      return (a.cat < b.cat) ? -1 : (a.cat > b.cat) ? 1 : (a.code < b.code) ? -1 : (a.code > b.code) ? 1 : 0;
    });

    this.model.supplier = data;

    return await this.save();
  }

  async save(ev) {
    let data = this.model.supplier.toJSON();
    let diffs, spinner;

    this.clearErrors();
    
    data.items = JSON.stringify(data.items);

    if (this.model.existingEntry) {
      diffs = this.checkDiff(this.origData, data);
      if (diffs === false) return true;
    }      

    if (ev) spinner = this.startSpinner(ev);

    // new (post) or old (put)?
    let res = (this.model.existingEntry) ? await Module.tableStores.supplier.update(data.code, diffs) : await Module.tableStores.supplier.insert(data);

    if (res.status == 200) {
      utils.modals.toast('Supplier ' + data.code, ((this.model.existingEntry) ? ' Updated' : ' Created'), 2000);
   
      this.origData = this.model.supplier.toJSON();
    }
    else {
      this.displayErrors(res);
    }
    
    if (ev) this.stopSpinner(ev, spinner);    

    return true;
  }

  async deleter(idx) {
    let data = this.model.supplier.toJSON();

    data.items.splice(idx, 1);
    
    this.model.supplier = data;

    return await this.save();
  }

  async canClear(ev) {
    let data = this.model.supplier.toJSON();
    return super.canClear(ev, data);
  }

  setDefaults() {
    // set entry to default value
    this.model.supplier = {};

    for (let k in this.defaults) {
      this.model.supplier[k] = this.defaults[k];
    }
  }

  async testCode() {
    let code = this.model.supplier.code
    let res = await Module.tableStores.supplier.getOne(code);
    
    if (Object.keys(res).length == 0) return;

    this.model.supplier.code = '';

    let options = {text: code + ' already exists.  Do you wish to edit?', buttons: [{text: 'Yes', class: 'btn-primary'}, {text: 'No', class: 'btn-danger'}], defaultButton: 1, okayButton: 0};
    let btn = await Module.modal.confirm(options);

    if (btn == 0) {
      // edit
      Module.pager.go(`/${this.model.catname}/${code}`);
    }
    else {
      // retry
      this.$focus('supplier.code');
    }
  }

  async getEntry(code) {
    let res = await Module.tableStores.supplier.getOne(code);

    if (Object.keys(res).length == 0) {
      await Module.modal.alert(code + ' Does not exist');
      this.backToStart();
    }
    else {
      this.existingEntry(res);
    }
  }

  newEntry() {
    this.model.existingEntry = false;

    this.setDefaults();
    this.origData = this.model.supplier.toJSON();
  }

  existingEntry(data) {
    this.model.existingEntry = true;

    this.model.supplier = data;
    this.origData = this.model.supplier.toJSON();
  }

  newItem() {
    let obj = {};
    
    obj.cat = 'A'
    obj.code = '';
    obj.name = '';
    obj.new = true;

    this.editTable.add(obj);
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-supplier');   // page html
let setup1 = new Supplier('items-main-supplier-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/supplier', '/supplier/:code'], title: 'supplier', sections: [section1]});

Module.pages.push(page1);