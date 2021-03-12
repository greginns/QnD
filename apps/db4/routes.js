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
const services = require(root + `/apps/${app}/services.js`);

const getDBAndSchema = function(req) {
  //let database = req.session.data.database;
  //let pgschema = req.session.data.pgschema;

  //return {database, pgschema};
  return {database: 'db4_73WakrfVbNJBaAmhQtEeDv', pgschema: 'Workspace1'};
}

// API Code route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/'], 
  rewrite: false,
  id: 'api',
  level: OPEN,
  desc: 'API Code',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.getapi(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
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
    let {database, pgschema} = getDBAndSchema(req);
    let tm = await services.table.insert(database, pgschema, req.params.table, req.body);
    
    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'patch',
  app,
  subapp: 'api',
  version,
  path: ['/:table'], 
  rewrite: false,
  id: 'update',
  level: OPEN,
  desc: 'Update record',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database, pgschema} = getDBAndSchema(req);
    let tm = await services.table.update(database, pgschema, req.params.table, req.body);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
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
    let {database, pgschema} = getDBAndSchema(req);
    let tm = await services.table.delete(database, pgschema, req.params.table, req.body);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/:table/one', '/:table/:pk'], 
  rewrite: false,
  id: 'getone',
  level: OPEN,
  desc: 'Get one record',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database, pgschema} = getDBAndSchema(req);
    let {filters, columns} = urlQueryParse(req.query);
    let tm = await services.table.getOne(database, pgschema, req.params.table, req.params.pk, filters, columns);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'api',
  version,
  path: ['/:table/many'], 
  rewrite: false,
  id: 'getmany',
  level: OPEN,
  desc: 'Get many records',
  allowCORS: true,
  inAPI: false,
  fn: async function(req) {
    let {database, pgschema} = getDBAndSchema(req);
    let {filters, columns} = urlQueryParse(req.query);

    let tm = await services.table.getMany(database, pgschema, req.params.table, filters, columns);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));