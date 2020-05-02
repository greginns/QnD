const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const services = require(root + '/apps/{{app}}/services.js');
const app = '{{app}}';

// {{name}}
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/{{nameLC}}', 
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
  path: '/{{nameLC}}/:{{pk}}', 
  fn: async function(req) {
    let tm = await services.{{nameLC}}.getOne({pgschema: req.TID, {{pk}}: req.params.{{pk}} }});
  
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
  path: '/{{nameLC}}', 
  fn: async function(req) {
    let tm = await services.{{nameLC}}.insert({pgschema: req.TID, rec: req.body.{{nameLC}}});

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
  path: '/{{nameLC}}/:{{pk}}', 
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
  path: '/{{nameLC}}/:{{pk}}', 
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