// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {Modal} from '/~static/lib/client/widgets/modal.js';

// js for pages
import '/~static/apps/reservations/modules/res/create.js';
import '/~static/apps/reservations/modules/res/update.js';

let moduleStart = function() {
  let connectToData = async function() {
    // setup data table access
    // gets us access to raw data.
    Module.data.area = new TableAccess({modelName: 'area', url: `/items/v1/area`});    
    Module.data.pmtterms = new TableAccess({modelName: 'pmtterms', url: `/items/v1/pmtterms`});    
    Module.data.contact = new TableAccess({modelName: 'contact', url: `/contacts/v1/contact`});    
    Module.data.company = new TableAccess({modelName: 'company', url: `/contacts/v1/company`});    
    Module.data.currency = new TableAccess({modelName: 'currency', url: `/contacts/v1/currency`});    
    Module.data.main = new TableAccess({modelName: 'main', url: `/reservations/v1/main`});

    const itemData = new WSDataComm('items');                 // WS instances for items
    const contactData = new WSDataComm('contacts');                 // WS instances for contacts
    const resData = new WSDataComm('reservations');                 // WS instances for reservations

    const safemode = false;
    let model, dataPromises = [];

    // main table ---
    model = `/reservations/main`;                      // url-like of interest to follow model changes

    resData.addModel(model);                      // WS data change notifications.  
                                                      // Store model name to watch/follow.  
                                                      // One WSDataComm instance per app.
                                                      // First path segment must be the same as app

    Module.tableStores.main = new TableStore({accessor: Module.data.main, model, safemode});  // setup a table store in Module so all pages can access
    
    // Area
    model = `/items/area`;

    itemData.addModel(model);                          

    Module.tableStores.area = new TableStore({accessor: Module.data.area, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.area.getAll());

    // Pmt terms
    model = `/items/pmtterms`;

    itemData.addModel(model);                          

    Module.tableStores.pmtterms = new TableStore({accessor: Module.data.pmtterms, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.pmtterms.getAll());

    // Contact table ---
    model = `/contacts/contact`;

    contactData.addModel(model);                          

    Module.tableStores.contact = new TableStore({accessor: Module.data.contact, model, safemode});  // setup a table store in Module so all pages can access
    
    // Company table ---
    model = `/contacts/company`;

    contactData.addModel(model);                          

    Module.tableStores.company = new TableStore({accessor: Module.data.company, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.company.getAll());

    // Currency table ---
    model = `/contacts/currency`;

    contactData.addModel(model);                          

    Module.tableStores.currency = new TableStore({accessor: Module.data.currency, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.currency.getAll());

    // start following via WS ---
    resData.start();
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
    const startPage = 'create';

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

window.name = 'R4_main'

Module.modal = new Modal();
moduleStart();