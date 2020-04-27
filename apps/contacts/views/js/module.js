// main
import {QnD} from '/static/lib/client/core/qnd.js';
import {WSDataComm, TableStore} from '/static/lib/client/core/data.js';
import {Pages} from '/static/lib/client/core/router.js';

// js for pages
import '/static/apps/contacts/views/js/main.js';

// js for widgets
import '/static/lib/client/widgets/js/modals.js';
import '/static/lib/client/widgets/js/mtime.js';
import '/static/lib/client/widgets/js/mdate.js';
import '/static/lib/client/widgets/js/multisel.js';
import '/static/lib/client/widgets/js/singlesel.js';

let init = async function() {
  // setup data access
  let app = 'contacts';                       // app name
  let url = `/${app}/contact`;             // url of interest. to access data, follow with WS
  let startPage = 'main';
  
  // WS data change notifications.
  let data = new WSDataComm(app);     // WS instances for this app

  data.addURL(url);                   // save url.  first path must be the same as app
  data.start();                       // start following via WS

  // HTTP data access
  QnD.tableStores.contact = new TableStore({url, safemode: false});  // setup a table store in QnD so all pages can access
  QnD.tableStores.contact.getAll();      // seed the table store

  // tell everybody that data is ready
  document.getElementById('qndPages').dispatchEvent(new CustomEvent('tablestoreready', {bubbles: false}));

  // Start up pages.  QnD.pages saved up all page references
  let pages = new Pages({root: `/${app}`, pages: QnD.pages});

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