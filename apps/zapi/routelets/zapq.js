const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const services = require(root + '/apps/zapi/services.js');
const app = 'zapi';

// Zapq
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/zapq', 
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
  path: '/zapq/:id', 
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
  path: '/zapq', 
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
  path: '/zapq/:id', 
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
  path: '/zapq/:id', 
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