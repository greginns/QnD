// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {Modal} from '/~static/lib/client/widgets/modal.js';

// js for pages
import '/~static/apps/reservations/modules/setup/start.js';

import '/~static/apps/reservations/modules/setup/discount.js';
import '/~static/apps/reservations/modules/setup/cancreas.js';

let moduleStart = function() {
  let connectToData = async function() {
    // setup data table access
    // gets us access to raw data.
    Module.data.discount = new TableAccess({modelName: 'discount', url: `/reservations/v1/discount`});
    Module.data.cancreas = new TableAccess({modelName: 'cancreas', url: `/reservations/v1/cancreas`});

    const docData = new WSDataComm('reservations');                 // WS instances for this app
    const safemode = false;
    let model, dataPromises = [];

    // Discount table ---
    model = `/reservations/discount`;                      // url-like of interest to follow model changes

    docData.addModel(model);                      // WS data change notifications.  
                                                      // Store model name to watch/follow.  
                                                      // One WSDataComm instance per app.
                                                      // First path segment must be the same as app

    Module.tableStores.discount = new TableStore({accessor: Module.data.discount, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.discount.getAll());               // seed the table store

    // Cancreas table ---
    model = `/reservations/cancreas`;               

    docData.addModel(model);                          

    Module.tableStores.cancreas = new TableStore({accessor: Module.data.cancreas, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.cancreas.getAll());

    // start following via WS ---
    docData.start();

    // fill up on data
    Promise.all(dataPromises)
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
    const startPage = 'start'; //'discount';

    // Start up pages.  Module.pages saved up all page references
    const pager = new Pages({root: `/${module}`, pages: Module.pages});
    Module.pager = pager.router;

    try {
      // fire off init method in each section of each page.
      document.getElementById('overlayAndSpinner').style.display = 'none';
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

window.name = 'R4_discount'

Module.modal = new Modal();
moduleStart();