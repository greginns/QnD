const root = process.cwd();
const fs = require('fs').promises;

const {ResponseMessage} = require(root + '/lib/server/utils/messages.js');
const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');

const services = require(root + '/apps/admin/services.js');
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
    ]
  }
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
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false}},
      {basic: {allowAnon: false, needCSRF: false}}
    ],
    redirect: '/admin'
  } 
}));

//strategy rtns
Router.add(new RouterMessage({
  method: 'strategy',
  app,
  path: '/session', 
  fn: async function(req, security, strategy) {
    let tm = await services.auth.session(req, security, strategy);

    return tm.toResponse();
  },
}));

Router.add(new RouterMessage({
  method: 'strategy',
  app,
  path: '/basic', 
  fn: async function(req, security, strategy) {
    let tm = await services.auth.basic(req, security, strategy);
    
    return tm.toResponse();
  },
}));

Router.add(new RouterMessage({
  method: 'strategy',
  app,
  path: '/ws', 
  fn: async function(req) {
    let tm = await services.auth.ws(req);

    return tm.toResponse();
  },
}));

// login in/out
Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/login', 
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
  path: '/logout', 
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
  path: '/tenant', 
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
  path: '/tenant/:code', 
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
  path: '/tenant', 
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
  path: '/tenant/:code', 
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
  path: '/tenant/:code', 
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
  path: '/user', 
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
  path: '/user/:code', 
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
  path: '/user', 
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
  path: '/user/:code', 
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
  path: '/user/:code', 
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
  path: '/migrate', 
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
  security: {
    strategies: [
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
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