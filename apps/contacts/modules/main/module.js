// main
import {QnD} from '/~static/lib/client/core/qnd.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/router.js';

// js for pages
import '/~static/apps/contacts/modules/main/contact.js';
import '/~static/apps/contacts/modules/main/titles.js';
import '/~static/apps/contacts/modules/main/groups.js';

// js for widgets
import '/~static/lib/client/widgets/js/mtime.js';
import '/~static/lib/client/widgets/js/mdate.js';
import '/~static/lib/client/widgets/js/multisel.js';
import '/~static/lib/client/widgets/js/singlesel.js';

let moduleStart = function() {
  let connectToData = function() {
    // setup data table access
    QnD.data.contact = new TableAccess({modelName: 'contact', url: `/contacts/v1/contact`});
    QnD.data.title = new TableAccess({modelName: 'title', url: `/contacts/v1/title`});
    QnD.data.group = new TableAccess({modelName: 'contact', url: `/contacts/v1/group`});
    QnD.data.country = new TableAccess({modelName: 'country', url: `/contacts/v1/country`});
    QnD.data.region = new TableAccess({modelName: 'region', url: `/contacts/v1/region`});
    QnD.data.postcode = new TableAccess({modelName: 'postcode', url: `/contacts/v1/postcode`});

    const data = new WSDataComm('contacts');                 // WS instances for this app
    const safemode = false;
    let wmodel;

    // Contact table ---
    wmodel = `/contacts/contact`;                   // url-like of interest to follow model changes

    data.addModel(wmodel);                          // WS data change notifications.  Store model name to follow.  First path segment must be the same as app

    // HTTP data access
    QnD.tableStores.contact = new TableStore({accessor:QnD.data.contact , wmodel, safemode});  // setup a table store in QnD so all pages can access
    QnD.tableStores.contact.getAll();               // seed the table store

    // Title table ---
    wmodel = `/contacts/title`;               

    data.addModel(wmodel);                          

    QnD.tableStores.title = new TableStore({accessor: QnD.data.title, wmodel, safemode});  // setup a table store in QnD so all pages can access
    QnD.tableStores.title.getAll();      

    // Group table ---
    wmodel = `/contacts/group`;               

    data.addModel(wmodel);                          

    QnD.tableStores.group = new TableStore({accessor: QnD.data.group, wmodel, safemode});  // setup a table store in QnD so all pages can access
    QnD.tableStores.group.getAll();      

    // Country table ---
    wmodel = `/contacts/country`;               

    data.addModel(wmodel);                          

    QnD.tableStores.country = new TableStore({accessor: QnD.data.country, wmodel, safemode});  // setup a table store in QnD so all pages can access
    QnD.tableStores.country.getAll();      

    // start following via WS ---
    data.start();

    // tell everybody that data is ready
    document.dispatchEvent(new CustomEvent('tablestoreready', {bubbles: false}));  // getElementById('qndPages').
  }

  let startPages = async function() {
    // page URL data  
    const module = location.pathname.split('/')[1];  // 'contactpage'
    const startPage = 'contact';

    // Start up pages.  QnD.pages saved up all page references
    const pages = new Pages({root: `/${module}`, pages: QnD.pages});

    try {
      // fire off init method in each section of each page.
      await pages.ready(startPage);   // default page
    }
    catch(e) {
      console.log('FAILURE TO LAUNCH');
      console.log(e)
    }
  }

  connectToData();
  startPages();
}

moduleStart();