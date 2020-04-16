const root = process.cwd();
const fs = require('fs').promises;

const {ResponseMessage} = require(root + '/server/utils/messages.js');
const services = require(root + '/apps/admin/services.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const app = 'admin';

// Pages
// Main/Login
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '', 
  fn: async function(req) {
    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {}},
      {basic: {}}
    ]
  }
  //options: {needLogin: false, needCSRF: false, authApp}
}));

// Manage page
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: ['/manage/:etc', '/manage'], 
  fn: async function(req) {
    var tm = await services.output.manage(req);

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: false, redirect: '/admin', authApp}
}));

// Login/out, info rtns
Router.add(new RouterMessage({
  method: 'info',
  app,
  path: '/session', 
  fn: async function(req, security, strategy) {
    return await services.auth.session(req, security, strategy);
  },
}));

Router.add(new RouterMessage({
  method: 'info',
  app,
  path: '/basic', 
  fn: async function(req, security, strategy) {
    return await services.auth.basic(req, security, strategy);
  },
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/login', 
  fn: async function(req) {
    var tm = await services.auth.login(req.body);
  
    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false, authApp}
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  path: '/logout', 
  fn: async function(req) {
    var tm = await services.auth.logout(req);
  
    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false, authApp}
}));

// tenant management
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/tenant', 
  fn: async function(req) {
    var tm = await services.tenant.get();
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/tenant/:code', 
  fn: async function(req) {
    var tm = await services.tenant.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/tenant', 
  fn: async function(req) {
    var tm = await services.tenant.insert({rec: req.body.tenant});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'put',
  app,
  path: '/tenant/:code', 
  fn: async function(req) {
    var tm = await services.tenant.update({code: req.params.code, rec: req.body.tenant});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  path: '/tenant/:code', 
  fn: async function(req) {
    var tm = await services.tenant.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

// Admin Users
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/user', 
  fn: async function(req) {
    var tm = await services.user.get();
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/user/:code', 
  fn: async function(req) {
    var tm = await services.user.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/user', 
  fn: async function(req) {
    var tm = await services.user.insert({rec: req.body.user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'put',
  app,
  path: '/user/:code', 
  fn: async function(req) {
    var tm = await services.user.update({code: req.params.code, rec: req.body.user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  path: '/user/:code', 
  fn: async function(req) {
    var tm = await services.user.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

// Migrations
Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/migrate', 
  fn: async function(req) {
    var tm = await services.migrate.run({code: req.body.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

// misc for testing
Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/form', 
  fn: async function(req) {
    var rm = new ResponseMessage();

    rm.data = JSON.stringify({body: req.body})
    rm.ct = 'application/json';

    for (var i=0; i<req.files.length; i++) {
      try {
        await fs.writeFile(root + '/lib/' + req.files[i].filename, req.files[i].contents);  
        console.log(req.files[i].filename, ' Saved')
      }
      catch (err) {
        console.log('Error saving ' + req.files[i].filename, err)
      }
    }

    return rm;
  }, 
  options: {needLogin: false, bypassuser: true}
}));