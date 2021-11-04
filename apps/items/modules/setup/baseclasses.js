import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {TableView} from '/~static/lib/client/core/data.js';
import {Verror} from '/~static/project/subclasses/simple-entry.js';

const Base = class extends Verror {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.existingEntry = false;
    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };
    
    this.origData = {};
    this.defaults = {};
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.clearErrors();

    if (params.code) {
      await this.getEntry(params.code);
    }
    else {
      this.newEntry();
    }
  }

  outView() {
    return true;  
  }

  checkDiff(old, data) {
    // return true if diffs
    let diffs = utils.object.diff(old, data);
      
    if (Object.keys(diffs).length == 0) {
      this.model.badMessage = 'No Changes to Update';
      
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return false;
    }

    return diffs;
  }

  startSpinner(ev) {
    utils.modals.overlay(true);

    return utils.modals.buttonSpinner(ev.target, true);
  }

  stopSpinner(ev, spinner) {
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  // Clearing
  async clear() {
    if (this.canClear()) {
      this.setDefaults();
    }
  }

  async canClear(ev, data) {
    let orig = this.origData;
    let diffs = utils.object.diff(orig, data);
    let ret = true;

    if (Object.keys(diffs).length > 0) {
      ret = await utils.modals.reConfirm(ev.target, 'Abandon changes?');
    }

    return ret;
  }

  backToStart() {
    Module.pager.go('/start');
  }  

  optionsHelp(obj) {
    if (!this.helpDisplayed) {
      for (let el of Array.from(this._section.querySelectorAll('.helptext'))) {
        el.classList.remove('d-none');
      }
    }
    else {
      for (let el of Array.from(this._section.querySelectorAll('.helptext'))) {
        el.classList.add('d-none');
      }
    }    

    this.helpDisplayed = !this.helpDisplayed;
  }

  optionsImport(obj) {
    Module.pager.go(`/import/${this.model.catname}?title=${this.model.title}`);
  }

  async optionsExport(obj) {
    let filename = this.model.catname + '.csv';
    let [hdrs, data] = await this.options_getHeadersAndData(this.model.catname);
    let rows = [[]];
    
    for (let x of hdrs) {
      rows[0].push(x[1]);
    }

    rows = rows.concat(data);

    let csv = Papa.unparse(rows);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    let url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  optionsPrint(obj) {
    Module.pager.go(`/print/${this.model.catname}?title=${this.model.title}`);
  }

  async options_getHeadersAndData(table) {
    let hdrs = [], data = [];

    let res = await Module.data[table].getOne('_columns');
    if (res.status == 200) {
      hdrs = res.data;
    }

    let ret = await Module.tableStores[table].getAll();

    for (let r of ret) {
      let row = [];

      for (let col of hdrs) {
        row.push(r[col[0]] || '');
      }

      data.push(row);
    } 
    
    return [hdrs, data];
  }

  editEntry(code) {
    Module.pager.go(`/${this.model.catname}/${code}`);
  }

  // methods required in sub classes
  save() {}
  setDefaults() {}
  testCode() {}
  getEntry() {}
  newEntry() {}
  existingEntry() {}
}

// for main items themselves
const Main = class extends Base {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.companies = [];
    this.model.areas = [];
    this.model.glcodes = [];
    this.model.taxes = [];
    this.model.waivers = [];
    this.model.suppliers = [];

    super.createModel();
  }

  async ready() {
    let filterFunc = function(x) {
      // only show active=true
      return x.active;
    }

    return new Promise(async function(resolve) {
      Module.tableStores.company.addView(new TableView({proxy: this.model.companies, filterFunc}));
      Module.tableStores.area.addView(new TableView({proxy: this.model.areas, filterFunc}));
      Module.tableStores.glcode.addView(new TableView({proxy: this.model.glcodes, filterFunc}));
      Module.tableStores.tax.addView(new TableView({proxy: this.model.taxes, filterFunc}));
      Module.tableStores.waiver.addView(new TableView({proxy: this.model.waivers, filterFunc}));
      Module.tableStores.supplier.addView(new TableView({proxy: this.model.suppliers, filterFunc}));

      resolve();
    }.bind(this));
  }
}

// for item setup pages
const Setup = class extends Base {
  constructor(element) {
    super(element);

    this.helpDisplayed = false;
  }

}

export {Main, Setup}