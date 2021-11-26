// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {Modal} from '/~static/lib/client/widgets/modal.js';

// js for pages
//import '/~static/apps/contacts/modules/setup/navbar.js';
import '/~static/apps/contacts/modules/setup/setup.js';
import '/~static/apps/contacts/modules/setup/titles.js';
import '/~static/apps/contacts/modules/setup/groups.js';
import '/~static/apps/contacts/modules/setup/egroups.js';
import '/~static/apps/contacts/modules/setup/tagcats.js';
import '/~static/apps/contacts/modules/setup/tags.js';
import '/~static/apps/contacts/modules/setup/notecats.js';

//import '/~static/project/mixins/mvc_ext.js';

let moduleStart = function() {
  let connectToData = async function() {
    // setup data table access
    // gets us access to raw data.
    Module.data.title = new TableAccess({modelName: 'title', url: `/contacts/v1/title`});
    Module.data.group = new TableAccess({modelName: 'group', url: `/contacts/v1/group`});
    Module.data.egroup = new TableAccess({modelName: 'egroup', url: `/contacts/v1/egroup`});
    Module.data.tagcat = new TableAccess({modelName: 'tagcat', url: `/contacts/v1/tagcat`});
    Module.data.tag = new TableAccess({modelName: 'tag', url: `/contacts/v1/tag`});
    Module.data.config = new TableAccess({modelName: 'config', url: `/contacts/v1/config`});
    Module.data.company = new TableAccess({modelName: 'company', url: `/contacts/v1/company`});

    const contactData = new WSDataComm('contacts');                 // WS instances for this app
    const safemode = false;
    let model, getAllPromises = [];

    // Title table ---
    model = `/contacts/title`;               

    contactData.addModel(model);                          

    Module.tableStores.title = new TableStore({accessor: Module.data.title, model, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.title.getAll());

    // Group table ---
    model = `/contacts/group`;               

    contactData.addModel(model);                          

    Module.tableStores.group = new TableStore({accessor: Module.data.group, model, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.group.getAll());

    // Egroup table ---
    model = `/contacts/egroup`;               

    contactData.addModel(model);                          

    Module.tableStores.egroup = new TableStore({accessor: Module.data.egroup, model, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.egroup.getAll());      

    // Tagcat table ---
    model = `/contacts/tagcat`;               

    contactData.addModel(model);                          

    Module.tableStores.tagcat = new TableStore({accessor: Module.data.tagcat, model, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.tagcat.getAll());      

    // Tag table ---
    model = `/contacts/tag`;

    contactData.addModel(model);                          

    Module.tableStores.tag = new TableStore({accessor: Module.data.tag, model, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.tag.getAll());

    // Config table ---
    model = `/contacts/config`;

    contactData.addModel(model);                          

    Module.tableStores.config = new TableStore({accessor: Module.data.config, model, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.config.getAll());

    // company table ---
    model = `/contacts/company`;

    contactData.addModel(model);                          

    Module.tableStores.company = new TableStore({accessor: Module.data.company, model, safemode});  // setup a table store in Module so all pages can access
    getAllPromises.push(Module.tableStores.company.getMany({filters: {active: true}}));

    // start following via WS ---
    contactData.start();

    // fill up on data
    Promise.all(getAllPromises)
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
    const module = location.pathname.split('/')[1];  // 'contactpage'
    const startPage = 'setup';

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

window.name = 'R4_contactsetup'

Module.modal = new Modal();
moduleStart();