const root = process.cwd();

const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const loginServices = require(root + '/apps/login/services.js');
const {Router, RouterMessage, getDBandPG} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {VIEW, UPDATE, DELETE, ACCESS} = require(root + '/lib/server/utils/authorization.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');

const app = getAppName(__dirname);
const version = 'v1';
const subapp = 'avail';
const CATS = ['A', 'L', 'R', 'M', 'O', 'S', 'T', 'P'];

//const models = require(root + `/apps/${app}/models.js`);
const services = require(root + `/apps/${app}/services.js`);

Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: subapp,
  version: version,
  path: `/:cat`, 
  id: 'getOne',
  level: VIEW,
  inAPI: true,
  apiInfo: {type: 'json', schema: 'avail'},
  allowCORS: true,
  fn: async function(req) {
    let {database, pgschema} = getDBandPG(req);
    let user = req.session.user;
    let tm;
    let cat = req.params.cat;

    if (CATS.indexOf(cat) == -1) {      
      tm = new TravelMessage({data: {message: 'Invalid Category'}, status: 400});
    }
    else {
      tm = await services.avail.cat({database, pgschema, user, cat, filters: req.query.filters }); 
    }
  
    return tm.toResponse();
  }.bind(this), 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: subapp,
  version: version,
  path: `/:cat/:grp`, 
  id: 'getOne',
  level: VIEW,
  inAPI: true,
  apiInfo: {type: 'json', schema: 'avail'},
  allowCORS: true,
  fn: async function(req) {
    let {database, pgschema} = getDBandPG(req);
    let user = req.session.user;
    let tm;
    let cat = req.params.cat;
    let grp = req.params.grp;

    if (CATS.indexOf(cat) == -1) {      
      tm = new TravelMessage({data: {message: 'Invalid Category'}, status: 400});
    }
    else {
      tm = await services.avail.group({database, pgschema, user, cat, grp, filters: req.query.filters }); 
    }
  
    return tm.toResponse();
  }.bind(this), 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: subapp,
  version: version,
  path: `/:cat/:grp/:code`, 
  id: 'getOne',
  level: VIEW,
  inAPI: true,
  apiInfo: {type: 'json', schema: 'avail'},
  allowCORS: true,
  fn: async function(req) {
    let {database, pgschema} = getDBandPG(req);
    let user = req.session.user;
    let tm;
    let cat = req.params.cat;
    let code = req.params.code;

    if (CATS.indexOf(cat) == -1) {      
      tm = new TravelMessage({data: {message: 'Invalid Category'}, status: 400});
    }
    else {
      tm = await services.avail.code({database, pgschema, user, cat, code, filters: req.query.filters }); 
    }
  
    return tm.toResponse();
  }.bind(this), 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
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