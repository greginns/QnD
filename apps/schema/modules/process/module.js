// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {App} from '/~static/lib/client/core/app.js';

// js for pages
import '/~static/apps/schema/modules/process/navbar.js';
import '/~static/apps/schema/modules/process/process-list.js';
import '/~static/apps/schema/modules/process/process-create.js';
import '/~static/apps/schema/modules/process/process-update.js';
import '/~static/apps/schema/modules/process/process-delete.js';
import '/~static/apps/schema/modules/process/process-steps.js';

import '/~static/project/mixins/mvc_ext.js';

let moduleStart = function() {
  let connectToData = async function() {
    const safemode = false;
    let model, getAllPromises = [];

    // setup data table access
    // gets us access to raw data.
    Module.data.workspace = new TableAccess({modelName: 'workspace', url: `/schema/v1/workspace`});
    Module.data.application = new TableAccess({modelName: 'application', url: `/schema/v1/application`});
    Module.data.table = new TableAccess({modelName: 'table', url: `/schema/v1/table`});
    Module.data.bizprocess = new TableAccess({modelName: 'bizprocess', url: `/schema/v1/bizprocess`});

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

    model = `/schema/bizprocess`;                    
    App.wsDataWatch.addModel(model);             
    Module.tableStores.bizprocess = new TableStore({accessor: Module.data.bizprocess, model, safemode});  // setup a table store in Module so all pages can access

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
    const startPage = '';

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

window.name = 'DB4_process'

moduleStart();