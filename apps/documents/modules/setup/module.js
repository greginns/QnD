// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {Modal} from '/~static/lib/client/widgets/modal.js';

// js for pages
import '/~static/apps/documents/modules/setup/docsetup.js';
import '/~static/apps/documents/modules/setup/document.js';
//import '/~static/apps/documents/modules/send/docsend.js';

let moduleStart = function() {
  let connectToData = async function() {
    // setup data table access
    // gets us access to raw data.
    Module.data.docsetup = new TableAccess({modelName: 'docsetup', url: `/documents/v1/docsetup`});
    Module.data.document = new TableAccess({modelName: 'document', url: `/documents/v1/document`});
    Module.data.docletter = new TableAccess({modelName: 'docletter', url: `/documents/v1/docletter`});
    Module.data.contact = new TableAccess({modelName: 'contact', url: `/contacts/v1/contact`});
    Module.data.company = new TableAccess({modelName: 'company', url: `/contacts/v1/company`});
    Module.data.emailhist = new TableAccess({modelName: 'emailhist', url: `/contacts/v1/emailhist`});
    Module.data.main = new TableAccess({modelName: 'main', url: `/reservations/v1/main`});

    const docData = new WSDataComm('documents');                 // WS instances for this app
    const resData = new WSDataComm('reservations');                 // WS instances for this app
    const conData = new WSDataComm('contacts');                 // WS instances for this app

    const safemode = false;
    let model, dataPromises = [];

    // Docsetup table ---
    model = `/documents/docsetup`;                      // url-like of interest to follow model changes

    docData.addModel(model);                      // WS data change notifications.  
                                                      // Store model name to watch/follow.  
                                                      // One WSDataComm instance per app.
                                                      // First path segment must be the same as app

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

    // contact table ---
    model = `/contacts/contact`;               

    conData.addModel(model);                          

    Module.tableStores.contact = new TableStore({accessor: Module.data.contact, model, safemode});  // setup a table store in Module so all pages can access

    // company table ---
    model = `/contacts/company`;

    conData.addModel(model);                          

    Module.tableStores.company = new TableStore({accessor: Module.data.company, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.company.getMany({filters: {active: true}}));

    // emailhist table ---
    model = `/contacts/emailhist`;

    conData.addModel(model);                          

    Module.tableStores.emailhist = new TableStore({accessor: Module.data.emailhist, model, safemode});  // setup a table store in Module so all pages can access

    // main table ---
    model = `/reservations/main`;               

    resData.addModel(model);                          

    Module.tableStores.main = new TableStore({accessor: Module.data.main, model, safemode});  // setup a table store in Module so all pages can access

    // start following via WS ---
    docData.start();
    resData.start();
    conData.start();

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
    const startPage = 'docsend'; //'docsetup';

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

window.name = 'R4_docsetup'

Module.modal = new Modal();
moduleStart();