// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';

// js for pages
import '/~static/apps/contacts/modules/main/navbar.js';
import '/~static/apps/contacts/modules/main/contact.js';
import '/~static/apps/contacts/modules/main/contact-search.js';
import '/~static/apps/contacts/modules/main/contact-results.js';
import '/~static/apps/contacts/modules/main/titles.js';
import '/~static/apps/contacts/modules/main/groups.js';
import '/~static/apps/contacts/modules/main/egroups.js';
import '/~static/apps/contacts/modules/main/tagcats.js';
import '/~static/apps/contacts/modules/main/tags.js';
import '/~static/apps/contacts/modules/main/notecats.js';

import '/~static/project/mixins/mvc_ext.js';

let moduleStart = function() {
  let widgetSetup = function() {
  }

  let connectToData = async function() {
    // setup data table access
    Module.data.contact = new TableAccess({modelName: 'contact', url: `/contacts/v1/contact`});
    Module.data.title = new TableAccess({modelName: 'title', url: `/contacts/v1/title`});
    Module.data.group = new TableAccess({modelName: 'group', url: `/contacts/v1/group`});
    Module.data.egroup = new TableAccess({modelName: 'egroup', url: `/contacts/v1/egroup`});
    Module.data.tagcat = new TableAccess({modelName: 'tagcat', url: `/contacts/v1/tagcat`});
    Module.data.tag = new TableAccess({modelName: 'tag', url: `/contacts/v1/tag`});
    Module.data.country = new TableAccess({modelName: 'country', url: `/contacts/v1/country`});
    Module.data.region = new TableAccess({modelName: 'region', url: `/contacts/v1/region`});
    Module.data.postcode = new TableAccess({modelName: 'postcode', url: `/contacts/v1/postcode`});
    Module.data.config = new TableAccess({modelName: 'config', url: `/contacts/v1/config`});

    const data = new WSDataComm('contacts');                 // WS instances for this app
    const safemode = false;
    let wmodel, getAllPromises = [];

    // Contact table ---
    wmodel = `/contacts/contact`;                   // url-like of interest to follow model changes

    data.addModel(wmodel);                          // WS data change notifications.  Store model name to follow.  First path segment must be the same as app

    // HTTP data access
    Module.tableStores.contact = new TableStore({accessor:Module.data.contact , wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.contact.getAll());               // seed the table store

    // Title table ---
    wmodel = `/contacts/title`;               

    data.addModel(wmodel);                          

    Module.tableStores.title = new TableStore({accessor: Module.data.title, wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.title.getAll());

    // Group table ---
    wmodel = `/contacts/group`;               

    data.addModel(wmodel);                          

    Module.tableStores.group = new TableStore({accessor: Module.data.group, wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.group.getAll());

    // Egroup table ---
    wmodel = `/contacts/egroup`;               

    data.addModel(wmodel);                          

    Module.tableStores.egroup = new TableStore({accessor: Module.data.egroup, wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.egroup.getAll());      

    // Tagcat table ---
    wmodel = `/contacts/tagcat`;               

    data.addModel(wmodel);                          

    Module.tableStores.tagcat = new TableStore({accessor: Module.data.tagcat, wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.tagcat.getAll());      

    // Tag table ---
    wmodel = `/contacts/tag`;

    data.addModel(wmodel);                          

    Module.tableStores.tag = new TableStore({accessor: Module.data.tag, wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.tag.getAll());

    // Country table ---
    wmodel = `/contacts/country`;               

    data.addModel(wmodel);                          

    Module.tableStores.country = new TableStore({accessor: Module.data.country, wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.country.getAll());

    // Config table ---
    wmodel = `/contacts/config`;

    data.addModel(wmodel);                          

    Module.tableStores.config = new TableStore({accessor: Module.data.config, wmodel, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.config.getAll());

    // start following via WS ---
    data.start();

    Promise.all(getAllPromises)
    .then(function() {
      // tell everybody that data is ready
      document.dispatchEvent(new CustomEvent('tablestoreready', {bubbles: false}));
    })    
  }

  let startPages = async function() {
    // page URL data  
    const module = location.pathname.split('/')[1];  // 'contactpage'
    const startPage = 'contact/create';

    // Start up pages.  Module.pages saved up all page references
    const pager = new Pages({root: `/${module}`, pages: Module.pages});

    try {
      // fire off init method in each section of each page.
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

  widgetSetup();
  connectToData();
}

moduleStart();