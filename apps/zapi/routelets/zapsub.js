const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const services = require(root + '/apps/zapi/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const version = 'v1';

// Zapsub
Router.add(new RouterMessage({
  method: 'get',
  app,
  version,
  path: '/zapsub', 
  fn: async function(req) {
    let tm = await services.zapsub.getAll({pgschema: req.TID, params: req.query});

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
  version,
  path: '/zapsub/:id', 
  fn: async function(req) {
    let tm = await services.zapsub.getOne({pgschema: req.TID, id: req.params.id});

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
  version,
  path: '/zapsub', 
  fn: async function(req) {
    let tm = await services.zapsub.create({pgschema: req.TID, rec: req.body.zapsub});

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
  version,
  path: '/zapsub/:id', 
  fn: async function(req) {
    let tm = await services.zapsub.update({pgschema: req.TID, id: req.params.id, rec: req.body.zapsub});

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
  version,
  path: '/zapsub/:id', 
  fn: async function(req) {
    let tm = await services.zapsub.delete({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));