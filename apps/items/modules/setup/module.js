// main
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/data.js';
import {Pages} from '/~static/lib/client/core/paging.js';
import {Modal} from '/~static/lib/client/widgets/modal.js';
import {MDateModal} from '/~static/lib/client/widgets/mdate.js';

// js for pages
import '/~static/apps/items/modules/setup/start.js';

// Activities
import '/~static/apps/items/modules/setup/activity.js';
import '/~static/apps/items/modules/setup/activity-daily.js';
import '/~static/apps/items/modules/setup/activity-rates.js';
import '/~static/apps/items/modules/setup/activity-rate.js';
import '/~static/apps/items/modules/setup/activity-prices.js';
import '/~static/apps/items/modules/setup/activity-minppl.js';
import '/~static/apps/items/modules/setup/activity-sched.js';
import '/~static/apps/items/modules/setup/activity-photo.js';
import '/~static/apps/items/modules/setup/activity-included.js';
import '/~static/apps/items/modules/setup/activity-resellers.js';

import '/~static/apps/items/modules/setup/actgroup.js';
import '/~static/apps/items/modules/setup/actres.js';
import '/~static/apps/items/modules/setup/actttot.js';

// Lodging
import '/~static/apps/items/modules/setup/lodging.js';
import '/~static/apps/items/modules/setup/lodging-units.js';
import '/~static/apps/items/modules/setup/lodging-rates.js';
import '/~static/apps/items/modules/setup/lodging-rate.js';
import '/~static/apps/items/modules/setup/lodging-prices.js';
import '/~static/apps/items/modules/setup/lodging-minppl.js';
import '/~static/apps/items/modules/setup/lodging-sched.js';
import '/~static/apps/items/modules/setup/lodging-photo.js';
import '/~static/apps/items/modules/setup/lodging-included.js';
import '/~static/apps/items/modules/setup/lodging-resellers.js';

import '/~static/apps/items/modules/setup/lodglocn.js';
import '/~static/apps/items/modules/setup/lodgtype.js';

// Meals
import '/~static/apps/items/modules/setup/meals.js';
import '/~static/apps/items/modules/setup/meals-rates.js';
import '/~static/apps/items/modules/setup/meals-rate.js';
import '/~static/apps/items/modules/setup/meals-prices.js';
import '/~static/apps/items/modules/setup/meals-minppl.js';
import '/~static/apps/items/modules/setup/meals-sched.js';
import '/~static/apps/items/modules/setup/meals-photo.js';
import '/~static/apps/items/modules/setup/meals-resellers.js';

import '/~static/apps/items/modules/setup/meallocn.js';
import '/~static/apps/items/modules/setup/mealtype.js';

// General
import '/~static/apps/items/modules/setup/area.js';
import '/~static/apps/items/modules/setup/glcode.js';
import '/~static/apps/items/modules/setup/tax.js';
import '/~static/apps/items/modules/setup/waiver.js';
import '/~static/apps/items/modules/setup/template.js';
import '/~static/apps/items/modules/setup/supplier.js';
import '/~static/apps/items/modules/setup/reseller.js';
import '/~static/apps/items/modules/setup/pricelevel.js';
import '/~static/apps/items/modules/setup/pmtterms.js';

// Utilities
import '/~static/apps/items/modules/setup/util-print.js';
import '/~static/apps/items/modules/setup/util-import.js';

let moduleStart = function() {
  let connectToData = async function() {
    // setup data table access
    // gets us access to raw data.
    Module.data.activity = new TableAccess({modelName: 'activity', url: `/items/v1/activity`});
    Module.data.actdaily = new TableAccess({modelName: 'actdaily', url: `/items/v1/actdaily`});
    Module.data.actrates = new TableAccess({modelName: 'actrates', url: `/items/v1/actrates`});
    Module.data.actprices = new TableAccess({modelName: 'actprices', url: `/items/v1/actprices`});
    Module.data.actminp = new TableAccess({modelName: 'actminp', url: `/items/v1/actminp`});
    Module.data.actsched = new TableAccess({modelName: 'actsched', url: `/items/v1/actsched`});
    Module.data.actphoto = new TableAccess({modelName: 'actphoto', url: `/items/v1/actphoto`});
    Module.data.actinclm = new TableAccess({modelName: 'actinclm', url: `/items/v1/actinclm`});
    Module.data.actreseller = new TableAccess({modelName: 'actreseller', url: `/items/v1/actreseller`});
    Module.data.actgroup = new TableAccess({modelName: 'actgroup', url: `/items/v1/actgroup`});
    Module.data.actres = new TableAccess({modelName: 'actres', url: `/items/v1/actres`});
    Module.data.actttot = new TableAccess({modelName: 'actttot', url: `/items/v1/actttot`});

    Module.data.lodging = new TableAccess({modelName: 'lodging', url: `/items/v1/lodging`});
    Module.data.lodgunit = new TableAccess({modelName: 'lodgunit', url: `/items/v1/lodgunit`});
    Module.data.lodgrates = new TableAccess({modelName: 'lodgrates', url: `/items/v1/lodgrates`});
    Module.data.lodgprices = new TableAccess({modelName: 'lodgprices', url: `/items/v1/lodgprices`});
    Module.data.lodgminp = new TableAccess({modelName: 'lodgminp', url: `/items/v1/lodgminp`});
    Module.data.lodgsched = new TableAccess({modelName: 'lodgsched', url: `/items/v1/lodgsched`});
    Module.data.lodgphoto = new TableAccess({modelName: 'lodgphoto', url: `/items/v1/lodgphoto`});
    Module.data.lodginclm = new TableAccess({modelName: 'lodginclm', url: `/items/v1/lodginclm`});
    Module.data.lodgreseller = new TableAccess({modelName: 'lodgreseller', url: `/items/v1/lodgreseller`});
    Module.data.lodglocn = new TableAccess({modelName: 'lodglocn', url: `/items/v1/lodglocn`});
    Module.data.lodgtype = new TableAccess({modelName: 'lodgtype', url: `/items/v1/lodgtype`});

    Module.data.meals = new TableAccess({modelName: 'meals', url: `/items/v1/meals`});
    Module.data.mealrates = new TableAccess({modelName: 'mealrates', url: `/items/v1/mealrates`});
    Module.data.mealprices = new TableAccess({modelName: 'mealprices', url: `/items/v1/mealprices`});
    Module.data.mealminp = new TableAccess({modelName: 'mealminp', url: `/items/v1/mealminp`});
    Module.data.mealsched = new TableAccess({modelName: 'mealsched', url: `/items/v1/mealsched`});
    Module.data.mealphoto = new TableAccess({modelName: 'mealphoto', url: `/items/v1/mealphoto`});
    Module.data.mealreseller = new TableAccess({modelName: 'mealreseller', url: `/items/v1/mealreseller`});
    Module.data.meallocn = new TableAccess({modelName: 'meallocn', url: `/items/v1/meallocn`});
    Module.data.mealtype = new TableAccess({modelName: 'mealtype', url: `/items/v1/mealtype`});

    Module.data.area = new TableAccess({modelName: 'area', url: `/items/v1/area`});
    Module.data.glcode = new TableAccess({modelName: 'glcode', url: `/items/v1/glcode`});
    Module.data.tax = new TableAccess({modelName: 'tax', url: `/items/v1/tax`});
    Module.data.waiver = new TableAccess({modelName: 'waiver', url: `/items/v1/waiver`});
    Module.data.template = new TableAccess({modelName: 'template', url: `/items/v1/template`});
    Module.data.supplier = new TableAccess({modelName: 'supplier', url: `/items/v1/supplier`});
    Module.data.reseller = new TableAccess({modelName: 'reseller', url: `/items/v1/reseller`});
    Module.data.pricelevel = new TableAccess({modelName: 'pricelevel', url: `/items/v1/pricelevel`});
    Module.data.pmtterms = new TableAccess({modelName: 'pmtterms', url: `/items/v1/pmtterms`});

    Module.data.company = new TableAccess({modelName: 'company', url: `/contacts/v1/company`});    
    
    const itemData = new WSDataComm('items');                 // WS instances for items
    const contactData = new WSDataComm('contacts');                 // WS instances for contacts
    const safemode = false;
    let model, dataPromises = [];

    // Activity
    model = `/items/activity`;                      // url-like of interest to follow model changes

    itemData.addModel(model);                      // WS data change notifications.  
                                                      // Store model name to watch/follow.  
                                                      // One WSDataComm instance per app.
                                                      // First path segment must be the same as app

    Module.tableStores.activity = new TableStore({accessor: Module.data.activity, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.activity.getAll());               // seed the table store

    // Actdaily
    model = `/items/actdaily`;

    itemData.addModel(model);                          

    Module.tableStores.actdaily = new TableStore({accessor: Module.data.actdaily, model, safemode});  // setup a table store in Module so all pages can access

    // Actrates
    model = `/items/actrates`;

    itemData.addModel(model);                          

    Module.tableStores.actrates = new TableStore({accessor: Module.data.actrates, model, safemode});  // setup a table store in Module so all pages can access

    // Actprices
    model = `/items/actprices`;

    itemData.addModel(model);                          

    Module.tableStores.actprices = new TableStore({accessor: Module.data.actprices, model, safemode});  // setup a table store in Module so all pages can access

    // Actminp
    model = `/items/actminp`;

    itemData.addModel(model);                          

    Module.tableStores.actminp = new TableStore({accessor: Module.data.actminp, model, safemode});  // setup a table store in Module so all pages can access

    // Actsched
    model = `/items/actsched`;

    itemData.addModel(model);                          

    Module.tableStores.actsched = new TableStore({accessor: Module.data.actsched, model, safemode});  // setup a table store in Module so all pages can access

    // Actphoto
    model = `/items/actphoto`;

    itemData.addModel(model);                          

    Module.tableStores.actphoto = new TableStore({accessor: Module.data.actphoto, model, safemode});  // setup a table store in Module so all pages can access

    // Actinclm
    model = `/items/actinclm`;

    itemData.addModel(model);                          

    Module.tableStores.actinclm = new TableStore({accessor: Module.data.actinclm, model, safemode});  // setup a table store in Module so all pages can access

    // Actreseller
    model = `/items/actreseller`;

    itemData.addModel(model);                          

    Module.tableStores.actreseller = new TableStore({accessor: Module.data.actreseller, model, safemode});  // setup a table store in Module so all pages can access

    // Actgroup
    model = `/items/actgroup`;               

    itemData.addModel(model);                          

    Module.tableStores.actgroup = new TableStore({accessor: Module.data.actgroup, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.actgroup.getAll());

    // Actres
    model = `/items/actres`;

    itemData.addModel(model);                          

    Module.tableStores.actres = new TableStore({accessor: Module.data.actres, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.actres.getAll());

    // Actttot
    model = `/items/actttot`;               

    itemData.addModel(model);                          

    Module.tableStores.actttot = new TableStore({accessor: Module.data.actttot, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.actttot.getAll());        

    // Lodging
    model = `/items/lodging`;               

    itemData.addModel(model);                          

    Module.tableStores.lodging = new TableStore({accessor: Module.data.lodging, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.lodging.getAll());

    // Lodgunit
    model = `/items/lodgunit`;

    itemData.addModel(model);                          

    Module.tableStores.lodgunit = new TableStore({accessor: Module.data.lodgunit, model, safemode});  // setup a table store in Module so all pages can access
    
    // Lodgrates
    model = `/items/lodgrates`;

    itemData.addModel(model);                          

    Module.tableStores.lodgrates = new TableStore({accessor: Module.data.lodgrates, model, safemode});  // setup a table store in Module so all pages can access

    // Lodgprices
    model = `/items/lodgprices`;

    itemData.addModel(model);                          

    Module.tableStores.lodgprices = new TableStore({accessor: Module.data.lodgprices, model, safemode});  // setup a table store in Module so all pages can access

    // Lodgminp
    model = `/items/lodgminp`;

    itemData.addModel(model);                          

    Module.tableStores.lodgminp = new TableStore({accessor: Module.data.lodgminp, model, safemode});  // setup a table store in Module so all pages can access

    // Lodgsched
    model = `/items/lodgsched`;

    itemData.addModel(model);                          

    Module.tableStores.lodgsched = new TableStore({accessor: Module.data.lodgsched, model, safemode});  // setup a table store in Module so all pages can access

    // Lodgphoto
    model = `/items/lodgphoto`;

    itemData.addModel(model);                          

    Module.tableStores.lodgphoto = new TableStore({accessor: Module.data.lodgphoto, model, safemode});  // setup a table store in Module so all pages can access

    // Lodginclm
    model = `/items/lodginclm`;

    itemData.addModel(model);                          

    Module.tableStores.lodginclm = new TableStore({accessor: Module.data.lodginclm, model, safemode});  // setup a table store in Module so all pages can access

    // Lodgreseller
    model = `/items/lodgreseller`;

    itemData.addModel(model);                          

    Module.tableStores.lodgreseller = new TableStore({accessor: Module.data.lodgreseller, model, safemode});  // setup a table store in Module so all pages can access

    // Lodglocn
    model = `/items/lodglocn`;               

    itemData.addModel(model);                          

    Module.tableStores.lodglocn = new TableStore({accessor: Module.data.lodglocn, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.lodglocn.getAll());

    // Lodgtype
    model = `/items/lodgtype`;

    itemData.addModel(model);                          

    Module.tableStores.lodgtype = new TableStore({accessor: Module.data.lodgtype, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.lodgtype.getAll());

    // Meals
    model = `/items/meals`;                      

    itemData.addModel(model);                    
                                                      
    Module.tableStores.meals = new TableStore({accessor: Module.data.meals, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.meals.getAll());               // seed the table store

    // Mealrates
    model = `/items/mealrates`;

    itemData.addModel(model);                          

    Module.tableStores.mealrates = new TableStore({accessor: Module.data.mealrates, model, safemode});  // setup a table store in Module so all pages can access

    // Mealprices
    model = `/items/mealprices`;

    itemData.addModel(model);                          

    Module.tableStores.mealprices = new TableStore({accessor: Module.data.mealprices, model, safemode});  // setup a table store in Module so all pages can access

    // Mealminp
    model = `/items/mealminp`;

    itemData.addModel(model);                          

    Module.tableStores.mealminp = new TableStore({accessor: Module.data.mealminp, model, safemode});  // setup a table store in Module so all pages can access

    // Mealsched
    model = `/items/mealsched`;

    itemData.addModel(model);                          

    Module.tableStores.mealsched = new TableStore({accessor: Module.data.mealsched, model, safemode});  // setup a table store in Module so all pages can access
    
    // Mealphoto
    model = `/items/mealphoto`;

    itemData.addModel(model);                          

    Module.tableStores.mealphoto = new TableStore({accessor: Module.data.mealphoto, model, safemode});  // setup a table store in Module so all pages can access

    // Mealreseller
    model = `/items/mealreseller`;

    itemData.addModel(model);                          

    Module.tableStores.mealreseller = new TableStore({accessor: Module.data.mealreseller, model, safemode});  // setup a table store in Module so all pages can access

    // Meallocn
    model = `/items/meallocn`;               

    itemData.addModel(model);                          

    Module.tableStores.meallocn = new TableStore({accessor: Module.data.meallocn, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.meallocn.getAll());

    // Mealtype
    model = `/items/mealtype`;

    itemData.addModel(model);                          

    Module.tableStores.mealtype = new TableStore({accessor: Module.data.mealtype, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.mealtype.getAll());

    //GENERAL

    // Area
    model = `/items/area`;

    itemData.addModel(model);                          

    Module.tableStores.area = new TableStore({accessor: Module.data.area, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.area.getAll());

    // Glcode
    model = `/items/glcode`;

    itemData.addModel(model);                          

    Module.tableStores.glcode = new TableStore({accessor: Module.data.glcode, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.glcode.getAll());    

    // Tax
    model = `/items/tax`;

    itemData.addModel(model);                          

    Module.tableStores.tax = new TableStore({accessor: Module.data.tax, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.tax.getMany({filters: {active: true}}));

    // Waiver
    model = `/items/waiver`;

    itemData.addModel(model);                          

    Module.tableStores.waiver = new TableStore({accessor: Module.data.waiver, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.waiver.getAll());    

    // Template
    model = `/items/template`;

    itemData.addModel(model);                          

    Module.tableStores.template = new TableStore({accessor: Module.data.template, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.template.getAll());    

    // Supplier
    model = `/items/supplier`;

    itemData.addModel(model);                          

    Module.tableStores.supplier = new TableStore({accessor: Module.data.supplier, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.supplier.getAll());    

    // Reseller
    model = `/items/reseller`;

    itemData.addModel(model);                          

    Module.tableStores.reseller = new TableStore({accessor: Module.data.reseller, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.reseller.getAll());    

    // Price level
    model = `/items/pricelevel`;

    itemData.addModel(model);                          

    Module.tableStores.pricelevel = new TableStore({accessor: Module.data.pricelevel, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.pricelevel.getAll());    

    // Pmt terms
    model = `/items/pmtterms`;

    itemData.addModel(model);                          

    Module.tableStores.pmtterms = new TableStore({accessor: Module.data.pmtterms, model, safemode});  // setup a table store in Module so all pages can access    
    dataPromises.push(Module.tableStores.pmtterms.getAll());        

    // company table ---
    model = `/contacts/company`;

    contactData.addModel(model);                          

    Module.tableStores.company = new TableStore({accessor: Module.data.company, model, safemode});  // setup a table store in Module so all pages can access
    dataPromises.push(Module.tableStores.company.getAll());

    
    // start following via WS ---
    itemData.start();
    contactData.start();

    // fill up on data
    Promise.all(dataPromises)
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
    const module = location.pathname.split('/')[1];  
    const startPage = 'start';

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

window.name = 'R4_itemsetup'

Module.modal = new Modal();
Module.widgets.MDateModal = new MDateModal(document.getElementById('widget-mdate-modal'));
moduleStart();