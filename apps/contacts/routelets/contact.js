const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const { Contact } = require(root + '/apps/contacts/models.js');
const services = require(root + '/apps/contacts/services.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);
const version = 'v1';

// Contact
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '/contact', 
  id: 'getMany',
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
  subapp,
  version,
  path: '/contact/:id', 
  id: 'getOne',
  level: VIEW,
  resp: {type: 'json', schema: Contact},
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services.contact.getOne({pgschema: req.TID, rec: { id }});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

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
  subapp,
  version,
  path: '/contact', 
  id: 'create',
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
  subapp,
  version,
  path: '/contact/:id', 
  id: 'update',
  level: UPDATE,
  resp: {type: 'json', schema: Contact},
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services.contact.update({pgschema: req.TID, id, rec: req.body.contact});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

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
  subapp,
  version,
  path: '/contact/:id', 
  id: 'delete',
  level: DELETE,
  resp: {type: 'json', schema: Contact},
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services.contact.delete({pgschema: req.TID, id: req.params.id});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));