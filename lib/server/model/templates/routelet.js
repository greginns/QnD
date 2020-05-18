const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const services = require(root + `/apps/${app}/services.js`);
const version = 'v1';

// {{name}}
Router.add(new RouterMessage({
  method: 'get',
  app,
  version,
  path: '/{{nameLC}}', 
  desc: 'Return one or more' + {{name}} + 's',
  fn: async function(req) {
    let tm = await services.{{nameLC}}.getAll({pgschema: req.TID, query: req.query});

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
  path: '/{{nameLC}}/:{{pk}}', 
  desc: 'Return one ' + {{name}},
  fn: async function(req) {
    let tm = await services.{{nameLC}}.getOne({pgschema: req.TID, {{pk}}: req.params.{{pk}} });
  
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
  path: '/{{nameLC}}', 
  desc: 'Create a ' + {{name}},
  fn: async function(req) {
    let tm = await services.{{nameLC}}.create({pgschema: req.TID, rec: req.body.{{nameLC}}});

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
  path: '/{{nameLC}}/:{{pk}}', 
  desc: 'Update a ' + {{name}},
  fn: async function(req) {
    let tm = await services.{{nameLC}}.update({pgschema: req.TID, {{pk}}: req.params.{{pk}}, rec: req.body.{{nameLC}}});

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
  path: '/{{nameLC}}/:{{pk}}', 
  desc: 'Delete a ' + {{name}},
  fn: async function(req) {
    let tm = await services.{{nameLC}}.delete({pgschema: req.TID, {{pk}}: req.params.{{pk}}});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));