// main
import {QnD} from '/static/apps/static/js/qnd.js';
import {WSDataComm} from '/static/apps/static/js/data.js';
import {Pages} from '/static/apps/static/js/router.js';

import '/static/apps/test/views/js/bindings.js';
import '/static/apps/test/views/js/filters.js';
import '/static/apps/test/views/js/interfaces.js';
import '/static/apps/test/views/js/data.js';

import '/static/client/mvc-addons/js/modals.js';
import '/static/client/mvc-addons/js/mtime.js';
import '/static/client/mvc-addons/js/mdate.js';
import '/static/client/mvc-addons/js/multisel.js';
import '/static/client/mvc-addons/js/singlesel.js';

let init = async function() {
  let testdata = new WSDataComm('test');
  testdata.addURL('/test/testdata');
  testdata.start();

  var pages = new Pages({root: '/test', pages: QnD.pages});

  try {
    await pages.init('bindings');
  }
  catch(e) {
    console.log('FAILURE TO LAUNCH');
    console.log(e)
  }
}

init();