const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');

const services = require(root + '/apps/contacts/services.js');
const app = 'contacts';

// Contact
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/contact', 
  fn: async function(req) {
    let tm = await services.contact.getAll({pgschema: req.TID, params: req.params});
  
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
  path: '/contact/:id', 
  fn: async function(req) {
    var tm = await services.contact.getOne({pgschema: req.TID, rec: { id: req.params.id }});
  
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
  method: 'post',
  app,
  path: '/contact', 
  fn: async function(req) {
    var tm = await services.contact.create({pgschema: req.TID, rec: req.body.contact});

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
  method: 'put',
  app,
  path: '/contact/:id', 
  fn: async function(req) {
    var tm = await services.contact.update({pgschema: req.TID, id: req.params.id, rec: req.body.contact});

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
  method: 'delete',
  app,
  path: '/contact/:id', 
  fn: async function(req) {
    var tm = await services.contact.delete({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));