const root = process.cwd();

const {Router, RouterMessage, Routes} = require(root + '/lib/server/utils/router.js');
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
  path: ['/res', '/res/:etc', '/res/:etc/:etc', '/res/:etc/:etc/:etc', '/res/:etc/:etc/:etc/:etc', '/res/:etc/:etc/:etc/:etc/:etc'], 
  rewrite: true,
  id: 'items',
  level: ACCESS,
  desc: 'Main Page',
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
  path: ['/res-setup', '/res-setup/:etc', '/res-setup/:etc/:etc', '/res-setup/:etc/:etc/:etc', '/res-setup/:etc/:etc/:etc/:etc', '/res-setup/:etc/:etc/:etc/:etc/:etc'], 
  rewrite: true,
  id: 'items',
  level: ACCESS,
  desc: 'Item Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.setup(req);

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
  subapp: 'ressetup',
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
new Routes({app, subapp: 'main', version, allowCORS: true, model: models.Main, services: services.main});

new Routes({app, subapp: 'discount', version, allowCORS: true, model: models.Discount, services: services.discount});
new Routes({app, subapp: 'cancreas', version, allowCORS: true, model: models.Cancreas, services: services.cancreas});

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