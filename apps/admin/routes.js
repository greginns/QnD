const root = process.cwd();

const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {OPEN, ACCESS, VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');

const services = require(root + '/apps/admin/services.js');
const app = 'admin';
const subapp = 'admin';
const version = 'v1';

// Pages
// Main/Login
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '', 
  id: 'main',
  level: OPEN,
  fn: async function(req) {
    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  security: {
    strategies: [
    ]
  }
}));

// Manage page
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: ['/manage/:etc', '/manage'], 
  id: 'manage',
  level: ACCESS,
  fn: async function(req) {
    var tm = await services.output.manage(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false}},
      {basic: {allowAnon: false, needCSRF: false}}
    ],
    redirect: '/admin'
  } 
}));

// login in/out
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
    strategies: [
    ]
  }
}));

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
    strategies: [
      {session: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// tenant management
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'tenant',
  version,
  path: '/tenant', 
  id: 'getMany',
  level: VIEW,
  fn: async function(req) {
    var tm = await services.tenant.get();
  
    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'tenant',
  version,
  path: '/tenant/:code', 
  id: 'getOne',
  level: VIEW,
  fn: async function(req) {
    var tm = await services.tenant.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp: 'tenant',
  version,
  path: '/tenant', 
  id: 'create',
  level: CREATE,
  fn: async function(req) {
    var tm = await services.tenant.insert({rec: req.body.tenant});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'put',
  app,
  subapp: 'tenant',
  version,
  path: '/tenant/:code', 
  id: 'update',
  level: UPDATE,
  fn: async function(req) {
    var tm = await services.tenant.update({code: req.params.code, rec: req.body.tenant});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  subapp: 'tenant',
  version,
  path: '/tenant/:code', 
  id: 'delete',
  level: DELETE,
  fn: async function(req) {
    var tm = await services.tenant.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

// Admin Users
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'user',
  version,
  path: '/user', 
  id: 'getMany',
  level: VIEW,
  fn: async function(req) {
    var tm = await services.user.get();
  
    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'user',
  version,
  path: '/user/:code', 
  id: 'getOne',
  level: VIEW,
  fn: async function(req) {
    var tm = await services.user.get({rec: {code: req.params.code}});
  
    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp: 'user',
  version,
  path: '/user', 
  id: 'create',
  level: CREATE,
  fn: async function(req) {
    var tm = await services.user.insert({rec: req.body.user});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'put',
  app,
  subapp: 'user',
  version,
  path: '/user/:code', 
  id: 'update',
  level: UPDATE,
  fn: async function(req) {
    var tm = await services.user.update({code: req.params.code, rec: req.body.user});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  subapp: 'user',
  version,
  path: '/user/:code', 
  id: 'delete',
  level: DELETE,
  fn: async function(req) {
    var tm = await services.user.delete({code: req.params.code});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

// Migrations
Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp: 'migrate',
  version,
  path: '/migrate', 
  id: 'migrate',
  level: UPDATE,
  fn: async function(req) {
    var tm = await services.migrate.run({code: req.body.code});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
    ],
  } 
}));

// misc for testing
/*
Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp,
  version,
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
  security: {
    strategies: [
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp,
  version,
  path: '/echo', 
  fn: async function(req) {
    console.log('ECHO')
    console.log(req.body)
  
    return tm.toResponse();
  },
  security: {
    strategies: [
    ]
  }
}));
*/

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