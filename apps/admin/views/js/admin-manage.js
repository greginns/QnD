// main
import {QnD} from '/static/v1/static/lib/client/core/qnd.js';
import {WSDataComm, TableStore} from '/static/v1/static/lib/client/core/data.js';
import {Pages} from '/static/v1/static/lib/client/core/router.js';

import '/static/v1/static/apps/admin/views/js/admin-manage-tenants.js';
import '/static/v1/static/apps/admin/views/js/admin-manage-users.js';
import '/static/v1/static/apps/admin/views/js/admin-manage-migrate.js';

import '/static/v1/static/lib/client/widgets/js/modals.js';
import '/static/v1/static/lib/client/widgets/js/mtime.js';
import '/static/v1/static/lib/client/widgets/js/mdate.js';

let init = async function() {
  // setup data access
  let app = 'admin';                       // app name
	let url1 = '/admin/tenant';             // url of interest. to access data, follow with WS
	let url2 = '/admin/user';
  
  // WS data change notifications.
  let data = new WSDataComm(app);     // WS instances for this app

	data.addURL(url1);                   // save url.  first path must be the same as app
	data.addURL(url2);
  data.start();                       // start following via WS

  // HTTP data access
  QnD.tableStores.tenant = new TableStore({url: url1, safemode: false});  // setup a table store in QnD so all pages can access
  QnD.tableStores.tenant.getAll();      // seed the table store
  
	QnD.tableStores.user = new TableStore({url: url2, safemode: false});  // setup a table store in QnD so all pages can access
  QnD.tableStores.user.getAll();      // seed the table store

  // tell everybody that data is ready
  document.getElementById('qndPages').dispatchEvent(new CustomEvent('tablestoreready', {bubbles: false}));

  // Start up router.  QnD.pages saved up all page references
  let pages = new Pages({root: '/admin/manage', pages: QnD.pages});

  try {
    // fire off init method in each section of each page.
    await pages.ready('tenants');   // default page
  }
  catch(e) {
    console.log('FAILURE TO LAUNCH');
    console.log(e)
  }
}

init();