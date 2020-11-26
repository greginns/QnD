const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const { Contact } = require(root + '/apps/contacts/models.js');
const services = require(root + '/apps/contacts/services.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__filename);
const version = 'v1';

// Contact
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  resp: {type: 'json', schema: [Contact]},
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let tm = await services.contact.getMany({pgschema: req.TID, rec, cols, where, values, limit, offset, orderby});
      
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
  path: '/:id', 
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
  path: '/', 
  id: 'create',
  level: CREATE,
  input: {schema: Contact},
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
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  input: {schema: Contact},
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
  path: '/:id', 
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