const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const services = require(root + '/apps/zapi/services.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__filename);
const version = 'v1';

// Zapstat
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '/zapstat', 
  id: 'getMany',
  fn: async function(req) {
    let tm = await services.zapstat.getAll({pgschema: req.TID, query: req.query});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '/zapstat/:id', 
  id: 'getOne',
  fn: async function(req) {
    let tm = await services.zapstat.getOne({pgschema: req.TID, id: req.params.id });
  
    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp,
  version,
  path: '/zapstat', 
  id: 'create',
  fn: async function(req) {
    let tm = await services.zapstat.create({pgschema: req.TID, rec: req.body.zapstat});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'put',
  app,
  subapp,
  version,
  path: '/zapstat/:id', 
  id: 'update',
  fn: async function(req) {
    let tm = await services.zapstat.update({pgschema: req.TID, id: req.params.id, rec: req.body.zapstat});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  subapp,
  version,
  path: '/zapstat/:id', 
  id: 'delete',
  fn: async function(req) {
    let tm = await services.zapstat.delete({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));