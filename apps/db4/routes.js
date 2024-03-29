const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {OPEN, ACCESS, VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const app = getAppName(__dirname);
const version = 'v1';

//const models = require(root + `/apps/${app}/models.js`);
const {services} = require(root + `/apps/db4/services.js`);

const getDBAndSchema = function(req) {
  let database = req.session.data.database;
  let pgschema = req.session.data.pgschema;

  return {database, pgschema};
  //return {database: 'db4_73WakrfVbNJBaAmhQtEeDv'};
}

// LOGIN/OUT ROUTES
// Stand-alone login page
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'login',
  version,
  path: ['/'], 
  rewrite: false,
  id: 'loginpage',
  level: OPEN,
  desc: 'Login Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.login(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

// test if logged in
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'login',
  version,
  path: ['/test'], 
  rewrite: false,
  id: 'loginpage',
  level: OPEN,
  allowCORS: true,
  desc: 'Login Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.login(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

// login attempt
Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp: 'login',
  version,
  path: '/', 
  id: 'login',
  level: OPEN,
  allowCORS: true,
  fn: async function(req) {
    var tm = await services.admin.login(req);

    return tm.toResponse();
  },
  security: {
    strategies: []
  }
}));

// logout
Router.add(new RouterMessage({
  method: 'delete',
  app,
  subapp: 'login',
  version,
  path: '/', 
  id: 'logout',
  level: OPEN,
  allowCORS: true,
  fn: async function(req) {
    var tm = await services.admin.logout(req);
  
    return tm.toResponse();
  },
  security: {
    strategies: []
  }
}));

// Get db4.js
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/db4'], 
  rewrite: false,
  id: 'db4',
  level: OPEN,
  desc: 'API Code',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.getdb4(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

// Get code bundle
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/bundle/:bundle'], 
  rewrite: false,
  id: 'bundle',
  level: OPEN,
  desc: 'Get Code Bundle',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.getBundle(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

// Get rdtest.html
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/rdtest'], 
  rewrite: false,
  id: 'api',
  level: OPEN,
  desc: 'API Code',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.getrdtest(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

// Generic Table Handling Routes
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/:table/:pk'], 
  rewrite: false,
  id: 'getone',
  level: OPEN,
  desc: 'Get one record',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database} = getDBAndSchema(req);
    let {columns} = urlQueryParse(req.query);
    let tm = await services.table.getOne(database, req.params.table, req.params.pk, columns, req.viaDB4API);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {api: {allowAnon: false, needCSRF: false}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/:table/many', '/:table'], 
  rewrite: false,
  id: 'getmany',
  level: OPEN,
  desc: 'Get many records',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database} = getDBAndSchema(req);
    let {filters, columns} = urlQueryParse(req.query);

    let tm = await services.table.getMany(database, req.params.table, filters, columns, req.viaDB4API);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {api: {allowAnon: false, needCSRF: false}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp: 'api',
  version,
  path: ['/:table'], 
  rewrite: false,
  id: 'insert',
  level: OPEN,
  desc: 'Insert record',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database} = getDBAndSchema(req);
    let tm = await services.table.insert(database, req.params.table, req.body, req.viaDB4API);
    
    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {api: {allowAnon: false, needCSRF: false}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'put',
  app,
  subapp: 'api',
  version,
  path: ['/:table/:pk'], 
  rewrite: false,
  id: 'update',
  level: OPEN,
  desc: 'Update record',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database} = getDBAndSchema(req);
    let tm = await services.table.update(database, req.params.table, req.body, req.viaDB4API);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {api: {allowAnon: false, needCSRF: false}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  subapp: 'api',
  version,
  path: ['/:table'], 
  rewrite: false,
  id: 'delete',
  level: OPEN,
  desc: 'Delete record',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database} = getDBAndSchema(req);
    let tm = await services.table.delete(database, req.params.table, req.body, req.viaDB4API);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {api: {allowAnon: false, needCSRF: false}},
    ],
  }
}));

// QUERY ROUTES
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/query/:qid'], 
  rewrite: false,
  id: 'query',
  level: OPEN,
  desc: 'Run Query',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database} = getDBAndSchema(req);
    //let {filters, columns} = urlQueryParse(req.query);

    let tm = await services.table.query(database, req.params.qid, req.query, req.viaDB4API);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {api: {allowAnon: false, needCSRF: false}},
    ],
  }
}));

// PROCESS ROUTES
Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp: 'api',
  version,
  path: ['/process/:pid'], 
  rewrite: false,
  id: 'process',
  level: OPEN,
  desc: 'Run Process',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database} = getDBAndSchema(req);

    let tm = await services.process.execute(req, database, req.viaDB4API);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {api: {allowAnon: false, needCSRF: false}},
    ],
  }
}));

//strategy rtns
Authentication.add(app, 'session', async function(req, security, strategy) {
  let tm = await services.auth.session(req, security, strategy);

  return tm.toResponse();    
});

Authentication.add(app, 'api', async function(req, security, strategy) {
  let tm = await services.auth.api(req, security, strategy);

  return tm.toResponse();    
});

Authentication.add(app, 'ws', async function(req, security, strategy) {
  let tm = await services.auth.ws(req, security, strategy);

  return tm.toResponse();    
})