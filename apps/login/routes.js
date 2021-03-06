const root = process.cwd();
const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {OPEN} = require(root + '/lib/server/utils/authorization.js');
const services = require(root + '/apps/login/services.js');
const app = 'login';
const subapp = 'login';
const version = 'v1';

// login page
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '/', 
  //rewrite: true,
  id: 'loginpage',
  level: OPEN,
  fn: async function(req) {
    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

// test 
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '/basic',
  //rewrite: true,
  id: 'basic',
  level: OPEN,
  fn: async function(req) {
    // if we got here, then we're ok.  Get user name
    var tm = await services.auth.basic(req, {}, {});

    if (tm.status == 200) {
      tm.data = {username: tm.data.user.name};
      tm.type = 'json';
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {basic: {allowAnon: false, needCSRF: false}}
    ]
  }
}));

// login
Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp,
  version,
  path: '/login', 
  id: 'login',
  level: OPEN,
  fn: async function(req) {
    var tm = await services.auth.login(req.body);

    return tm.toResponse();
  },
  security: {
    strategies: []
  }
}));

// logout
Router.add(new RouterMessage({
  method: 'delete',
  app,
  subapp,
  version,
  path: '/logout', 
  id: 'logout',
  level: OPEN,
  fn: async function(req) {
    var tm = await services.auth.logout(req);
  
    return tm.toResponse();
  },
  security: {
    strategies: []
  }
}));

//strategy rtns
Authentication.add(app, 'session', async function(req, security, strategy) {
  let tm = await services.auth.session(req, security, strategy);

  return tm.toResponse();    
})

Authentication.add(app, 'basic', async function(req, security, strategy) {
  let tm = await services.auth.basic(req, security, strategy);

  return tm.toResponse();    
})

Authentication.add(app, 'ws', async function(req, security, strategy) {
  let tm = await services.auth.ws(req, security, strategy);

  return tm.toResponse();    
})