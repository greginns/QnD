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
  path: ['/contactpage', '/contactpage/:etc', '/contactpage/:etc/:etc', '/contactpage/:etc/:etc/:etc', '/contactpage/:etc/:etc/:etc/:etc'], 
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

// Page route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'modules',
  version,
  path: ['/contactsetup', '/contactsetup/:etc', '/contactsetup/:etc/:etc', '/contactsetup/:etc/:etc/:etc', '/contactsetup/:etc/:etc/:etc/:etc'], 
  rewrite: true,
  id: 'contactsetup',
  level: ACCESS,
  desc: 'Contact Setup Page',
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
  path: ['/searchpage', '/searchpage/:etc', '/searchpage/:etc/:etc', '/searchpage/:etc/:etc/:etc', '/searchpage/:etc/:etc/:etc/:etc'], 
  rewrite: true,
  id: 'search',
  level: ACCESS,
  desc: 'Search Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.search(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
      {basic: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
    ],
  }
}));

// Query routes
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

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'contact',
  version,
  path: ['/query/:qid'], 
  rewrite: true,
  id: 'contactsQueryNo',
  level: ACCESS,
  desc: 'Contact Stored Query',
  inAPI: false,
  fn: async function(req) {
    let {values} = urlQueryParse(req.query);
    let qid = req.params.qid;
    let database = req.session.data.database;
    let pgschema = req.session.data.pgschema;

    let tm = await services.storedQuery({database, pgschema, qid, values});

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
new Routes({app, subapp: 'associate', version, allowCORS: true, model: models.Associate, services: services.associate});
new Routes({app, subapp: 'company', version, allowCORS: true, model: models.Company, services: services.company});
new Routes({app, subapp: 'currency', version, allowCORS: true, model: models.Currency, services: services.currency});
new Routes({app, subapp: 'config', version, allowCORS: true, model: models.Config, services: services.config});
new Routes({app, subapp: 'contact', version, allowCORS: true, model: models.Contact, services: services.contact});
new Routes({app, subapp: 'country', version, allowCORS: true, model: models.Country, services: services.country});
new Routes({app, subapp: 'emailhist', version, allowCORS: true, model: models.Emailhist, services: services.emailhist});
new Routes({app, subapp: 'egroup', version, allowCORS: true, model: models.Egroup, services: services.egroup});
new Routes({app, subapp: 'group', version, allowCORS: true, model: models.Group, services: services.group});
new Routes({app, subapp: 'postcode', version, allowCORS: true, model: models.Postcode, services: services.postcode});
new Routes({app, subapp: 'region', version, allowCORS: true, model: models.Region, services: services.region});
new Routes({app, subapp: 'tag', version, allowCORS: true, model: models.Tag, services: services.tag});
new Routes({app, subapp: 'tagcat', version, allowCORS: true, model: models.Tagcat, services: services.tagcat});
new Routes({app, subapp: 'title', version, allowCORS: true, model: models.Title, services: services.title});

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