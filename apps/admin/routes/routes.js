const root = process.cwd();
const fs = require('fs').promises;

const {JSONError} = require(root + '/server/utils/errors.js');
const {ResponseMessage} = require(root + '/server/utils/messages.js');
const services = require(root + '/apps/admin/server/services.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const app = '/admin';

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
  options: {needLogin: false, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: app + '/logout', 
  fn: async function(req, res) {
    var tm = await services.auth.logout(req);
  
    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false}
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
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// tenant
Router.add(new RouterMessage({
  method: 'get',
  path: app + '/tenant', 
  fn: async function(req, res) {
    var tm = await services.tenant.get();
  
    return rm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: app + '/tenant/:code', 
  fn: async function(req, res) {
    var tm = await services.tenant.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: app + '/tenant', 
  fn: async function(req, res) {
    var tm = await services.tenant.insert({rec: req.body.tenant});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: app + '/tenant/:code', 
  fn: async function(req, res) {
    var tm = await services.tenant.update({code: req.params.code, rec: req.body.tenant});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: app + '/tenant/:code', 
  fn: async function(req, res) {
    var tm = await services.tenant.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// user
Router.add(new RouterMessage({
  method: 'get',
  path: app + '/user', 
  fn: async function(req, res) {
    var tm = await services.user.get();
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: app + '/user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: app + '/user', 
  fn: async function(req, res) {
    var tm = await services.user.insert({rec: req.body.user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: app + '/user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.update({code: req.params.code, rec: req.body.user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: app + '/user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));


Router.add(new RouterMessage({
  method: 'put',
  path: app + '/user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.update({code: req.params.code, rec: req.body.user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// Migrations
Router.add(new RouterMessage({
  method: 'post',
  path: app + '/migrate', 
  fn: async function(req, res) {
    var tm = await services.migrate.run({code: req.body.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// Pages
Router.add(new RouterMessage({
  method: 'get',
  path: ['/admin'], 
  fn: async function(req, res) {
    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  options: {needLogin: false, needCSRF: false}
}));

// manage page
Router.add(new RouterMessage({
  method: 'get',
  path: ['/admin/manage/:etc', '/admin/manage'], 
  fn: async function(req, res) {
    var tm = await services.output.manage(req);

    tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: false, redirect: '/admin'}
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