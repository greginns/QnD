const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__filename);
const version = 'v1';

const { {{name}} } = require(root + `/apps/${app}/models.js`);
const services = require(root + `/apps/${app}/services.js`);

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: `/`, 
  id: 'getMany',
  level: VIEW,
  resp: {type: 'json', schema: [{{name}}]},
  fn: async function(req) {
    let {rec, cols, limit, offset} = urlQueryParse(req.query);
    let tm = await services[subapp].getMany({pgschema: req.TID, rec, cols, limit, offset});

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
  path: `/:{{pk}}`, 
  id: 'getOne',
  level: VIEW,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let {{pk}} = req.params.{{pk}};
    let tm;

    if (!{{pk}}) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services[subapp].getOne({pgschema: req.TID, rec: { {{pk}} } });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }
  
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
  path: `/`, 
  id: 'create',
  level: CREATE,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let tm = await services[subapp].create({pgschema: req.TID, rec: req.body[subapp] || {} });

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
  path: `/:{{pk}}`, 
  id: 'update',
  level: UPDATE,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let {{pk}} = req.params.{{pk}};
    let tm;

    if (!{{pk}}) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services[subapp].update({pgschema: req.TID, {{pk}}, rec: req.body[subapp] || {} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

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
  path: `/:{{pk}}`, 
  id: 'delete',
  level: DELETE,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let {{pk}} = req.params.{{pk}};
    let tm;

    if (!{{pk}}) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services[subapp].delete({pgschema: req.TID, {{pk}} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));