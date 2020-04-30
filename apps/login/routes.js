const root = process.cwd();
const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const services = require(root + '/apps/login/services.js');
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
  security: {
    strategies: []
  }
}));

// test 
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/basic', 
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
  path: '/login', 
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
  path: '/logout', 
  fn: async function(req) {
    var tm = await services.auth.logout(req);
  
    return tm.toResponse();
  },
  security: {
    strategies: []
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
