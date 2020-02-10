const root = process.cwd();
const services = require(root + '/apps/login/services.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const app = 'login';

// login page
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '', 
  fn: async function(req) {
    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  options: {needLogin: false, needCSRF: false, allowAnon: true}
}));

// login
Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/login', 
  fn: async function(req) {
    var tm = await services.auth.login(req.body);
  
    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false}
}));

// logout
Router.add(new RouterMessage({
  method: 'delete',
  app,
  path: '/logout', 
  fn: async function(req) {
    var tm = await services.auth.logout(req);
  
    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false}
}));

// check session
Router.add(new RouterMessage({
  method: 'info',
  app,
  path: '/auth', 
  fn: async function(req) {
    return await services.auth.verifySession(req);
  },
}));

// check csrf
Router.add(new RouterMessage({
  method: 'info',
  app,
  path: '/csrf', 
  fn: async function(req) {
    return await services.auth.verifyCSRF(req);
  },
}));
