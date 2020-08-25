// main
import {QnD} from '/static/v1/static/lib/client/core/qnd.js';
import {WSDataComm, TableStore} from '/static/v1/static/lib/client/core/data.js';
import {Pages} from '/static/v1/static/lib/client/core/router.js';

// js for pages
import '/static/v1/static/apps/contacts/modules/main/main.js';

// js for widgets
import '/~static/lib/client/widgets/js/mtime.js';
import '/static/v1/static/lib/client/widgets/js/mdate.js';
import '/static/v1/static/lib/client/widgets/js/multisel.js';
import '/static/v1/static/lib/client/widgets/js/singlesel.js';

let moduleStart = function() {
  let connectToData = function() {
    // setup data access
    const app = 'contacts';                           // app name
    const version = 'v1';                             // version
    const subapp = 'contact';                         // subapp (or model)

    const model = `/${app}/${version}/${subapp}`;     // url of interest to access data
    const wmodel = `/${app}/${subapp}`;               // url-like of interest to follow model changes

    // WS data change notifications.
    const data = new WSDataComm(app);                 // WS instances for this app

    data.addModel(wmodel);                            // store model name to follow.  first path must be the same as app
    data.start();                                     // start following via WS

    // HTTP data access
    QnD.tableStores.contact = new TableStore({model, wmodel, safemode: false});  // setup a table store in QnD so all pages can access
    QnD.tableStores.contact.getAll();      // seed the table store

    // tell everybody that data is ready
    document.dispatchEvent(new CustomEvent('tablestoreready', {bubbles: false}));  // getElementById('qndPages').
  }

  let startPages = async function() {
    // page URL data  
    const module = location.pathname.split('/')[1];  // 'contactpage'
    const startPage = 'main';

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