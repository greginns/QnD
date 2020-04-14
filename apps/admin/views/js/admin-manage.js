// main
import {QnD} from '/static/apps/static/js/qnd.js';
import {WSDataComm, TableStore} from '/static/apps/static/js/data.js';
import {Pages} from '/static/apps/static/js/router.js';

import '/static/apps/admin/views/js/admin-manage-tenants.js';
import '/static/apps/admin/views/js/admin-manage-users.js';
import '/static/apps/admin/views/js/admin-manage-migrate.js';

import '/static/client/widgets/js/modals.js';
import '/static/client/widgets/js/mtime.js';
import '/static/client/widgets/js/mdate.js';

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

  // Start up pages.  QnD.pages saved up all page references
  let pages = new Pages({root: '/admin/manage', pages: QnD.pages});

  try {
    // fire off init method in each section of each page.
    await pages.init('tenants');   // default page
  }
  catch(e) {
    console.log('FAILURE TO LAUNCH');
    console.log(e)
  }
}

init();