// main
import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {io} from '/~static/lib/client/core/io.js';

// js for pages
import '/~static/apps/schema/modules/schema/navbar.js';
import '/~static/apps/schema/modules/schema/database-list.js';
import '/~static/apps/schema/modules/schema/workspace-list.js';
import '/~static/apps/schema/modules/schema/workspace-create.js';
import '/~static/apps/schema/modules/schema/workspace-update.js';
import '/~static/apps/schema/modules/schema/workspace-delete.js';
import '/~static/apps/schema/modules/schema/app-list.js';
import '/~static/apps/schema/modules/schema/app-create.js';
import '/~static/apps/schema/modules/schema/app-update.js';
import '/~static/apps/schema/modules/schema/app-delete.js';
import '/~static/apps/schema/modules/schema/table-list.js';
import '/~static/apps/schema/modules/schema/table-create.js';
import '/~static/apps/schema/modules/schema/table-update.js';
import '/~static/apps/schema/modules/schema/table-delete.js';
import '/~static/apps/schema/modules/schema/table-config.js';
import '/~static/apps/schema/modules/schema/table-config-pk.js';
import '/~static/apps/schema/modules/schema/table-config-orderby.js';
import '/~static/apps/schema/modules/schema/table-config-index-create.js';
import '/~static/apps/schema/modules/schema/table-config-index-delete.js';
import '/~static/apps/schema/modules/schema/table-config-fks-create.js';
import '/~static/apps/schema/modules/schema/table-config-fks-delete.js';
import '/~static/apps/schema/modules/schema/column-list.js';
import '/~static/apps/schema/modules/schema/column-create.js';
import '/~static/apps/schema/modules/schema/column-update.js';
import '/~static/apps/schema/modules/schema/column-delete.js';
import '/~static/apps/schema/modules/schema/query-list.js';
import '/~static/apps/schema/modules/schema/query-create.js';
//import '/~static/apps/schema/modules/schema/query-update.js';
import '/~static/apps/schema/modules/schema/query-delete.js';

Module.breadcrumb = async function({db='', ws='', app='', table='', query=''} = {}) {
  const hrefs = [];

  if (db) {
    let dbRec = await Module.tableStores.database.getOne(db);

    hrefs.push({'html': `<span mvc-click="breadcrumbGo('/database')">${dbRec.name}</span>`});

    if (ws) {
      let wsRec = await Module.tableStores.workspace.getOne(ws);

      hrefs.push({'html': `<span mvc-click="breadcrumbGo('/database/${db}/workspace')">${wsRec.name}</span>`});

      if (app) {
        let appRec = await Module.tableStores.application.getOne(app);

        hrefs.push({'html': `<span mvc-click="breadcrumbGo('/database/${db}/workspace/${ws}/app')">${appRec.name}</span>`});

        if (table) {
          let tableRec = await Module.tableStores.table.getOne(table);
  
          hrefs.push({'html': `<span mvc-click="breadcrumbGo('/database/${db}/workspace/${ws}/app/${app}/table')">${tableRec.name}</span>`});        

          if (query) {
            let queryRec = await Module.tableStores.query.getOne(query);
    
            hrefs.push({'html': `<span mvc-click="breadcrumbGo('/database/${db}/workspace/${ws}/app/${app}/table/${table}/query')">Queries</span>`});
          }
        }
      }
    }
  }

  return hrefs;
}

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
    Module.data.database = new TableAccess({modelName: 'database', url: `/schema/v1/database`});
    Module.data.workspace = new TableAccess({modelName: 'workspace', url: `/schema/v1/workspace`});
    Module.data.application = new TableAccess({modelName: 'application', url: `/schema/v1/application`});
    Module.data.table = new db4TableAccess({modelName: 'table', url: `/schema/v1/table`});
    Module.data.query = new TableAccess({modelName: 'query', url: `/schema/v1/query`});

    // url-like of interest to follow model changes
    // WS data change notifications.  
    // Store model name to watch/follow.  
    // One WSDataComm instance per app.
    // First path segment must be the same as app
    App.wsDataWatch = new WSDataComm('schema', 'roam3.adventurebooking.com:3011');                 // WS instances for this app

    model = `/schema/database`;                    
    App.wsDataWatch.addModel(model);             
    Module.tableStores.database = new TableStore({accessor: Module.data.database, model, safemode});  // setup a table store in Module so all pages can access

    model = `/schema/workspace`;                    
    App.wsDataWatch.addModel(model);             
    Module.tableStores.workspace = new TableStore({accessor: Module.data.workspace, model, safemode});  // setup a table store in Module so all pages can access

    model = `/schema/application`;
    App.wsDataWatch.addModel(model);
    Module.tableStores.application = new TableStore({accessor: Module.data.application, model, safemode});  // setup a table store in Module so all pages can access

    model = `/schema/table`;
    App.wsDataWatch.addModel(model);
    Module.tableStores.table = new TableStore({accessor: Module.data.table, model, safemode});  // setup a table store in Module so all pages can access

    model = `/schema/query`;
    App.wsDataWatch.addModel(model);
    Module.tableStores.query = new TableStore({accessor: Module.data.query, model, safemode});  // setup a table store in Module so all pages can access

    getAllPromises.push(Module.tableStores.database.getAll());                 // seed the database store

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
    const startPage = 'database';

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