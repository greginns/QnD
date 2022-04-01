// main
import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';

// js for pages
//import '/~static/apps/schema/modules/process/navbar.js';
import '/~static/apps/schema/modules/code/code-list.js';
import '/~static/apps/schema/modules/code/code-create.js';
import '/~static/apps/schema/modules/code/code-delete.js';
import '/~static/apps/schema/modules/code/codebundle-list.js';
import '/~static/apps/schema/modules/code/codebundle-create.js';
import '/~static/apps/schema/modules/code/codebundle-delete.js';

let moduleStart = function() {
  let connectToData = async function() {
    const safemode = false;
    let model, getAllPromises = [];

    // setup data table access
    // gets us access to raw data.
    Module.data.code = new TableAccess({modelName: 'code', url: `/schema/v1/code`});
    Module.data.codebundle = new TableAccess({modelName: 'codebundle', url: `/schema/v1/codebundle`});

    // url-like of interest to follow model changes
    // WS data change notifications.  
    // Store model name to watch/follow.  
    // One WSDataComm instance per app.
    // First path segment must be the same as app
    App.wsDataWatch = new WSDataComm('schema', 'roam3.adventurebooking.com:3011');                 // WS instances for this app

    model = `/schema/code`;
    App.wsDataWatch.addModel(model);             
    Module.tableStores.code = new TableStore({accessor: Module.data.code, model, safemode});  // setup a table store in Module so all pages can access

    getAllPromises.push(Module.tableStores.code.getAll());                 

    model = `/schema/codebundle`;
    App.wsDataWatch.addModel(model);             
    Module.tableStores.codebundle = new TableStore({accessor: Module.data.codebundle, model, safemode});  // setup a table store in Module so all pages can access

    getAllPromises.push(Module.tableStores.codebundle.getAll());                 

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
    const startPage = 'code';

    // Start up pages.  Module.pages saved up all page references
    const pager = new Pages({root: `/${module}`, pages: Module.pages});
    Module.pager = pager.router;

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

window.name = 'DB4_code'

moduleStart();