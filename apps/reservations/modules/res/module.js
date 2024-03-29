// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {Modal} from '/~static/lib/client/widgets/modal.js';
import {MDateModal} from '/~static/lib/client/widgets/mdate.js';

// js for pages
import '/~static/apps/reservations/modules/res/create.js';
import '/~static/apps/reservations/modules/res/update.js';
import '/~static/apps/documents/modules/send/docsend.js';
import '/~static/lib/client/widgets/mdate.js';

let moduleStart = function() {
  let connectToData = async function() {
    // setup data table access
    // gets us access to raw data.
    Module.data.main = new TableAccess({modelName: 'main', url: `/reservations/v1/main`});
    Module.data.item = new TableAccess({modelName: 'item', url: `/reservations/v1/item`});
    Module.data.discount = new TableAccess({modelName: 'discount', url: `/reservations/v1/discount`});

    Module.data.activity = new TableAccess({modelName: 'activity', url: `/items/v1/activity`});    
    Module.data.actgroup = new TableAccess({modelName: 'actgroup', url: `/items/v1/actgroup`});    
    Module.data.actrates = new TableAccess({modelName: 'actrates', url: `/items/v1/actrates`});    
    Module.data.actinclm = new TableAccess({modelName: 'actinclm', url: `/items/v1/actinclm`});    

    Module.data.meals = new TableAccess({modelName: 'meals', url: `/items/v1/meals`});    
    Module.data.meallocn = new TableAccess({modelName: 'meallocn', url: `/items/v1/meallocn`});    
    Module.data.mealrates = new TableAccess({modelName: 'mealrates', url: `/items/v1/mealrates`});    

    Module.data.area = new TableAccess({modelName: 'area', url: `/items/v1/area`});    
    Module.data.pmtterms = new TableAccess({modelName: 'pmtterms', url: `/items/v1/pmtterms`});    

    Module.data.contact = new TableAccess({modelName: 'contact', url: `/contacts/v1/contact`});    
    Module.data.company = new TableAccess({modelName: 'company', url: `/contacts/v1/company`});    
    Module.data.currency = new TableAccess({modelName: 'currency', url: `/contacts/v1/currency`});  
    Module.data.config = new TableAccess({modelName: 'config', url: `/contacts/v1/config`});  
    Module.data.emailhist = new TableAccess({modelName: 'emailhist', url: `/contacts/v1/emailhist`});
    
    Module.data.docsetup = new TableAccess({modelName: 'docsetup', url: `/documents/v1/docsetup`});
    Module.data.document = new TableAccess({modelName: 'document', url: `/documents/v1/document`});
    Module.data.docletter = new TableAccess({modelName: 'docletter', url: `/documents/v1/docletter`});

    const itemData = new WSDataComm('items');                 // WS instances for items
    const contactData = new WSDataComm('contacts');                 // WS instances for contacts
    const resData = new WSDataComm('reservations');                 // WS instances for reservations
    const docData = new WSDataComm('documents');                 // WS instances for this app

    const safemode = false;
    let model, dataPromises = [];

    // main table ---
    model = `/reservations/main`;                      // url-like of interest to follow model changes

    resData.addModel(model);                      // WS data change notifications.  
                                                      // Store model name to watch/follow.  
                                                      // One WSDataComm instance per app.
                                                      // First path segment must be the same as app

    Module.tableStores.main = new TableStore({accessor: Module.data.main, model, safemode});  // setup a table store in Module so all pages can access
    
    // item table ---
    model = `/reservations/item`;

    resData.addModel(model); 
    
    Module.tableStores.item = new TableStore({accessor: Module.data.item, model, safemode});  // setup a table store in Module so all pages can access    

    // Discount
    model = `/reservations/discount`;

    resData.addModel(model);

    Module.tableStores.discount = new TableStore({accessor: Module.data.discount, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.discount.getAll());

    // Area
    model = `/items/area`;

    itemData.addModel(model);                          

    Module.tableStores.area = new TableStore({accessor: Module.data.area, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.area.getAll());

    // Activity
    model = `/items/activity`;

    itemData.addModel(model);                          

    Module.tableStores.activity = new TableStore({accessor: Module.data.activity, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.activity.getAll());

    // Actgroup
    model = `/items/actgroup`;

    itemData.addModel(model);                          

    Module.tableStores.actgroup = new TableStore({accessor: Module.data.actgroup, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.actgroup.getAll());

    // Actrates
    model = `/items/actrates`;

    itemData.addModel(model);                          

    Module.tableStores.actrates = new TableStore({accessor: Module.data.actrates, model, safemode});  // setup a table store in Module so all pages can access    

    // Actinclm
    model = `/items/actinclm`;

    itemData.addModel(model);                          

    Module.tableStores.actinclm = new TableStore({accessor: Module.data.actinclm, model, safemode});  // setup a table store in Module so all pages can access    
    
    // Meals
    model = `/items/meals`;

    itemData.addModel(model);                          

    Module.tableStores.meals = new TableStore({accessor: Module.data.meals, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.meals.getAll());

    // Meallocn
    model = `/items/meallocn`;

    itemData.addModel(model);                          

    Module.tableStores.meallocn = new TableStore({accessor: Module.data.meallocn, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.meallocn.getAll());

    // mealrates
    model = `/items/mealrates`;

    itemData.addModel(model);                          

    Module.tableStores.mealrates = new TableStore({accessor: Module.data.mealrates, model, safemode});  // setup a table store in Module so all pages can access    

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

    // Config table ---
    model = `/contacts/config`;

    contactData.addModel(model);                          

    Module.tableStores.config = new TableStore({accessor: Module.data.config, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.config.getAll());

    
    // Docsetup table ---
    model = `/documents/docsetup`;                      // url-like of interest to follow model changes

    docData.addModel(model);                      // WS data change notifications.  

    Module.tableStores.docsetup = new TableStore({accessor: Module.data.docsetup, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.docsetup.getAll());               // seed the table store

    // Document table ---
    model = `/documents/document`;               

    docData.addModel(model);                          

    Module.tableStores.document = new TableStore({accessor: Module.data.document, model, safemode});  // setup a table store in Module so all pages can access
    //dataPromises.push(Module.tableStores.associate.getAll());

    // docletter table ---
    model = `/documents/docletter`;               

    docData.addModel(model);                          

    Module.tableStores.docletter = new TableStore({accessor: Module.data.docletter, model, safemode});  // setup a table store in Module so all pages can access
    //dataPromises.push(Module.tableStores.docletter.getAll());

    // start following via WS ---
    resData.start();
    itemData.start();
    contactData.start();
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
Module.widgets.MDateModal = new MDateModal(document.getElementById('widget-mdate-modal'));

let winSize = '';

window.onresize = function () {
  let newWinSize = 'xs'; // default value
  let w = window.innerWidth;

  if (w >= 1400) {
    newWinSize = 'xxl';
  }
  else if (w >= 1200) {
    newWinSize = 'xl';
  } 
  else if (w >= 992) {
    newWinSize = 'lg';
  } 
  else if (w >= 768) 
  {
    newWinSize = 'md';
  }
  else if (w >= 576) 
  {
    newWinSize = 'sm';
  }

  if (newWinSize != winSize ) {
    document.dispatchEvent(new CustomEvent('breakpoint-change', {detail: {size: newWinSize}, bubbles: false}));

    winSize = newWinSize;
  }
};

moduleStart();