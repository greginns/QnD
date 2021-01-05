const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {ACCESS, VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const loginServices = require(root + '/apps/login/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const app = getAppName(__dirname);
const version = 'v1';
const pgschema = 'public';

const models = require(root + `/apps/${app}/models.js`);
const services = require(root + `/apps/${app}/services.js`);

// Page route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'modules',
  version,
  path: [
    '/schemabuilder', 
    '/schemabuilder/:etc', 
    '/schemabuilder/:etc/:etc', 
    '/schemabuilder/:etc/:etc/:etc',
    '/schemabuilder/:etc/:etc/:etc/:etc',
    '/schemabuilder/:etc/:etc/:etc/:etc/:etc',
    '/schemabuilder/:etc/:etc/:etc/:etc/:etc/:etc',
    '/schemabuilder/:etc/:etc/:etc/:etc/:etc/:etc/:etc',
    '/schemabuilder/:etc/:etc/:etc/:etc/:etc/:etc/:etc/:etc',
    '/schemabuilder/:etc/:etc/:etc/:etc/:etc/:etc/:etc/:etc/:etc',
    '/schemabuilder/:etc/:etc/:etc/:etc/:etc/:etc/:etc/:etc/:etc/:etc',
  ], 
  rewrite: true,
  id: 'schemabuilder',
  level: ACCESS,
  desc: 'Schema Builder',
  inAPI: false,
  fn: async function(req) {
    let tm = await services.output.main(req);

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
      {basic: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
    ],
  }
}));

// Query route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'db4workspace',
  version,
  path: ['/query'], 
  rewrite: true,
  id: 'Db4Query',
  level: ACCESS,
  desc: 'Db4 Query',
  inAPI: false,
  fn: async function(req) {
    let {query, values} = urlQueryParse(req.query);
    let tm = await services.query({pgschema, query, values});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: true}},
    ],
  }
}));

// Model Routes
let allowCORS = true, inAPI = true;
let admin = 'b9455c80-757d-4cc8-831f-b7ec4d9c9b01';

//new Routes({app, subapp: 'db4workspace', version, allowCORS: true, model: models.Db4workspace, services, pgschema: 'public'});
//new Routes({app, subapp: 'db4app', version, allowCORS: true, model: models.Db4app, services, pgschema: 'public'});
//new Routes({app, subapp: 'db4table', version, allowCORS: true, model: models.Db4table, services, pgschema: 'public'});

// DB4WORKSPACE

// getMany
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'db4workspace',
  version: version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4workspace},
  allowCORS,
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let tm = await services['db4workspace'].getMany({pgschema, rec, cols, where, values, limit, offset, orderby});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

//getOne
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'db4workspace',
  version: version,
  path: '/:id', 
  id: 'getOne',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4workspace},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4workspace'].getOne({pgschema, rec: {id} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
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

// create
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'db4workspace',
  version: version,
  path: '/', 
  id: 'create',
  level: CREATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4workspace},
  allowCORS,
  fn: async function(req) {
    let rec = req.body['db4workspace'] || {};
    rec.admin = admin;

    let tm = await services['db4workspace'].create({pgschema, rec});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// update
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'db4workspace',
  version: version,
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4workspace},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4workspace'].update({pgschema, id, rec: req.body['db4workspace'] || {} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// delete
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'db4workspace',
  version: version,
  path: '/:id', 
  id: 'delete',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4workspace},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4workspace'].delete({pgschema, id});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// DB4APP

// getMany
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'db4app',
  version: version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4app},
  allowCORS,
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let tm = await services['db4app'].getMany({pgschema, rec, cols, where, values, limit, offset, orderby});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

//getOne
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'db4app',
  version: version,
  path: '/:id', 
  id: 'getOne',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4app},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4app'].getOne({pgschema, rec: {id} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
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

// create
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'db4app',
  version: version,
  path: '/', 
  id: 'create',
  level: CREATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4app},
  allowCORS,
  fn: async function(req) {
    let rec = req.body['db4app'] || {};
    rec.admin = admin;

    let tm = await services['db4app'].create({pgschema, rec});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// update
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'db4app',
  version: version,
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4app},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4app'].update({pgschema, id, rec: req.body['db4app'] || {} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// delete
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'db4app',
  version: version,
  path: '/:id', 
  id: 'delete',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4app},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4app'].delete({pgschema, id});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// DB4TABLE

// getMany
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let tm = await services['db4table'].getMany({pgschema, rec, cols, where, values, limit, offset, orderby});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

//getOne
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/:id', 
  id: 'getOne',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4table'].getOne({pgschema, rec: {id} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
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

// create
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/', 
  id: 'create',
  level: CREATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let rec = req.body['db4table'] || {};
    rec.admin = admin;

    let tm = await services['db4table'].create({pgschema, rec});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// update
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4table'].update({pgschema, id, rec: req.body['db4table'] || {} });

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// insert column
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/:id/column', 
  id: 'insertColumn',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4table'].insertColumn({pgschema, id, rec: req.body['db4table'] || {}});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// update column
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/:id/column/:name', 
  id: 'updateColumn',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      tm = await services['db4table'].updateColumn({pgschema, id, name, rec: req.body['db4table'] || {}});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// delete column
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/:id/column/:name', 
  id: 'deleteColumn',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      tm = await services['db4table'].deleteColumn({pgschema, id, name});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

// delete
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'db4table',
  version: version,
  path: '/:id', 
  id: 'delete',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.Db4table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      tm = await services['db4table'].delete({pgschema, id});

      if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
    }

    return tm.toResponse();
  }, 
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