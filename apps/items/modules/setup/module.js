// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {Modal} from '/~static/lib/client/widgets/modal.js';

// js for pages
import '/~static/apps/items/modules/setup/start.js';
import '/~static/apps/items/modules/setup/main-activity.js';
import '/~static/apps/items/modules/setup/main-actgroup.js';
import '/~static/apps/items/modules/setup/main-lodglocn.js';
import '/~static/apps/items/modules/setup/main-lodging.js';
import '/~static/apps/items/modules/setup/main-lodgtype.js';
import '/~static/apps/items/modules/setup/main-area.js';
import '/~static/apps/items/modules/setup/main-glcode.js';
import '/~static/apps/items/modules/setup/main-tax.js';
import '/~static/apps/items/modules/setup/main-waiver.js';
import '/~static/apps/items/modules/setup/main-print.js';
import '/~static/apps/items/modules/setup/main-import.js';

let moduleStart = function() {
  let connectToData = async function() {
    // setup data table access
    // gets us access to raw data.
    Module.data.activity = new TableAccess({modelName: 'activity', url: `/items/v1/activity`});
    Module.data.lodging = new TableAccess({modelName: 'lodging', url: `/items/v1/lodging`});

    Module.data.actgroup = new TableAccess({modelName: 'actgroup', url: `/items/v1/actgroup`});
    Module.data.lodglocn = new TableAccess({modelName: 'lodglocn', url: `/items/v1/lodglocn`});
    Module.data.lodgtype = new TableAccess({modelName: 'lodgtype', url: `/items/v1/lodgtype`});

    Module.data.area = new TableAccess({modelName: 'area', url: `/items/v1/area`});
    Module.data.glcode = new TableAccess({modelName: 'glcode', url: `/items/v1/glcode`});
    Module.data.tax = new TableAccess({modelName: 'tax', url: `/items/v1/tax`});
    Module.data.waiver = new TableAccess({modelName: 'waiver', url: `/items/v1/waiver`});

    Module.data.company = new TableAccess({modelName: 'company', url: `/contacts/v1/company`});    
    
    const itemData = new WSDataComm('items');                 // WS instances for items
    const contactData = new WSDataComm('contacts');                 // WS instances for contacts
    const safemode = false;
    let model, dataPromises = [];

    // Activity
    model = `/items/activity`;                      // url-like of interest to follow model changes

    itemData.addModel(model);                      // WS data change notifications.  
                                                      // Store model name to watch/follow.  
                                                      // One WSDataComm instance per app.
                                                      // First path segment must be the same as app

    Module.tableStores.activity = new TableStore({accessor: Module.data.activity, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.activity.getAll());               // seed the table store

    // Lodging
    model = `/items/lodging`;               

    itemData.addModel(model);                          

    Module.tableStores.lodging = new TableStore({accessor: Module.data.lodging, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.lodging.getAll());

    // Actgroup
    model = `/items/actgroup`;               

    itemData.addModel(model);                          

    Module.tableStores.actgroup = new TableStore({accessor: Module.data.actgroup, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.actgroup.getAll());

    // Lodglocn
    model = `/items/lodglocn`;               

    itemData.addModel(model);                          

    Module.tableStores.lodglocn = new TableStore({accessor: Module.data.lodglocn, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.lodglocn.getAll());

    // Lodgtype
    model = `/items/lodgtype`;

    itemData.addModel(model);                          

    Module.tableStores.lodgtype = new TableStore({accessor: Module.data.lodgtype, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.lodgtype.getAll());

    // Area
    model = `/items/area`;

    itemData.addModel(model);                          

    Module.tableStores.area = new TableStore({accessor: Module.data.area, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.area.getAll());

    // Glcode
    model = `/items/glcode`;

    itemData.addModel(model);                          

    Module.tableStores.glcode = new TableStore({accessor: Module.data.glcode, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.glcode.getAll());    

    // Tax
    model = `/items/tax`;

    itemData.addModel(model);                          

    Module.tableStores.tax = new TableStore({accessor: Module.data.tax, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.tax.getAll());

    // Area
    model = `/items/waiver`;

    itemData.addModel(model);                          

    Module.tableStores.waiver = new TableStore({accessor: Module.data.waiver, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.waiver.getAll());    

    // company table ---
    model = `/contacts/company`;

    contactData.addModel(model);                          

    Module.tableStores.company = new TableStore({accessor: Module.data.company, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.company.getAll());

    
    // start following via WS ---
    itemData.start();
    contactData.start();

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
    const startPage = 'start';

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

window.name = 'R4_itemsetup'

Module.modal = new Modal();
moduleStart();