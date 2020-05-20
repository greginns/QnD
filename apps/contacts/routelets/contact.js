const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const { Contact } = require(root + '/apps/contacts/models.js');

const services = require(root + '/apps/contacts/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const subapp = 'contact';
const version = 'v1';

// Contact
Router.add(new RouterMessage({
  method: 'get',
  app,
  version,
  path: '/contact', 
  id: `${app}.${subapp}.getMany`,
  level: VIEW,
  resp: {type: 'json', schema: [Contact]},
  fn: async function(req) {
    let tm = await services.contact.getMany({pgschema: req.TID, query: req.query});
      
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
  id: `${app}.${subapp}.getOne`,
  level: VIEW,
  resp: {type: 'json', schema: Contact},
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
  id: `${app}.${subapp}.create`,
  level: CREATE,
  resp: {type: 'json', schema: Contact},
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
  id: `${app}.${subapp}.update`,
  level: UPDATE,
  resp: {type: 'json', schema: Contact},
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
  id: `${app}.${subapp}.delete`,
  level: DELETE,
  resp: {type: 'json', schema: Contact},
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