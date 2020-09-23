const root = process.cwd();
const fs = require("fs");

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {ACCESS} = require(root + '/lib/server/utils/authorization.js');
const loginServices = require(root + '/apps/login/services.js');
const services = require(root + '/apps/contacts/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const subapp = 'modules';
const path = 'routelets';

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  require(`./${path}/${file}`);
}

// page routes
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version: 'v1',
  //path: ['/main', '/main/:etc'], 
  path: ['/contactpage', '/contactpage/:etc', '/contactpage/:etc/:etc', '/contactpage/:etc/:etc/:etc'], 
  rewrite: true,
  id: 'contacts',
  level: ACCESS,
  desc: 'Contact Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.main(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
      {basic: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
    ],
  }
}));

//strategy rtns
Authentication.add(app, 'session', async function(req, security, strategy) {
  let tm = await loginServices.auth.session(req, security, strategy);

  return tm.toResponse();    
})

Authentication.add(app, 'basic', async function(req, security, strategy) {
  let tm = await loginServices.auth.basic(req, security, strategy);

  return tm.toResponse();    
})

Authentication.add(app, 'ws', async function(req, security, strategy) {
  let tm = await loginServices.auth.ws(req, security, strategy);

  return tm.toResponse();    
})