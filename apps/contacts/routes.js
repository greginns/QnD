const root = process.cwd();
const fs = require("fs");

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const loginServices = require(root + '/apps/login/services.js');
const services = require(root + '/apps/contacts/services.js');

const path = 'routelets';
const app = 'contacts';

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  require(`./${path}/${file}`);
}

// page routes
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: ['', '/:etc'], 
  fn: async function(req) {
    let tm = await services.output.main(req);

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