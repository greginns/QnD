const root = process.cwd();

const {Router, RouterMessage, Routes} = require(root + '/lib/server/utils/router.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {ACCESS} = require(root + '/lib/server/utils/authorization.js');
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

    let tm = await services.query({database, pgschema, query, values});

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

new Routes({app, subapp: 'actgroup', version, allowCORS: true, model: models.Actgroup, services: services.actgroup});
new Routes({app, subapp: 'lodglocn', version, allowCORS: true, model: models.Lodglocn, services: services.lodglocn});
new Routes({app, subapp: 'lodgtype', version, allowCORS: true, model: models.Lodgtype, services: services.lodgtype});

new Routes({app, subapp: 'area', version, allowCORS: true, model: models.area, services: services.area});
new Routes({app, subapp: 'glcode', version, allowCORS: true, model: models.glcode, services: services.glcode});
new Routes({app, subapp: 'tax', version, allowCORS: true, model: models.tax, services: services.tax});
new Routes({app, subapp: 'waiver', version, allowCORS: true, model: models.waiver, services: services.waiver});

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