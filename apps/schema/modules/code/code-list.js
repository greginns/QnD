import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';
import {CodeEditor} from '/~static/lib/client/core/codeEditor.js';
import {TreeManager} from '/~static/lib/client/core/treeManager.js';
import {TableStore, TableView} from '/~static/lib/client/core/data.js';

class FunctionTree extends TreeManager {
  constructor(el, data, ordering, opts) {
    super(el, data, ordering, opts);
  }
  
  init() {
  }

  async create(entry) {
    return await this.opts.io.create(entry);
  }

  async update(entry) {
    return await this.opts.io.update(entry);
  }

  async delete(id) {

  }
}

class Code_list extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    //this.model.codes = [];

    //this.codeView = new TableView({proxy: this.model.codes});
  }

  async ready() {
    return new Promise(async function(resolve) {
      // editor      
      let tabsEl = document.getElementById('editorTabs');
      let contentEl = document.getElementById('editorContent');
      let editor = new CodeEditor(tabsEl, contentEl);

      // Trees
      const datafuncs1 = [
        {name: 'Client Methods', id: '1', parent: null, folder: true, active: true, new: false, changed: false},
      ];

      const datafuncs2 = [
        {name: 'Server Requests', id: '2', parent: null, folder: true, active: true, new: false, changed: false},
      ];
      
      const datafuncs3 = [
        {name: 'Utility Functions', id: '3', parent: null, folder: true, active: true, new: false, changed: false},
      ];

      const opts = {
        newFiles: true, 
        newFolders: true, 
        editFiles: false, 
        reorder: true, 
        needActive: false, 
        externalEdit: true, 
        externalEditor: {create: editor.createNewEditor.bind(editor), update: editor.createNewEditor.bind(editor)},
        io: {create: this.create.bind(this), update: this.update.bind(this), delete: this.delete.bind(this)}
      };

      const opts1 = Object.assign({}, opts);
      const opts2 = Object.assign({}, opts);
      const opts3 = Object.assign({}, opts);

      opts1.passThru = {functype: 'CE'};
      opts2.passThru = {functype: 'SR'};
      opts3.passThru = {functype: 'UT'};

      // get data
      let allRecords = await Module.data.code.getAll();

      for (let rec of allRecords.data) {
        //rec.parent = '';
        if (rec.type == 'CE') datafuncs1.push(rec);
        if (rec.type == 'SR') datafuncs2.push(rec);
        if (rec.type == 'UT') datafuncs3.push(rec);
      }
      
      let tagEl1 = document.getElementById('tags1');
      new FunctionTree(tagEl1, datafuncs1, null, opts1);
      
      let tagEl2 = document.getElementById('tags2');
      new FunctionTree(tagEl2, datafuncs2, null, opts2);
      
      let tagEl3 = document.getElementById('tags3');
      new FunctionTree(tagEl3, datafuncs3, null, opts3);
      
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  async create(record) {
    let ret = await Module.data.code.insert(record);

    if (ret.status != 200) {
      console.log(ret.data.errors.code)
      return record;
    }
    
    return ret.data;
  }

  async update(record) {
    let ret = await Module.data.code.update(record.id, record);

    if (ret.status != 200) {
      console.log(ret.data.errors.code)
      return record;
    }
    
    return ret.data;
  }

  async delete(record) {
    console.log(record)
  }
}


let el1 = document.getElementById('code-list');   // page html
let mvc1 = new Code_list('code-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/code', title: 'codes', sections: [section1]});

Module.pages.push(page1);

/*
class Code_list extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.codes = [];
    this.workspace = '';

    this.model.badMessage = '';
    this.model.errors = {
      message: ''
    };

    this.codeStore;
    this.codeView = new TableView({proxy: this.model.codes});
  }

  async ready() {
    return new Promise(async function(resolve) {

      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    let model = '/schema/code';
    let conditions = {};

    let filters = {};
    
    conditions[model] = function(rec) {
      return true;
    };

    if (this.codeStore) {
      this.codeStore.kill();
    }

    this.codeStore = new TableStore({accessor: Module.data.code, filters, conditions});
    this.codeStore.addView(this.codeView);

    this.codeStore.getMany();
  }

  outView() {
    return true;  
  }

  create() {
    Module.pager.go(`/code/create`);
  }

  edit(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.codes[idx].id;

    Module.pager.go(`/code/${uuid}/update`);
  }

  delete(ev) {
    let idx = ev.target.closest('tr').getAttribute('data-index');
    let uuid = this.model.codes[idx].id;

    Module.pager.go(`/code/${uuid}/delete`);
  }
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('code-list');   // page html
let mvc1 = new Code_list('code-list-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/code', title: 'codes', sections: [section1]});

Module.pages.push(page1);
*/