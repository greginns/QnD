// main
import {QnD} from '/static/v1/lib/client/core/qnd.js';
import {WSDataComm, TableStore} from '/static/v1/lib/client/core/data.js';
import {Pages} from '/static/v1/lib/client/core/router.js';

// js for pages
import '/static/v1/apps/contacts/views/js/main.js';

// js for widgets
import '/static/v1/lib/client/widgets/js/mtime.js';
import '/static/v1/lib/client/widgets/js/mdate.js';
import '/static/v1/lib/client/widgets/js/multisel.js';
import '/static/v1/lib/client/widgets/js/singlesel.js';

let init = async function() {
  // setup data access
  let app = 'contacts';                         // app name
  let subapp = 'contact';
  let version = 'v1';
  let model = `/${app}/${version}/${subapp}`;     // url of interest to access data
  let wmodel = `/${app}/${subapp}`;               // url-like of interest to follow model changes
  let modulePage = 'contactpage';
  let startPage = 'main';
  
  // WS data change notifications.
  let data = new WSDataComm(app);       // WS instances for this app

  data.addModel(wmodel);                    // save model.  first path must be the same as app
  data.start();                         // start following via WS

  // HTTP data access
  QnD.tableStores.contact = new TableStore({model, wmodel, safemode: false});  // setup a table store in QnD so all pages can access
  QnD.tableStores.contact.getAll();      // seed the table store

  // tell everybody that data is ready
  document.dispatchEvent(new CustomEvent('tablestoreready', {bubbles: false}));  // getElementById('qndPages').

  // Start up pages.  QnD.pages saved up all page references
  let pages = new Pages({root: `/${modulePage}`, pages: QnD.pages});

  try {
    // fire off init method in each section of each page.
    await pages.ready(startPage);   // default page
  }
  catch(e) {
    console.log('FAILURE TO LAUNCH');
    console.log(e)
  }
}

init();