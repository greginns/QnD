import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

class Column_update extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.table = {};
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';
    this.model.column = {};

    this.model.display = {}
    this.model.values = {};

    this.model.FALSE = false;

    this.model.badMessage = '';
    this.model.errors = {
      table: {},
      message: ''
    };
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;
    this.model.columnName = params.name;

    this.setDefaults();
    this.setExisting();
    this.typeChanged();    
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let column = this.model.column.toJSON();
    let res = await Module.tableStores.table.getOne(this.model.table);

    if (!column.name) {
      this.model.badMessage = 'Please Enter a Column Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    if (res.null && !column.null && !column.default) { // changing from Null to Not Null requires a default
      this.model.badMessage = 'A default value is required';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    if (this.model.columnName != column.name) {
      // col name has changed, make sure it doesn't already exists
      // not allowed yet (field is disabled).  Will break FK/Index defns.
      let dupe = false;

      for (let col of res.columns || []) {
        if (column.name == col.name) {
          dupe = true;
          break;
        }
      }

      if (dupe) {
        this.model.badMessage = 'Duplicate Column Name';
          
        setTimeout(function() {
          this.model.badMessage = '';
        }.bind(this), 2500);

        return;
      }
    }

    utils.modals.overlay(true);

    let spinner = utils.modals.buttonSpinner(ev.target, true);
    res = await Module.data.table.updateColumn(this.model.table, this.model.columnName, {column});

    if (res.status == 200) {
      utils.modals.toast('Column', 'Updated', 2000);
   
      this.model.column = {};

      this.gotoList();
    }
    else {
      this.displayErrors(res);
    }
    
    utils.modals.overlay(false);
    utils.modals.buttonSpinner(ev.target, false, spinner);
  }

  cancel() {
    this.gotoList();
  }

  gotoList() {
    Module.pager.go(`/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/column`);
  }

  async setDefaults() {
    this.model.values.columnTypes = [
      {value: 'CC', text: 'Text'},
      {value: 'CT', text: 'Textarea'},
      {value: 'CP', text: 'Password'},
      {value: 'NI', text: 'Numeric - Integer'},
      {value: 'NF', text: 'Numeric - Float'},
      {value: 'ND', text: 'Numeric - Currency'},
      {value: 'NS', text: 'Auto-Increment'},
      {value: 'DD', text: 'Date'},
      {value: 'DT', text: 'Time'},
      {value: 'DZ', text: 'Date and Time'},
      {value: 'MB', text: 'Yes/No'},
      {value: 'MU', text: 'Unique ID'},
    ];

    this.model.values.date = [
      {value: 'D', text: 'Current Date'},
      {value: 'U', text: 'Specific Date'}
    ];

    this.model.values.time = [
      {value: 'T', text: 'Current Time'},
      {value: 'U', text: 'Specific Time'}
    ];

    this.model.values.datetime = [
      {value: 'Z', text: 'Current DateTime'},
      {value: 'U', text: 'Specific DateTime'}
    ];

    this.model.column.name = '';
    this.model.column.type = 'CC';
    this.model.column.defaultDD = 'D';
    this.model.column.defaultDT = 'T';
    this.model.column.defaultDZ = 'Z';
    this.model.column.digits = 8;
    this.model.column.decimals = 2;
    this.model.column.start = 0;
    this.model.column.null = true;
    this.model.column.hidden = false;
  }

  async setExisting() {
    let res = await Module.tableStores.table.getOne(this.model.table);

    for (let col of res.columns || []) {
      if (col.name == this.model.columnName) {
        this.model.column = col;
      }
    }
  }

  typeChanged() {
    // setup display flags
    let type = this.model.column.type;

    this.model.display.maxlength = false;
    this.model.display.default = false;
    this.model.display.defaultDD = false;
    this.model.display.defaultDD2 = false;
    this.model.display.defaultDT = false;
    this.model.display.defaultDT2 = false;
    this.model.display.defaultDZ = false;
    this.model.display.defaultDZ2 = false;
    this.model.display.digits = false;
    this.model.display.decimals = false;
    this.model.display.start = false;

    switch(type) {
      case 'CC':
        this.model.column.maxlength = 40;
        this.model.display.maxlength = true;
        this.model.display.default = true;
        break;

      case 'CT':
        this.model.display.default = true;
        break;

      case 'CP':
        this.model.column.maxlength = 128;
        this.model.column.null = false;
        this.model.column.hidden = true;
        break;

      case 'ND':
        this.model.display.digits = true;
        this.model.display.decimals = true;
        break;

      case 'NS':
        this.model.display.start = true;
        break;

      case 'DD':
        this.model.display.defaultDD = true;
        this.ddChanged();
        break;        

      case 'DT':
        this.model.display.defaultDT = true;
        this.dtChanged();
        break;                      

      case 'DZ':
        this.model.display.defaultDD = true;
        this.dzChanged();
        break;                 
      
    }
  }

  ddChanged() {
    this.model.display.defaultDD2 = (this.model.column.defaultDD == 'U');
  }

  dtChanged() {
    this.model.display.defaultDT2 = (this.model.column.defaultDT == 'U');
  }

  dzChanged() {
    this.model.display.defaultDZ2 = (this.model.column.defaultDZ == 'U');
  }

}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-column-update');   // page html
let mvc1 = new Column_update('schema-column-update-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/workspace/:workspace/app/:app/table/:table/column/:name/update', title: 'Columns - Update', sections: [section1]});

Module.pages.push(page1);