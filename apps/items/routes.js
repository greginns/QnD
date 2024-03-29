const root = process.cwd();

const {Router, RouterMessage, Routes} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {VIEW, UPDATE, DELETE, ACCESS} = require(root + '/lib/server/utils/authorization.js');
const loginServices = require(root + '/apps/login/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const app = getAppName(__dirname);
const version = 'v1';

const models = require(root + `/apps/${app}/models.js`);
const services = require(root + `/apps/${app}/services.js`);

// Page route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'modules',
  version,
  path: ['/itempage', '/itempage/:etc', '/itempage/:etc/:etc', '/itempage/:etc/:etc/:etc', '/itempage/:etc/:etc/:etc/:etc', '/itempage/:etc/:etc/:etc/:etc/:etc'], 
  rewrite: true,
  id: 'items',
  level: ACCESS,
  desc: 'Item Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.main(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
      {basic: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'modules',
  version,
  path: ['/test'], 
  rewrite: true,
  id: 'test',
  level: ACCESS,
  desc: 'Test Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.test(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
      {basic: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
    ],
  }
}));

// Query route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'document',
  version,
  path: ['/query'], 
  rewrite: true,
  id: 'itemQuery',
  level: ACCESS,
  desc: 'Item Query',
  inAPI: false,
  fn: async function(req) {
    let {query, values} = urlQueryParse(req.query);
    let database = req.session.data.database;
    let pgschema = req.session.data.pgschema;
    let user = req.session.user;

    let tm = await services.query({database, pgschema, user, query, values});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: true}},
    ],
  }
}));

// Model Routes
new Routes({app, subapp: 'activity', version, allowCORS: true, model: models.Activity, services: services.activity});
new Routes({app, subapp: 'lodging', version, allowCORS: true, model: models.Lodging, services: services.lodging});
new Routes({app, subapp: 'meals', version, allowCORS: true, model: models.Meals, services: services.meals});

new Routes({app, subapp: 'actdaily', version, allowCORS: true, model: models.Actdaily, services: services.actdaily});
new Routes({app, subapp: 'actrates', version, allowCORS: true, model: models.Actrates, services: services.actrates});
new Routes({app, subapp: 'actprices', version, allowCORS: true, model: models.Actprices, services: services.actprices});
new Routes({app, subapp: 'actminp', version, allowCORS: true, model: models.Actminp, services: services.actminp});
new Routes({app, subapp: 'actsched', version, allowCORS: true, model: models.Actsched, services: services.actsched});
new Routes({app, subapp: 'actphoto', version, allowCORS: true, model: models.Actphoto, services: services.actphoto});
new Routes({app, subapp: 'actinclm', version, allowCORS: true, model: models.Actinclm, services: services.actinclm});
new Routes({app, subapp: 'actreseller', version, allowCORS: true, model: models.Actreseller, services: services.actreseller});
new Routes({app, subapp: 'actgroup', version, allowCORS: true, model: models.Actgroup, services: services.actgroup});
new Routes({app, subapp: 'actres', version, allowCORS: true, model: models.Actres, services: services.actres});
new Routes({app, subapp: 'actttot', version, allowCORS: true, model: models.Actttot, services: services.actttot});

new Routes({app, subapp: 'lodgunit', version, allowCORS: true, model: models.Lodgunit, services: services.lodgunit});
new Routes({app, subapp: 'lodgrates', version, allowCORS: true, model: models.Lodgrates, services: services.lodgrates});
new Routes({app, subapp: 'lodgprices', version, allowCORS: true, model: models.Lodgprices, services: services.lodgprices});
new Routes({app, subapp: 'lodgminp', version, allowCORS: true, model: models.Lodgminp, services: services.lodgminp});
new Routes({app, subapp: 'lodgsched', version, allowCORS: true, model: models.Lodgsched, services: services.lodgsched});
new Routes({app, subapp: 'lodgphoto', version, allowCORS: true, model: models.Lodgphoto, services: services.lodgphoto});
new Routes({app, subapp: 'lodginclm', version, allowCORS: true, model: models.Lodginclm, services: services.lodginclm});
new Routes({app, subapp: 'lodgreseller', version, allowCORS: true, model: models.Lodgreseller, services: services.lodgreseller});
new Routes({app, subapp: 'lodglocn', version, allowCORS: true, model: models.Lodglocn, services: services.lodglocn});
new Routes({app, subapp: 'lodgtype', version, allowCORS: true, model: models.Lodgtype, services: services.lodgtype});

new Routes({app, subapp: 'mealrates', version, allowCORS: true, model: models.Mealrates, services: services.mealrates});
new Routes({app, subapp: 'mealprices', version, allowCORS: true, model: models.Mealprices, services: services.mealprices});
new Routes({app, subapp: 'mealminp', version, allowCORS: true, model: models.Mealminp, services: services.mealminp});
new Routes({app, subapp: 'mealsched', version, allowCORS: true, model: models.Mealsched, services: services.mealsched});
new Routes({app, subapp: 'mealphoto', version, allowCORS: true, model: models.Mealphoto, services: services.mealphoto});
new Routes({app, subapp: 'mealreseller', version, allowCORS: true, model: models.Mealreseller, services: services.mealreseller});
new Routes({app, subapp: 'meallocn', version, allowCORS: true, model: models.Meallocn, services: services.meallocn});
new Routes({app, subapp: 'mealtype', version, allowCORS: true, model: models.Mealtype, services: services.mealtype});

new Routes({app, subapp: 'area', version, allowCORS: true, model: models.Area, services: services.area});
new Routes({app, subapp: 'glcode', version, allowCORS: true, model: models.Glcode, services: services.glcode});
new Routes({app, subapp: 'tax', version, allowCORS: true, model: models.Tax, services: services.tax});
new Routes({app, subapp: 'waiver', version, allowCORS: true, model: models.Waiver, services: services.waiver});
new Routes({app, subapp: 'template', version, allowCORS: true, model: models.Template, services: services.template});
new Routes({app, subapp: 'supplier', version, allowCORS: true, model: models.Supplier, services: services.supplier});
new Routes({app, subapp: 'reseller', version, allowCORS: true, model: models.Reseller, services: services.reseller});
new Routes({app, subapp: 'pricelevel', version, allowCORS: true, model: models.Pricelevel, services: services.pricelevel});
new Routes({app, subapp: 'pmtterms', version, allowCORS: true, model: models.Pmtterms, services: services.pmtterms});

//strategy rtns
Authentication.add(app, 'session', async function(req, security, strategy) {
  let tm = await loginServices.auth.session(req, security, strategy);

  return tm.toResponse();    
})

Authentication.add(app, 'basic', async function(req, security, strategy) {
  let tm = await loginServices.auth.basic(req, security, strategy);

  return tm.toResponse();    
})

Authentication.add(app, 'ws', async function(req, security, strategy) {
  let tm = await loginServices.auth.ws(req, security, strategy);

  return tm.toResponse();    
})