const root = process.cwd();
const fs = require("fs");

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const loginServices = require(root + '/apps/login/services.js');
const services = require(root + '/apps/zapi/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const path = 'routelets';

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  require(`./${path}/${file}`);
}

// top level zaps

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