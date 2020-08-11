const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const services = require(root + '/apps/zapi/services.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__filename);
const version = 'v1';

// Zapq
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '/zapq', 
  id: 'getMany',
  fn: async function(req) {
    let tm = await services.zapq.getAll({pgschema: req.TID, query: req.query});

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
  path: '/zapq/:id', 
  id: 'getOne',
  fn: async function(req) {
    let tm = await services.zapq.getOne({pgschema: req.TID, id: req.params.id });
  
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
  path: '/zapq', 
  id: 'create',
  fn: async function(req) {
    let tm = await services.zapq.create({pgschema: req.TID, rec: req.body.zapq});

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
  path: '/zapq/:id', 
  id: 'udpate',
  fn: async function(req) {
    let tm = await services.zapq.update({pgschema: req.TID, id: req.params.id, rec: req.body.zapq});

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
  path: '/zapq/:id', 
  id: 'delete',
  fn: async function(req) {
    let tm = await services.zapq.delete({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));