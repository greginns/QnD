// main
import {QnD} from '/static/apps/static/js/qnd.js';
import {WSDataComm, TableStore} from '/static/apps/static/js/data.js';
import {Pages} from '/static/apps/static/js/router.js';

import '/static/apps/test/views/js/bindings.js';
import '/static/apps/test/views/js/filters.js';
import '/static/apps/test/views/js/interfaces.js';
import '/static/apps/test/views/js/data.js';

import '/static/client/widgets/js/modals.js';
import '/static/client/widgets/js/mtime.js';
import '/static/client/widgets/js/mdate.js';
import '/static/client/widgets/js/multisel.js';
import '/static/client/widgets/js/singlesel.js';

let init = async function() {
  // setup data access
  let app = 'test';                       // app name
  let url = '/test/testdata';             // url of interest. to access data, follow with WS
  
  // WS data change notifications.
  let testdata = new WSDataComm(app);     // WS instances for this app

  testdata.addURL(url);                   // save url.  first path must be the same as 
  testdata.start();                       // start following via WS

  // HTTP data access
  QnD.tableStores.testdata = new TableStore({url, safemode: false});  // setup a table store in QnD so all pages can access
  QnD.tableStores.testdata.getAll();      // seed the table store

  // Start up pages.  QnD.pages saved up all page references
  let pages = new Pages({root: '/test', pages: QnD.pages});

  try {
    // fire off init method in each section of each page.
    await pages.init('bindings');   // default page
  }
  catch(e) {
    console.log('FAILURE TO LAUNCH');
    console.log(e)
  }
}

init();