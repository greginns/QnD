const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {ACCESS, VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const loginServices = require(root + '/apps/db4admin/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const app = getAppName(__dirname);
const version = 'v1';

const models = require(root + `/apps/${app}/models.js`);
const services = require(root + `/apps/${app}/services.js`);

const getDBAndSchema = function(req) {
  let database = req.session.data.database;
  let pgschema = req.session.data.pgschema;

  return {database, pgschema};
}

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
      {session: {allowAnon: false, needCSRF: false, redirect: '/db4admin/v1/login/'}},
      ////{basic: {allowAnon: false, needCSRF: false, redirect: '/login/v1/login/'}},
    ],
  }
}));

// Query route
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp: 'workspace',
  version,
  path: ['/query'], 
  rewrite: true,
  id: 'Query',
  level: ACCESS,
  desc: 'Query',
  inAPI: false,
  fn: async function(req) {
    let {query, values} = urlQueryParse(req.query);
    let database = req.session.data.database;
    let pgschema = req.session.data.pgschema;
    
    let tm = await services.query({database, pgschema, query, values});

    return tm.toResponse();
  },
  security: {
    strategies: [
      {session: {allowAnon: false, needCSRF: true}},
      //{basic: {allowAnon: false, needCSRF: true}},
    ],
  }
}));

// Model Routes
let allowCORS = true, inAPI = true;

// WORKSPACE

// getMany
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'workspace',
  version: version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.workspace},
  allowCORS,
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let {database, pgschema} = getDBAndSchema(req);

    let tm = await services.workspace.getMany({database, pgschema, rec, cols, where, values, limit, offset, orderby});

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
  subapp: 'workspace',
  version: version,
  path: '/:id', 
  id: 'getOne',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.workspace},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.workspace.getOne({database, pgschema, rec: {id} });

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
  subapp: 'workspace',
  version: version,
  path: '/', 
  id: 'create',
  level: CREATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.workspace},
  allowCORS,
  fn: async function(req) {
    let rec = req.body.workspace || {};
    let {database, pgschema} = getDBAndSchema(req);

    let tm = await services.workspace.create({database, pgschema, rec});

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
  subapp: 'workspace',
  version: version,
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.workspace},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.workspace.update({database, pgschema, id, rec: req.body.workspace || {} });

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
  subapp: 'workspace',
  version: version,
  path: '/:id', 
  id: 'delete',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.workspace},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.workspace.delete({database, pgschema, id});

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

// APPLICATION

// getMany
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'application',
  version: version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.application},
  allowCORS,
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let {database, pgschema} = getDBAndSchema(req);

    let tm = await services.application.getMany({database, pgschema, rec, cols, where, values, limit, offset, orderby});

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
  subapp: 'application',
  version: version,
  path: '/:id', 
  id: 'getOne',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.application},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.application.getOne({database, pgschema, rec: {id} });

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
  subapp: 'application',
  version: version,
  path: '/', 
  id: 'create',
  level: CREATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.application},
  allowCORS,
  fn: async function(req) {
    let rec = req.body.application || {};
    let {database, pgschema} = getDBAndSchema(req);

    let tm = await services.application.create({database, pgschema, rec});

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
  subapp: 'application',
  version: version,
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.application},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.application.update({database, pgschema, id, rec: req.body.application || {} });

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
  subapp: 'application',
  version: version,
  path: '/:id', 
  id: 'delete',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.application},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.application.delete({database, pgschema, id});

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

// TABLE

// getMany
Router.add(new RouterMessage({
  method: 'get',
  app: app,
  subapp: 'table',
  version: version,
  path: '/', 
  id: 'getMany',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
    let {database, pgschema} = getDBAndSchema(req);

    let tm = await services.table.getMany({database, pgschema, rec, cols, where, values, limit, offset, orderby});

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
  subapp: 'table',
  version: version,
  path: '/:id', 
  id: 'getOne',
  level: VIEW,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.getOne({database, pgschema, rec: {id} });

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
  subapp: 'table',
  version: version,
  path: '/', 
  id: 'create',
  level: CREATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let rec = req.body.table || {};
    let {database, pgschema} = getDBAndSchema(req);

    let tm = await services.table.create({database, pgschema, rec});

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
  subapp: 'table',
  version: version,
  path: '/:id', 
  id: 'update',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.update({database, pgschema, id, rec: req.body.table || {} });

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
  subapp: 'table',
  version: version,
  path: '/:id', 
  id: 'delete',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.delete({database, pgschema, id});

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

// insert column
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/column', 
  id: 'insertColumn',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.column.insert({database, pgschema, id, rec: req.body.table || {}});

      if (tm.isBad() || tm.data.length == 0) tm = new TravelMessage({status: 404});
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

// update column
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/column/:name', 
  id: 'updateColumn',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.column.update({database, pgschema, id, name, rec: req.body.table || {}});

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

// delete column
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/column/:name', 
  id: 'deleteColumn',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.column.delete({database, pgschema, id, name});

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

// update pk
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/pk', 
  id: 'updatePK',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.updatePK({database, pgschema, id, rec: req.body.table || {}});

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

// insert fk
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/fk', 
  id: 'insertFK',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.insertFK({database, pgschema, id, rec: req.body.table || {}});

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

// update fk
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/fk/:name', 
  id: 'updatePK',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);
      
      tm = await services.table.updateFK({database, pgschema, id, name, rec: req.body.table || {}});

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

// delete FK
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/fk/:name', 
  id: 'deleteFK',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.deleteFK({database, pgschema, id, name});

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

// insert index
Router.add(new RouterMessage({
  method: 'post',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/index', 
  id: 'insertIndex',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.insertIndex({database, pgschema, id, rec: req.body.table || {}});

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

// update index
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/index/:name', 
  id: 'updateIndex',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);
      
      tm = await services.table.updateIndex({database, pgschema, id, name, rec: req.body.table || {}});

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

// delete Index
Router.add(new RouterMessage({
  method: 'delete',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/index/:name', 
  id: 'deleteIndex',
  level: DELETE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let name = req.params.name;
    let tm;

    if (!id || !name) {
      tm = new TravelMessage({data: {message: 'Invalid ID/Name'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);

      tm = await services.table.deleteIndex({database, pgschema, id, name});

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

// update orderby
Router.add(new RouterMessage({
  method: 'put',
  app: app,
  subapp: 'table',
  version: version,
  path: '/:id/orderby', 
  id: 'updateOrderby',
  level: UPDATE,
  inAPI,
  apiInfo: {type: 'json', schema: models.table},
  allowCORS,
  fn: async function(req) {
    let id = req.params.id;
    let tm;

    if (!id) {
      tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
    }
    else {
      let {database, pgschema} = getDBAndSchema(req);
      
      tm = await services.table.updateOrderby({database, pgschema, id, rec: req.body.table || {}});

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
  let tm = await loginServices.auth.session(req, security, strategy);

  return tm.toResponse();    
})

Authentication.add(app, 'ws', async function(req, security, strategy) {
  let tm = await loginServices.auth.ws(req, security, strategy);

  return tm.toResponse();    
})