const root = process.cwd();
const fs = require("fs");

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const loginServices = require(root + '/apps/login/services.js');
const services = require(root + '/apps/zapi/services.js');

const path = 'routelets';
const app = 'zapi';

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  require(`./${path}/${file}`);
}

// top level zaps
Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/v1/:app/hooks', 
  fn: async function(req) {
    let body = {}, tenant = req.TID;

    body.url = req.body.url;
    body.app = req.params.app;
    body.events = {};

    let tm = await services.subscribe({pgschema: tenant, rec: body});
  
    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  path: '/v1/:app/hooks/:id', 
  fn: async function(req) {
    let tenant = req.TID, id = req.params.id;
    let tm = await services.unsubscribe({pgschema: tenant, id});
  
    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

//strategy rtns
Router.add(new RouterMessage({
  method: 'strategy',
  app,
  path: '/session', 
  fn: async function(req, security, strategy) {
    let tm = await loginServices.auth.session(req, security, strategy);

    return tm.toResponse();    
  },
}));

Router.add(new RouterMessage({
  method: 'strategy',
  app,
  path: '/basic', 
  fn: async function(req, security, strategy) {
    let tm = await loginServices.auth.basic(req, security, strategy);

    return tm.toResponse();    
  },
}));

Router.add(new RouterMessage({
  method: 'strategy',
  app,
  path: '/ws', 
  fn: async function(req) {
    return await loginServices.auth.ws(req);
  },
}));