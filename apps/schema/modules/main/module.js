// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {io} from '/~static/lib/client/core/io.js';
import {App} from '/~static/lib/client/core/app.js';

// js for pages
import '/~static/apps/schema/modules/main/navbar.js';
import '/~static/apps/schema/modules/main/workspace-list.js';
import '/~static/apps/schema/modules/main/workspace-create.js';
import '/~static/apps/schema/modules/main/workspace-update.js';
import '/~static/apps/schema/modules/main/workspace-delete.js';
import '/~static/apps/schema/modules/main/app-list.js';
import '/~static/apps/schema/modules/main/app-create.js';
import '/~static/apps/schema/modules/main/app-update.js';
import '/~static/apps/schema/modules/main/app-delete.js';
import '/~static/apps/schema/modules/main/table-list.js';
import '/~static/apps/schema/modules/main/table-create.js';
import '/~static/apps/schema/modules/main/table-update.js';
import '/~static/apps/schema/modules/main/table-delete.js';
import '/~static/apps/schema/modules/main/table-config.js';
import '/~static/apps/schema/modules/main/table-config-pk.js';
import '/~static/apps/schema/modules/main/table-config-orderby.js';
import '/~static/apps/schema/modules/main/table-config-index-create.js';
import '/~static/apps/schema/modules/main/table-config-index-delete.js';
import '/~static/apps/schema/modules/main/table-config-fks-create.js';
import '/~static/apps/schema/modules/main/table-config-fks-delete.js';
import '/~static/apps/schema/modules/main/column-list.js';
import '/~static/apps/schema/modules/main/column-create.js';
import '/~static/apps/schema/modules/main/column-update.js';
import '/~static/apps/schema/modules/main/column-delete.js';

import '/~static/project/mixins/mvc_ext.js';

class db4TableAccess extends TableAccess {
  constructor({modelName, url=''} = {}) {
    super({modelName, url});
  }

  async insertColumn(table, colData) {
    let rec = {};
    rec['table'] = colData;

    return await io.post(rec, `/schema/v1/table/${encodeURIComponent(table)}/column`);
  }

  async updateColumn(table, name, colData) {
    let rec = {};
    rec['table'] = colData;

    return await io.put(rec, `/schema/v1/table/${encodeURIComponent(table)}/column/${encodeURIComponent(name)}`);
  }

  async deleteColumn(table, name) {
    return await io.delete({}, `/schema/v1/table/${encodeURIComponent(table)}/column/${encodeURIComponent(name)}`);
  }

  async updatePK(table, pkData) {
    let rec = {};
    rec['table'] = pkData;

    return await io.put(rec, `/schema/v1/table/${encodeURIComponent(table)}/pk`);
  }

  async insertFK(table, fkData) {
    let rec = {};
    rec['table'] = fkData;

    return await io.post(rec, `/schema/v1/table/${encodeURIComponent(table)}/fk`);    
  }

  async deleteFK(table, name) {
    return await io.delete({}, `/schema/v1/table/${encodeURIComponent(table)}/fk/${encodeURIComponent(name)}`);
  }

  async insertIndex(table, idxData) {
    let rec = {};
    rec['table'] = idxData;

    return await io.post(rec, `/schema/v1/table/${encodeURIComponent(table)}/index`);    
  }

  async deleteIndex(table, name) {
    return await io.delete({}, `/schema/v1/table/${encodeURIComponent(table)}/index/${encodeURIComponent(name)}`);
  }

  async updateOrderBy(table, orderData) {
    let rec = {};
    rec['table'] = orderData;

    return await io.put(rec, `/schema/v1/table/${encodeURIComponent(table)}/orderby`);
  }
}

let moduleStart = function() {
  let connectToData = async function() {
    const safemode = false;
    let model, getAllPromises = [];

    // setup data table access
    // gets us access to raw data.
    Module.data.workspace = new TableAccess({modelName: 'workspace', url: `/schema/v1/workspace`});
    Module.data.application = new TableAccess({modelName: 'application', url: `/schema/v1/application`});
    Module.data.table = new db4TableAccess({modelName: 'table', url: `/schema/v1/table`});

    // url-like of interest to follow model changes
    // WS data change notifications.  
    // Store model name to watch/follow.  
    // One WSDataComm instance per app.
    // First path segment must be the same as app
    App.wsDataWatch = new WSDataComm('schema', 'roam3.adventurebooking.com:3011');                 // WS instances for this app

    model = `/schema/workspace`;                    
    App.wsDataWatch.addModel(model);             
    Module.tableStores.workspace = new TableStore({accessor: Module.data.workspace, model, safemode});  // setup a table store in Module so all pages can access

    model = `/schema/application`;
    App.wsDataWatch.addModel(model);
    Module.tableStores.application = new TableStore({accessor: Module.data.application, model, safemode});  // setup a table store in Module so all pages can access

    model = `/schema/table`;
    App.wsDataWatch.addModel(model);
    Module.tableStores.table = new TableStore({accessor: Module.data.table, model, safemode});  // setup a table store in Module so all pages can access

    getAllPromises.push(Module.tableStores.workspace.getAll());                 // seed the workspace store

    // start following via WS ---
    App.wsDataWatch.start();

    // fill up on data
    Promise.all(getAllPromises)
    .then(function() {
      // tell everybody that data is ready
      document.dispatchEvent(new CustomEvent('tablestoreready', {bubbles: false}));
    })    
    .catch(function(err) {
      console.error(err);
    })
  }

  let startPages = async function() {
    // page URL data  
    const module = location.pathname.split('/')[1]; 
    const startPage = 'workspace';

    // Start up pages.  Module.pages saved up all page references
    const pager = new Pages({root: `/${module}`, pages: Module.pages});

    try {
      // fire off init method in each section of each page.
      await pager.ready(startPage);   // default page
    }
    catch(e) {
      console.log('FAILURE TO LAUNCH');
      console.log(e)
    }
  }

  document.addEventListener('tablestoreready', async function() {
    startPages();
  }.bind(this), {once: true});

  connectToData();
}

window.name = 'DB4_Schema'

moduleStart();