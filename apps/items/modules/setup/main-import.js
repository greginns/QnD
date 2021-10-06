import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {Setup} from '/~static/apps/items/modules/setup/baseclasses.js';

class Import extends Setup {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.table = '';
    this.sheet = '';
    this.columnNames = [];
    this.model.upsert = false;
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.table = params.table;
    this.model.title = decodeURI(params.title);

    this.doIt();
  }

  outView() {
    return true;  
  }

  goBack() {
    Module.pager.back();
  }

  async doIt() {
    // column width: 
    //  max of: title.length x 12, maxlength x 12
    let [hdrs] = await this.options_getHeadersAndData(this.table);
    let columns = [];

    this.columnNames = [];

    for (let h of hdrs) {
      let type = (h[3] == 'Boolean') ? 'checkbox' : 'text';
      let width = Math.max(h[2] * 12, h[1].length * 12);

      columns.push({type, title: h[1], width});
      this.columnNames.push(h[0]);
    }

    columns.push({type: 'text', title: 'Upload Result', width: 240})

    this.sheet = jspreadsheet(document.getElementById('ss-import'), {
      data: [[]],
      columns,
      minDimensions: [columns.length, 20]
    });
  }

  async import() {
    let data = this.sheet.getData();
    let replace = this.model.upsert;
    let lastCol = this.columnNames.length;
    let rowCount = -1;
    
    for (let row of data) {
      rowCount++;

      if (row[lastCol]) continue;  // skip ones with a result
      if (!row[0]) continue; // skip no code

      let obj = {}, i=-1, res, msg='';

      for (let i=0; i<this.columnNames.length; i++) {
        obj[this.columnNames[i]] = row[i];
      }

      if (replace) {
        let code = obj.code;
        delete obj.code;

        res = await Module.tableStores[this.table].update(code, obj);
      }
      else {
        res = await Module.tableStores[this.table].insert(obj);
      }

      if (res.status == 200) {
        msg = 'Success'
      }
      else {
        let errList = [];

        errList.push(res.data.message);

        let errs = res.data.errors[this.model] || {};

        for (let k in errs) {
          errList.push(k + ': ' + errs[k]);
        }

        msg = errList.join(', ');
      }

      this.sheet.setValue(this.makeColID(lastCol) + rowCount, msg);
    }
  }

  makeColID(int) {
    // 0-25 = A-Z
    // 26-701 = AA - AZ
    if (int < 26) return String.fromCharCode(65+int);

    let first = String.fromCharCode(parseInt(int/26, 10) + 64);
    let second = String.fromCharCode((int % 26) + 65);

    return first + second;
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('items-main-import');   // page html
let setup1 = new Import('items-main-import-section');
let section1 = new Section({mvc: setup1});
let page1 = new Page({el: el1, path: ['/import/:table'], title: 'Import', sections: [section1]});

Module.pages.push(page1);