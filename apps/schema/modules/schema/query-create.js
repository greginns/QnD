import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {io} from '/~static/lib/client/core/io.js';
import {Page, Section} from '/~static/lib/client/core/paging.js';

const tableNames = {};

class queryAccordion {
  constructor(anchor, outputEl, tableId, paths) {
    this.anchor = anchor;
    this.outputEl = outputEl;
    this.tableId = tableId;
    this.paths = paths || [];

    this.accordionToggle = this.accordionToggle.bind(this);

    this.buildAccordion(this.anchor, '', this.tableId);
    this.buildColumnNameList();
  }

  async buildColumnNameList() {
    const toGet = [];
    const names = [];
    const partList = [];

    // build list of unknown tables
    for (let path of this.paths) {
      let parts = path.split('.');
      let colName = parts.pop();      // col name is always last

      for (let part of parts) {
        if (part.indexOf('<') > -1) part = part.substr(0, part.indexOf('<'));
        if (part.indexOf('>') > -1) part = part.substr(0, part.indexOf('>'));

        if ((! (part in tableNames)) && partList.indexOf(part) == -1) {
          toGet.push(io.get({}, `/schema/v1/table/${encodeURIComponent(part)}`));
          partList.push(part);
        }
      }
    }

    // get Tables
    if (toGet.length > 0) {
      let res = await Promise.all(toGet);

      for (let t of res) {
        let id = t.data._pk, name = t.data.name;

        tableNames[id] = name;
      }
    }

    // build list of selected columns
    for (let path of this.paths) {
      let parts = path.split('.');
      let colName = parts.pop();      // col name is always last
      let name = '';

      for (let part of parts) {
        if (part.indexOf('<') > -1) part = part.substr(0, part.indexOf('<'));
        if (part.indexOf('>') > -1) part = part.substr(0, part.indexOf('>'));

        name += tableNames[part] + '.';
      }

      name += colName;

      names.push(name);
    }

    this.outputEl.innerText = names.join('\n');
  }

  async buildAccordion(anchor, parent, tableId) {
    const self = this;
    const items = [];
    const makeInput = function(path, name) {
      let checked = (self.paths.indexOf(path) > -1) ? 'checked' : '';

      return `
        <div class='row'>
          <div class='col-12'>
            <div class='checkbox-container'>
              <label class="checkbox-label label-color">
                ${name}
                <input type="checkbox" data-path='${path}' mvc-click='inputToggle' ${checked}>
                <span class="checkmark"></span>
              </label>
            </div>        
          </div>
        </div>
      `;
    }

    const makeMore = function(path, parent) {
      return `
        <div class='relatedAnchor'>
          <div class='row mt-2'>
            <div class='col-12'>
              <button class='btn btn-sm btn-outline-primary' data-path="${path}" data-parent="${parent}" mvc-click='getRelatedTables'>
                Get Related Tables
              </button>
            </div>
          </div>          
          <div class='row mt-2'>
            <div class='col-12'>
              <span class='anchor'></span>
            </div>
          </div>
        </div>
      `;
    }

    const initialLoop= function(table) {
      let body = '';
  
      // column names
      for (let c of table.columns) {
        body += makeInput(table.id + '.' + c.name, c.name);
      }

      // ask for more
      body += makeMore(table.id, table.id, table.name);

      items.push({title: table.name, body});
    }

    const relatedLoop = function(data, dir, set) {
      for (let table of data) {
        let body = '';
        let par = parent + dir + table.relname + '.' + table.id;
  
        // column names
        for (let c of table.cols) {
          body += makeInput(par + '.' + c.name, c.name);
        }
  
        // ask for more
        body += makeMore(table.id, par);
  
        items.push({title: table.name + set + ' relation: ' + table.relname, body});
      }
    }

    // Do it
    if (parent) {
      let [reta, rets] = await Promise.all([io.get({}, `/schema/v1/table/${encodeURIComponent(tableId)}/associated`), io.get({}, `/schema/v1/table/${encodeURIComponent(tableId)}/sets`)]);

      tableNames[reta.data._pk] = reta.data.name;
      tableNames[rets.data._pk] = rets.data.name;

      relatedLoop(reta.data, '>', '');
      relatedLoop(rets.data, '<', '[set]');
    }
    else {
      let ret = await io.get({}, `/schema/v1/table/${encodeURIComponent(tableId)}`);

      tableNames[ret.data._pk] = ret.data.name;

      initialLoop(ret.data);
    }

    this.createAccordion(anchor, items);
  }

  createAccordion(anchor, items) {
    let accDiv = document.createElement('div');
    accDiv.classList.add('accordion');

    for (let item of items) {
      let aiDiv = document.createElement('div');
      aiDiv.classList.add('accordion-item');

      let h2 = document.createElement('h2');
      h2.classList.add('accordion-header');

      let btn = document.createElement('button');
      btn.classList.add('accordion-button');
      btn.classList.add('collapsed');      
      btn.type = 'button';
      btn.addEventListener('click', this.accordionToggle);

      let strong = document.createElement('strong');
      strong.innerText = item.title;

      btn.appendChild(strong);

      let acDiv = document.createElement('div');
      acDiv.classList.add('accordion-collapse');
      acDiv.classList.add('collapse');

      let abDiv = document.createElement('div');
      abDiv.classList.add('accordion-body');
      abDiv.innerHTML = item.body;

      h2.appendChild(btn);
      aiDiv.appendChild(h2);

      acDiv.appendChild(abDiv);
      aiDiv.appendChild(acDiv);

      accDiv.appendChild(aiDiv);

      new bootstrap.Collapse(acDiv, {toggle: false});
    }

    anchor.appendChild(accDiv);

    for (let el of anchor.querySelectorAll('*')) {
      let attrs = el.attributes;

      for (let idx=0; idx<attrs.length; idx++) {
        let attr = attrs[idx].name;

        if (attr.substr(0,9) == 'mvc-click') {
          let val = attrs[idx].value;

          el.addEventListener('click', this[val].bind(this));
        }
      }
    };
  }

  accordionToggle(obj) {
    let btn = obj.target;                                                   // button clicked
    let item = btn.closest('.accordion-item');                              // accordion item
    let coll = item.querySelector('.accordion-collapse');                   // accordion-collapse area
    let parent = item.closest('.accordion');                                // accordion item's parent, ie the accordion
    let accs = Array.from(parent.querySelectorAll('.accordion-collapse'));  // all collapsible items in the accordion

    btn.classList.toggle('collapsed');                                      // change arrow direction

    for (let acc of accs) {
      bootstrap.Collapse.getInstance(acc).hide();                           // close all the accordion-collapse areas
    }

    bootstrap.Collapse.getInstance(coll).show();                            // show the accordion-collapse area clicked on.
  }

  getRelatedTables(obj) {
    let btn = obj.target;
    let tableId = btn.getAttribute('data-path');
    let parent = btn.getAttribute('data-parent');
    let anchor = btn.closest('div.relatedAnchor').querySelectorAll('span.anchor')[0];

    this.buildAccordion(anchor, parent, tableId);
  }

  inputToggle(obj) {
    let inp = obj.target;
    let path = inp.getAttribute('data-path');
    let checked = inp.checked;

    if (checked) {
      this.paths.push(path);
    }
    else {
      let idx = this.paths.indexOf(path);
      this.paths.splice(idx, 1);
    }

    this.buildColumnNameList();
  }

  getPaths() {
    return this.paths;
  }
}

class Query_create extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.query = {};
    this.model.database = '';
    this.model.workspace = '';
    this.model.app = '';
    this.model.table = '';

    this.model.badMessage = '';
    this.model.errors = {
      query: {},
      message: ''
    };

    this.crud = '';
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model.database = params.db;
    this.model.workspace = params.workspace;
    this.model.app = params.app;
    this.model.table = params.table;

    if ('query' in params) {
      this.queryId = params.query;

      let res = await Module.tableStores.query.getOne(this.queryId);

      this.model.query = this.$copy(res);
      this.origQuery = this.$copy(res);
      this.crud = 'update';
    }
    else {
      this.queryId = '';
      this.model.query.columns = [];
      this.model.query.orderby = [];
      this.origQuery = {columns: [], orderby: []};
      this.crud = 'create';
    }

    this.model.hrefs = await Module.breadcrumb({db: this.model.database, ws: this.model.workspace, app: this.model.app, table: this.model.table});

    let elc = document.getElementById('db4-query-' + this.crud + '-column-accordion');
    let elco = document.getElementById('db4-query-' + this.crud + '-column-chosen');

    let elq = document.getElementById('db4-query-' + this.crud + '-orderby-accordion');
    let elqo = document.getElementById('db4-query-' + this.crud + '-orderby-chosen');

    this.columnAccordion = new queryAccordion(elc, elco, this.model.table, this.model.query.columns);
    this.orderByAccordion = new queryAccordion(elq, elqo, this.model.table, this.model.query.orderby);
  }

  outView() {
    return true;  
  }

  async save(ev) {
    let query = this.model.query.toJSON();
    let diffs = {};

    if (!query.name) {
      this.model.badMessage = 'Please Enter a Query Name';
        
      setTimeout(function() {
        this.model.badMessage = '';
      }.bind(this), 2500);

      return;
    }

    query.table = this.model.table;
    query.columns = this.$copy(this.columnAccordion.getPaths());
    query.orderby = this.$copy(this.orderByAccordion.getPaths());

    if (this.queryId) {
      diffs = utils.object.diff(this.origQuery, query);
        
      if (Object.keys(diffs).length == 0) {
        this.model.badMessage = 'No Changes to Update';
        
        setTimeout(function() {
          this.model.badMessage = '';
        }.bind(this), 2500);

        return;
      }
    }

    let spinner = utils.modals.buttonSpinner(ev.target, true);

    utils.modals.overlay(true);

    let res = (this.queryId) ? await Module.tableStores.query.update(query.id, diffs) : await Module.tableStores.query.insert(query);

    if (res.status == 200) {
      utils.modals.toast('query', 'Created', 2000);
   
      this.model.query = {};
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
    Module.pager.go(`/database/${this.model.database}/workspace/${this.model.workspace}/app/${this.model.app}/table/${this.model.table}/query`);
  }

  breadcrumbGo(ev) {
    Module.pager.go(ev.args[0]);
  }  
}

// instantiate MVCs and hook them up to sections that will eventually end up in a page (done in module)
let el1 = document.getElementById('schema-query-create');   // page html
let mvc1 = new Query_create('schema-query-create-section');
let section1 = new Section({mvc: mvc1});
let page1 = new Page({el: el1, path: '/database/:db/workspace/:workspace/app/:app/table/:table/query/create', title: 'Query - Create', sections: [section1]});

Module.pages.push(page1);

let el2 = document.getElementById('schema-query-update');   // page html
let mvc2 = new Query_create('schema-query-update-section');
let section2 = new Section({mvc: mvc2});
let page2 = new Page({el: el2, path: '/database/:db/workspace/:workspace/app/:app/table/:table/query/:query/update', title: 'Query - Update', sections: [section2]});

Module.pages.push(page2);