const root = process.cwd();
const fs = require('fs').promises;

const {JSONError} = require(root + '/server/utils/errors.js');
const {ResponseMessage} = require(root + '/server/utils/messages.js');
const services = require(root + '/apps/admin/services/services.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const app = '/admin';
const authApp = 'admin';

// Admin
Router.add(new RouterMessage({
  method: 'info',
  path: app + '/auth', 
  fn: async function(req, res) {
    return await services.auth.verifySession(req);
  },
}));

Router.add(new RouterMessage({
  method: 'info',
  path: app + '/csrf', 
  fn: async function(req, res) {
    return await services.auth.verifyCSRF(req);
  },
}));

Router.add(new RouterMessage({
  method: 'post',
  path: app + '/login', 
  fn: async function(req, res) {
    var rm = new ResponseMessage();
    var tm = await services.auth.login(req.body);
  
    rm.convertFromTravel(tm);
    return rm;
  },
  options: {needLogin: false, needCSRF: false, authApp}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: app + '/logout', 
  fn: async function(req, res) {
    var tm = await services.auth.logout(req);
  
    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false, authApp}
}));

// generic admin query
Router.add(new RouterMessage({
  method: 'get',
  path: app + '/query', 
  fn: async function(req, res) {
    var rm;

    try {
      var query = JSON.parse(req.parsedURL.query.query);
      var tm = await services.query(query);

      rm = tm.toResponse();
    }
    catch(err) {
      rm = new ResponseMessage();
      rm.err = new JSONError(err);
    }
  
    return rm;
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

// tenant
Router.add(new RouterMessage({
  method: 'get',
  path: app + '/admin_tenant', 
  fn: async function(req, res) {
    var tm = await services.tenant.get();
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: app + '/admin_tenant/:code', 
  fn: async function(req, res) {
    var tm = await services.tenant.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: app + '/admin_tenant', 
  fn: async function(req, res) {
    var tm = await services.tenant.insert({rec: req.body.admin_tenant});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: app + '/admin_tenant/:code', 
  fn: async function(req, res) {
    var tm = await services.tenant.update({code: req.params.code, rec: req.body.admin_tenant});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: app + '/admin_tenant/:code', 
  fn: async function(req, res) {
    var tm = await services.tenant.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

// user
Router.add(new RouterMessage({
  method: 'get',
  path: app + '/admin_user', 
  fn: async function(req, res) {
    var tm = await services.user.get();
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: app + '/admin_user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: app + '/admin_user', 
  fn: async function(req, res) {
    var tm = await services.user.insert({rec: req.body.admin_user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: app + '/admin_user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.update({code: req.params.code, rec: req.body.admin_user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: app + '/admin_user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));


Router.add(new RouterMessage({
  method: 'put',
  path: app + '/admin_user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.update({code: req.params.code, rec: req.body.admin_user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

// Migrations
Router.add(new RouterMessage({
  method: 'post',
  path: app + '/migrate', 
  fn: async function(req, res) {
    var tm = await services.migrate.run({code: req.body.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: '', authApp}
}));

// Pages
Router.add(new RouterMessage({
  method: 'get',
  path: ['/admin'], 
  fn: async function(req, res) {
    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  options: {needLogin: false, needCSRF: false, authApp}
}));

// manage page
Router.add(new RouterMessage({
  method: 'get',
  path: ['/admin/manage/:etc', '/admin/manage'], 
  fn: async function(req, res) {
    var tm = await services.output.manage(req);

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: false, redirect: '/admin', authApp}
}));

// misc
Router.add(new RouterMessage({
  method: 'post',
  path: '/form', 
  fn: async function(req, res) {
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