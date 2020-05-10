const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const services = require(root + '/apps/zapi/services.js');
const app = 'zapi';

// Zapstat
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/zapstat', 
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
  path: '/zapstat/:id', 
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
  path: '/zapstat', 
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
  path: '/zapstat/:id', 
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
  path: '/zapstat/:id', 
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