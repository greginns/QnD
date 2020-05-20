const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const subapp = {{subapp}};
const { {{name}} } = require(root + `/apps/${app}/models.js`);
const services = require(root + `/apps/${app}/services.js`);
const version = 'v1';

// {{name}}
Router.add(new RouterMessage({
  method: 'get',
  app,
  version,
  path: '/{{subapp}}', 
  id: `${app}.${subapp}.getMany`,
  level: VIEW,
  resp: {type: 'json', schema: [{{name}}]},
  fn: async function(req) {
    let tm = await services.{{subapp}}.getMany({pgschema: req.TID, query: req.query});

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
  path: '/{{subapp}}/:{{pk}}', 
  id: `${app}.${subapp}.getOne`,
  level: VIEW,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let tm = await services.{{subapp}}.getOne({pgschema: req.TID, {{pk}}: req.params.{{pk}} });
  
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
  path: '/{{subapp}}', 
  id: `${app}.${subapp}.create`,
  level: CREATE,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let tm = await services.{{subapp}}.create({pgschema: req.TID, rec: req.body.{{subapp}}});

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
  path: '/{{subapp}}/:{{pk}}', 
  id: `${app}.${subapp}.update`,
  level: UPDATE,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let tm = await services.{{subapp}}.update({pgschema: req.TID, {{pk}}: req.params.{{pk}}, rec: req.body.{{subapp}}});

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
  path: '/{{subapp}}/:{{pk}}', 
  id: `${app}.${subapp}.delete`,
  level: DELETE,
  resp: {type: 'json', schema: {{name}}},
  fn: async function(req) {
    let tm = await services.{{subapp}}.delete({pgschema: req.TID, {{pk}}: req.params.{{pk}}});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));