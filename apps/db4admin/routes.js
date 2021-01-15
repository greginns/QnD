const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {OPEN, ACCESS, VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const app = getAppName(__dirname);
const version = 'v1';

const models = require(root + `/apps/${app}/models.js`);
const services = require(root + `/apps/${app}/services.js`);

const getDbPg = function(sessdata) {
  return {database: sessdata.database, pgschema: sessdata.pgschema};
}

// Page route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'login',
  version,
  path: ['/'], 
  rewrite: false,
  id: 'loginpage',
  level: OPEN,
  desc: 'Login Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.login(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      //{session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

// Menu route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'login',
  version,
  path: ['/menu'], 
  rewrite: false,
  id: 'menupage',
  level: OPEN,
  desc: 'Menu Page',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.menu(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      //{basic: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
    ],
  }
}));

// login
Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp: 'login',
  version,
  path: '/login', 
  id: 'login',
  level: OPEN,
  fn: async function(req) {
    var tm = await services.login(req.body);

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
  subapp: 'login',
  version,
  path: '/logout', 
  id: 'logout',
  level: OPEN,
  fn: async function(req) {
    var tm = await services.logout(req);
  
    return tm.toResponse();
  },
  security: {
    strategies: []
  }
}));


// Model Routes
let allowCORS = true, inAPI = true;
let admin = 'b9455c80-757d-4cc8-831f-b7ec4d9c9b01';

// Admin

// getMany
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'admin',
  version: version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Admin},
  allowCORS,
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let {database, pgschema} = getDbPg(req.session);
    let tm = await services.admin.getMany({database, pgschema, rec, cols, where, values, limit, offset, orderby});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      //{basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

//getOne
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'admin',
  version: version,
  path: '/:id', 
  id: 'getOne',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Admin},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDbPg(req.session);
      tm = await services.admin.getOne({database, pgschema, rec: {id} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }
  
    return tm.toResponse();
  }.bind(this), 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      //{basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// create
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'admin',
  version: version,
  path: '/', 
  id: 'create',
  level: CREATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Admin},
  allowCORS,
  fn: async function(req) {
    let {database, pgschema} = getDbPg(req.session);
    let rec = req.body.admin || {};
    rec.admin = admin;

    let tm = await services.admin.create({database, pgschema, rec});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      //{basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// update
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'admin',
  version: version,
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Admin},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDbPg(req.session);
      tm = await services.admin.update({database, pgschema, id, rec: req.body.admin || {} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      //{basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// delete
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'admin',
  version: version,
  path: '/:id', 
  id: 'delete',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.admin},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDbPg(req.session);
      tm = await services.admin.delete({database, pgschema, id});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      //{basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

//strategy rtns
Authentication.add(app, 'session', async function(req, security, strategy) {
  let tm = await services.auth.session(req, security, strategy);

  return tm.toResponse();    
})
//
//Authentication.add(app, 'basic', async function(req, security, strategy) {
//  let tm = await services.auth.basic(req, security, strategy);
//
//  return tm.toResponse();    
//})

Authentication.add(app, 'ws', async function(req, security, strategy) {
  let tm = await services.auth.ws(req, security, strategy);

  return tm.toResponse();    
})