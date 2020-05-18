const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');

const services = require(root + '/apps/contacts/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const version = 'v1';

// Contact
Router.add(new RouterMessage({
  method: 'get',
  app,
  version,
  path: '/contact', 
  desc: 'Return one or more Contacts',
  resp: {type: 'json', desc: 'Array of Contacts', schema: 'Contacts'},
  fn: async function(req) {
    let tm = await services.contact.getAll({pgschema: req.TID, query: req.query});
      
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
  version,
  path: '/contact/:id', 
  desc: 'Return one Contact',
  resp: {type: 'json', desc: 'One Contact', schema: 'Contact'},
  fn: async function(req) {
    let tm = await services.contact.getOne({pgschema: req.TID, rec: { id: req.params.id }});

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
  version,
  path: '/contact', 
  desc: 'Create a Contact',
  resp: {type: 'json', desc: 'One Contact', schema: 'Contact'},
  fn: async function(req) {
    let tm = await services.contact.create({pgschema: req.TID, rec: req.body.contact});

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
  version,
  path: '/contact/:id', 
  desc: 'Update a Contact',
  resp: {type: 'json', desc: 'One Contact', schema: 'Contact'},
  fn: async function(req) {
    let tm = await services.contact.update({pgschema: req.TID, id: req.params.id, rec: req.body.contact});

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
  version,
  path: '/contact/:id', 
  desc: 'Delete a Contact',
  resp: {type: 'json', desc: 'One Contact', schema: 'Contact'},
  fn: async function(req) {
    let tm = await services.contact.delete({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));