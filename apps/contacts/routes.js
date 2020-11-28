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
  path: ['/contactpage', '/contactpage/:etc', '/contactpage/:etc/:etc', '/contactpage/:etc/:etc/:etc'], 
  rewrite: true,
  id: 'contacts',
  level: ACCESS,
  desc: 'Contact Page',
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
  subapp: 'contact',
  version,
  path: ['/query'], 
  rewrite: true,
  id: 'contactsQuery',
  level: ACCESS,
  desc: 'Contact Query',
  inAPI: false,
  fn: async function(req) {
    let {query, values} = urlQueryParse(req.query);
    let tm = await services.query({pgschema: req.TID, query, values});

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
new Routes({app, subapp: 'config', version, model: models.Config, services});
new Routes({app, subapp: 'contact', version, model: models.Contact, services});
new Routes({app, subapp: 'country', version, model: models.Country, services});
new Routes({app, subapp: 'egroup', version, model: models.Egroup, services});
new Routes({app, subapp: 'group', version, model: models.Group, services});
new Routes({app, subapp: 'postcode', version, model: models.Postcode, services});
new Routes({app, subapp: 'region', version, model: models.Region, services});
new Routes({app, subapp: 'tag', version, model: models.Tag, services});
new Routes({app, subapp: 'tagcat', version, model: models.Tagcat, services});
new Routes({app, subapp: 'title', version, model: models.Title, services});

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