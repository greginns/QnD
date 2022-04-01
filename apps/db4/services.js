const root = process.cwd();
const bcrypt = require('bcrypt');
const config = require(root + '/config.json');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {CSRF, Session} = require(root + '/apps/db4admin/models.js');
const {exec} = require(root + '/lib/server/utils/db.js');
const {buildActionData} = require(root + '/lib/server/utils/processes.js');
const {modelEvents} = require(root + '/lib/server/utils/events.js');

const {actionGroups} = require('./processes/index.js');

const app = getAppName(__dirname);
const database = 'db4admin';
const pgschema = 'public';
const cookie = 'db4_session';

const models = require(root + `/apps/schema/models.js`);
//const schemaServices = require(root + `/apps/schema/services.js`);  *** Circular dependency

const invalidAPIACLStatus = function() {
  return new TravelMessage({status: 401});
}

const makeZapqEntry = async function(database, event, table, body) {
  let runat = new Date();
  let zaprecs = await models.zaptable.select({database, pgschema: 'public', rec: {table, event}});

  for (let rec of zaprecs.data) {
    let zapsubRec = await models.zapsub.selectOne({database, pgschema: 'public', pks: [rec.zapsub]});
    let options = {method: 'POST', url: zapsubRec.data.url};
    let source = {source: 'table', table, action: event};

    let zrec = {zapsub: rec.zapsub, source, body, options, added: runat, runat, retries: 0};
    let zapq = new models.zapq(zrec);

    return await zapq.insertOne({database, pgschema: 'public'});
  }
};

async function verifySession(req) {
  // get session record, make sure within 24 hrs
  let sessID = req.cookies[cookie] || '';
  let data = null, tmu, sess;
  let now = (new Date()).getTime();

  if (sessID) {
    sess = await Session.selectOne({database, pgschema, cols: '*', showHidden: true, pks: sessID});

    if (sess.status == 200) {
      let then = (new Date(sess.data.issued)).getTime();
      let elapsed = now-then;

      if (elapsed < 1000*60*60*24) {
        tmu = await models.user.selectOne({database: sess.data.data.database, pgschema, cols: '*', pks: [sess.data.data.user.id]});

        if (tmu.isGood()) {
          data = sess.data;
        }
      }
    }
  }

  return data;
}

async function verifyCSRF(userID, token, sessionID) {
  // get token, check if user matches
  if (!token) return false;

  let tm = await CSRF.selectOne({database, pgschema, pks: token})

  if (tm.isBad()) return false;

  if (sessionID && sessionID != tm.data.session) return false;

  return tm.data.data.user.id == userID;
}

async function makeCSRF(sessdata, token) {
  // create CSRF record
  let rec = new CSRF({data: {user: sessdata}, session: token});
  let res = await rec.insertOne({database, pgschema});

  return res.data.token;
}

async function verifyAPI(req) {
  // verify API strategy
  // get apikey, verify
  // from that get DB and user info
  let data = null;
  let database = 'db4_73WakrfVbNJBaAmhQtEeDv';
  let apikey = req.headers.apikey || 'gxPnyqxAgxxHyajo3WHtRA';

  if (apikey != 'gxPnyqxAgxxHyajo3WHtRA') return null;

  // this will have to be setup when generating apikey
  data = {"database":"db4_73WakrfVbNJBaAmhQtEeDv", pgschema: "Workspace1", "user":{"id":"12345","first":"Greg","last":"Miller","_pk":"12345"}};

  let tmu = await models.user.selectOne({database, pgschema, cols: '*', pks: [data.user.id]});
  if (!tmu.isGood()) return null;
 
  return data;
}

async function makeQuerySQL(database, qData) {
  let table = qData.table;

  let ti = new TableInfo(database, table);
  await ti.init();
  
  // select columns
  let cols = await ti.makeQueryCols(qData.columns);

  // from table
  let from = ti.makeSchemaTableName();

  // joins
  let joins = await ti.makeQueryJoins(qData.columns);

  // where
  let [where, valueobj] = ti.makeQueryWhere(qData.where);

  // orderby
  let orderby = await ti.makeQueryCols(qData.orderby);

  let sql = 'SELECT ';
  sql += cols.join(',') + '\n';
  sql += 'FROM ' + from + '\n';
  sql += joins.join('\n') + '\n';
  sql += where + '\n';
  if (orderby.length > 0) sql += ('ORDER BY ' + orderby.join(',') + '\n');

  return [sql, valueobj];
}

function substituteValues(valueobj, data) {
  let values = [];

  for (let val of valueobj) {
    values.push(data[val] || '');
  }

  return values;
}

/*
  Eventually:
    add DB to Workspace
    compare file DB to logged in DB, or DB specified on js module load.
    compare file pgschema to pgschema specified on js module load.

    No cross DB FKs, but files from multiple DBs on same page.
    db4.js?database=xyz,workspace=abc,etc.
*/
const services = {
  output: {
    login: async function(req) {
      // output login page
      const tm = new TravelMessage();
      const db = req.query.database || '';  // comes in via URL
      const ws = req.query.workspace || ''; 

      try {
        let ctx = {database: db, workspace: ws};
        let tmpl = 'apps/db4/login.html';

        try {
          tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
          tm.type = 'html';
        }
        catch(err) {
          tm.status = 500;
          tm.message = err.toString();
        }
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }

      return tm;
    },

    getdb4: async function(req) {
      // output db4.js
      const tm = new TravelMessage();
      const db = req.query.database || '';
      const ws = req.query.workspace || '';

      try {
        let ctx = {database: db, workspace: ws};
        let tmpl = 'apps/db4/db4.js';

        try {
          tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
          tm.type = 'js';
        }
        catch(err) {
          tm.status = 500;
          tm.message = err.toString();
        }
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }

      return tm;
    },

    getBundle: async function(req) {
      // output db4.js
      const tm = new TravelMessage({type: 'js'});
      const bundle = req.params.bundle;
      const db = req.query.database || '';
      const ws = req.query.workspace || '';
      let codeBundle = {'CE': '', 'UT': ''};
      let expBundle = 'let bundle = {';

      const makeCode = function(name, type, code) {
        let ret = '';

        switch (type) {
          case 'CE':
            ret = `${name}: function(evObj) {${code}},`;
            break;

          case 'UT':
            ret = `${name}: function(obj) {${code}},`;
        }

        return ret;
      };

      let res = await schemaServices.codebundle.getOne({database: db, pgschema: 'public', rec: {id: bundle}});

      if (res.status == 200) {
        for (let id of res.data.bundle) {
          let res = await schemaServices.code.getOne({database: db, pgschema: 'public', rec: {id: id}});
          if (res.status == 200) {
            let code = makeCode(res.data.name, res.data.type, res.data.code);
            codeBundle[res.data.type] += code;
          }
        }
      }

      if (codeBundle.CE.length > 0) expBundle += `CE: {${codeBundle.CE}},`;
      if (codeBundle.UT.length > 0) expBundle += `UT: {${codeBundle.UT}}`;

      expBundle += '};  export {bundle};';

      tm.data = expBundle;

      return tm;
    },

    getrdtest: async function(req) {
      // output rdtest.js
      const tm = new TravelMessage();

      try {
        let tmpl = 'apps/db4/rdtest.html';
        let ctx = {};

        try {
          tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
          tm.type = 'html';
        }
        catch(err) {
          tm.status = 500;
          tm.message = err.toString();
        }
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }

      return tm;
    },

  },

  admin: {
    login: async function(req) {
      // credentials good?
      // create Session record 
      // setup cookies
      let match, userRec, session, tm;
      let url = config.loginRedirects.db4 || '';
      let body = req.body;
      const db = body.database || '';   // database from login
      const ws = body.workspace || '';  // workspace from login
      const domain = (new URL(req.headers.referer)).hostname;

      // db and ws match?  Allowed domain
      let wsRec = await models.workspace.selectOne({database: db, pgschema, pks: [ws]});
      if (wsRec.status != 200) return new TravelMessage({status: 403});

      if (db != wsRec.data.database) return new TravelMessage({status: 403});
      if (wsRec.data.domains.indexOf(domain) == -1) return new TravelMessage({status: 403});

      // user valid?
      userRec = await models.user.selectOne({database: db, pgschema, cols: ['id', 'first', 'last', 'password'], pks: [body.username]});
   
      if (userRec.status != 200) return new TravelMessage({status: 403});
  
      // password valid?
      match = await bcrypt.compare(body.password, userRec.data.password);
      if (!match) return new TravelMessage({status: 403});
      
      // create session record
      delete userRec.data.password;
      session = new Session({data: {database: db, pgschema: ws || userRec.data.workspace, 'user': userRec.data}});
      tm = await session.insertOne({database: 'db4admin', pgschema: 'public'});

      if (tm.isBad()) return tm;
  
      let token = await makeCSRF(userRec.data, session.token);

      // Reply with CSRF token, include session as cookie
      return new TravelMessage({data: {url, token}, type: 'json', status: 200, cookies: [{name: cookie, value: session.token, path: '/', 'Max-Age': 60*60*24, HttpOnly: true}]});
    },
    
    logout: async function(req) {
      // delete session record
      // remove cookie
      let id = req.cookies[cookie] || '';
      let session;
      
      if (id) {
        session = new Session({id});
  
        await session.deleteOne({database: 'db4admin', pgschema: 'public'});
      }
      
      return new TravelMessage({data: '/db4/v1/login', type: 'text', status: 200, cookies: [{name: cookie, value: ''}]});
    },
  
  },

  table: {
    getOne: async function(database, table, pk, columns, viaDB4API) {
      let tm;
      let ti = await initTableInfo(database, table);

      if (viaDB4API) {
        let acl = ti.getAPIACL();

        if (!acl.one) return invalidAPIACLStatus();
      }

      let [text, values, err] = ti.makeSelectOneSQL(pk, columns);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});

        if (tm.status == 200) {
          if (tm.data.length != 1) {
            tm.status = 400;
            tm.type='text';
            tm.message = 'Zero or more than one entry found';
          }
          else {
            tm.data = tm.data[0];
          }
        }
      }

      return tm;
    },

    lookup: async function(database, table, pk, columns, viaDB4API) {
      return services.table.getOne(database, table, pk, columns, viaDB4API);
    },

    getMany: async function(database, table, filters, columns, viaDB4API) {
      let tm;
      let ti = await initTableInfo(database, table);

      if (viaDB4API) {
        let acl = ti.getAPIACL();

        if (!acl.many) return invalidAPIACLStatus();
      }

      let [text, values, err] = ti.makeSelectManySQL(filters, columns);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});
        console.log(tm)
      }

      return tm;
    },

    insert: async function(database, table, data, viaDB4API) {
      let tm;
      let ti = await initTableInfo(database, table);

      if (viaDB4API) {
        let acl = ti.getAPIACL();

        if (!acl.create) return invalidAPIACLStatus();
      }

      let [text, values, err] = ti.makeInsertOneSQL(data);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});
      }

      if (tm.status == 200) {
        modelEvents.emit(`${database}.${ti.workspace}.${table}`, {action: '+', rows: tm.data});
        makeZapqEntry(database, 'create', table, data);
      }

      return tm;
    },

    update: async function(database, table, data, viaDB4API) {
      let tm;
      let ti = await initTableInfo(database, table);

      if (viaDB4API) {
        let acl = ti.getAPIACL();

        if (!acl.update) return invalidAPIACLStatus();
      }
      
      let [text, values, err] = ti.makeUpdateOneSQL(data);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});
      }

      if (tm.status == 200) {
        modelEvents.emit(`${database}.${ti.workspace}.${table}`, {action: '*', rows: tm.data});
        makeZapqEntry(database, 'update', table, data);
      }

      return tm;
    },

    delete: async function(database, table, data, viaDB4API) {
      let tm;
      let ti = await initTableInfo(database, table);

      if (viaDB4API) {
        let acl = ti.getAPIACL();

        if (!acl.delete) return invalidAPIACLStatus();
      }

      let [text, values, err] = ti.makeDeleteOneSQL(data);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});
        console.log(tm)
      }

      if (tm.status == 200) {
        modelEvents.emit(`${database}.${ti.workspace}.${table}`, {action: '-', rows: tm.data});
        makeZapqEntry(database, 'delete', table, data);
      }

      return tm;
    },

    query: async function(database, qid, opts, viaDB4API) {
      let tm = new TravelMessage();
      let qRec = await models.query.selectOne({database, pgschema: 'public', pks: qid});
      
      if (qRec.status !=200) return qRec;

      if (viaDB4API && !qRec.data.api) {
        return invalidAPIACLStatus();
      }

      let text = qRec.data.sql;
      let valueobj = qRec.data.valueobj;
      let values = substituteValues(valueobj, opts);

      if ('_offset' in opts) {
        text += 'OFFSET ' + opts['_offset'] + '\n';
      }

      if ('_limit' in opts) {
        text += 'LIMIT ' + opts['_limit'] + '\n';
      }      
console.log(text, values)
      tm = await exec(database, {text, values});
console.log(tm)
      return tm;
    },
  },

  process: {
    execute: async function(req, database, viaDB4API) {
      let pid = req.params.pid;
      let body = req.body;
      let tm = new TravelMessage();
      let data = {};
      let stepCount = 1;
      let security = {
        'smtp2go': 'api-1F90F3A4875211EBAA9DF23C91C88F4E',
        'elastic': 'A8DAB667B4A3361FDD237E8316B1A0F56A642CC67100A1956B7D7E9A02180AF44BFF79C04A928F6EF5B07C1B58AAB741'
      }

      let bizproc = await models.bizprocess.selectOne({database, pgschema: 'public', pks: pid});

      if (bizproc.status !=200) return bizproc;

      if (viaDB4API && !bizproc.data.api) {
        return invalidAPIACLStatus();
      }

      let steps = bizproc.data.steps;

      // Data from post, event or timer.
      data._initial = body;
      data._req = {body: req.body, params: req.params, query: req.query};

      for (let step of steps) {
        if (step.action.substr(0,1) == '_') continue;

        let action = actionGroups[step.action];
        let subaction = step.subaction;
        let input = buildActionData(data, step.values, action.actionParams[subaction]);
        let secVal = security[step.action] || '';  // *** fake
        let res1;

        if (step.action == 'io_int') {
          let ti = new TableInfo(database, input.table);
          await ti.init();

          res1 = await services.table[subaction](database, input.table, input.pk, input.filters, input.columns);

          if (res1.status != 200) return res1;

          data[ti.tableName] = res1.data;        
          data.user = res1.data;  // Testing only
        }
        else if (step.action.substr(0,4) == 'code') {
          res1 = await action.actions(database, subaction, data);

          if (res1.status != 200) return res1;
        }
        else {
          res1 = await action.actions[subaction](input, secVal, database, pid);

          if (res1.status != 200) return res1;
        }

        data[step.outname || 'step' + stepCount++] = res1.data;        
      }

      // Send back all data
      delete data._req;
      tm.data = data;
      return tm;      
    },
  },

  auth: {
    session: async function(req, security, strategy) {
      /*
        test SessionID
        test Admin
        test Anonymous
        test CSRF
      */
      let status = 200;
      let sessdata = await verifySession(req);

      if (!sessdata) return new TravelMessage({type: 'text', status: (strategy.redirect) ? 302 : 401, message: strategy.redirect});

      if (sessdata && strategy.needCSRF) {
        status = await verifyCSRF(sessdata.data.user.id, req.CSRFTokenDB4 || null, req.cookies[cookie] || '')
      }

      if (!status) {
        if (strategy.redirect) return new TravelMessage({type: 'text', status: (strategy.redirect) ? 302 : 401, message: strategy.redirect});

        return new TravelMessage({type: 'text', status: 401});
      }
        
      return new TravelMessage({type: 'text', status: 200, data: sessdata});
    },

    api: async function(req, security, strategy) {
      // api - test apikey, get user
      let sessdata = await verifyAPI(req);

      if (!sessdata) return new TravelMessage({type: 'text', status: 401});

      req.viaDB4API = true;
        
      return new TravelMessage({type: 'text', status: 200, data: {data: sessdata}});
    },    

    ws: async function(req) {
      let sessdata = await verifySession(req);

      return new TravelMessage({type: 'text', status: 200, data: sessdata});
    },
  },
};
/*
services.CSRF = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.CSRF.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.CSRF.select({pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.CSRF.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.CSRF.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.CSRF(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.CSRF(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.CSRF({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

services.session = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.session.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.session.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.session.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.session.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.session(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.session(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.session({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};
*/

const initTableInfo = async function(database, table) {
  let ti = new TableInfo(database, table);
  await ti.init();

  return ti;
}

class TableInfo {
  // rtns to save/retrieve data
  constructor(database, table) {
    this.database = database;
    this.table = table;
  }

  async init() {
    let tbl = await this.getATable(this.table);
    let app = await this.getAnApp(tbl.data.app);

    this.workspace = app.data.workspace;

    let workspace = await this.getAWorkspace(this.workspace);

    this.tableInfo = tbl.data;
    this.appInfo = app.data;
    this.workspaceInfo = workspace.data;

    this.tableName = this.makeTableName(this.appInfo.name, this.tableInfo.name);
    this.schemaName = `${this.workspaceInfo.name}`;
  }

  async getATable(table) {
    return await models.table.selectOne({database: this.database, pgschema: 'public', pks: table});
  }

  async getAnApp(app) {
    return await models.application.selectOne({database: this.database, pgschema: 'public', pks: app});
  }

  async getAWorkspace(ws) {
    return await models.workspace.selectOne({database: this.database, pgschema: 'public', pks: ws});
  }

  makeTableName(app, table) {
    return `${app}_${table}`;
  }

  getAllColumns() {
    return this.tableInfo.columns;
  }

  getVisibleColumns() {
    let cols = [];
    
    for (let col of this.getAllColumns()) {
      if (!col.hidden) cols.push(col);
    }

    return cols;
  }

  getColumnNames() {
    let cols = [];

    for (let col of this.getAllColumns()) {
      cols.push(col.name);
    }

    return cols;
  }

  getVisibleColumnNames() {
    let cols = [];

    for (let col of this.getVisibleColumns()) {
      cols.push(col.name);
    }

    return cols;
  }

  makeSchemaTableName() {
    return `"${this.schemaName}"."${this.tableName}"`;
  }

  makeColumnDefaults() {
    let defaults = {};

    for (let col of this.getAllColumns()) {
      let dflt;

      switch(col.type) {
        case 'CC':
        case 'CP':
        case 'CT':
        case 'NI':
        case 'NF':
        case 'ND':
        case 'NS':
        case 'MB':
        case 'MU':
        case 'JA':
        case 'JB':
          if ('default' in col && col.default) dflt = col.default;
          break;        
  
        case 'DD':
          if ('defaultDD' in col && col.defaultDD) {
            if (col.defaultDD == 'U') dflt = col.defaultDD2;
            if (col.defaultDD == 'D') dflt = (new Date()).toJSON();
          } 
          break;
  
        case 'DT':
          if ('defaultDT' in col && col.defaultDD) {
            if (col.defaultDT == 'U') dflt = col.defaultDT2;
            if (col.defaultDT == 'T') dflt = (new Date()).toJSON();
          } 
          break;                                     
  
        case 'DZ':
          if ('defaultDZ' in col && col.defaultDD) {
            if (col.defaultDZ == 'U') dflt = col.defaultDZ2;
            if (col.defaultDZ == 'Z') dflt = (new Date()).toJSON();
          } 
          break;        
      }

      if (dflt) defaults[col.name] = dflt;
    }

    return defaults;
  }

  makePKColumns() {
    let pk = this.tableInfo.pk;
    let pkList = [`"${pk}" AS "_pk"`];

    return pkList;
  }

  testPKFields(data) {
    let pk = this.tableInfo.pk;

    if (! (pk in data)) {
      return `${pk} is mandatory`;  
    }    
  }

  getAPIACL() {
    return this.tableInfo.apiacl;
  }
  
  makeInsertOneSQL(data) {
    let cols = [], values = [], params = [];
    let colList = this.getAllColumns();
    let dflts = this.makeColumnDefaults();
    let idx = 0;
    let name, type;
    let allCols = [];
    let err, errors = [];

    for (let col of colList) {
      name = col.name;
      type = col.type;
      allCols.push(`"${name}"`);

      let val;

      if (data[name] || dflts[name]) {
        val = data[name] || dflts[name];

        if (type == 'JA' || type == 'JB') val = JSON.stringify(val);

        idx++;
        cols.push(`"${name}"`);
        params.push(`$${idx}`); 
        values.push(val);
      }
      else {
        if (!col.null) {
          errors.push(col.name);
        }
      }
    }

    allCols = allCols.concat(this.makePKColumns());

    if (errors.length > 0) {
      err = `The following fields are mandatory: ${errors.join(', ')}`;
    }

    return [`INSERT INTO ${this.makeSchemaTableName()} (${cols.join(',')}) VALUES(${params.join(',')}) RETURNING ${allCols.join(',')};`, values, err];
  }

  makeUpdateOneSQL(data) {
    let colList = this.getAllColumns();
    let set = [], where = [], values = [];
    let pk = this.tableInfo.pk;
    let idx = 0;
    let name, type;
    let allCols = [];
    let err;

    err = this.testPKFields(data);
    if (err) return ['','', err];

    for (let col of colList) {
      name = col.name;
      type = col.type;
      allCols.push(`"${name}"`);
    
      if (name in data) {
        idx++;

        if (pk.indexOf(name) == -1) {
          set.push(`"${name}"=$${idx}`);
        }
        else {
          where.push(`"${name}"=$${idx}`);
        }

        values.push(type == 'JA' || type == 'JB' ? JSON.stringify(data[name]): data[name]);
      }
    } 

    allCols = allCols.concat(this.makePKColumns());

    return [`UPDATE ${this.makeSchemaTableName()} SET ${set.join(',')} WHERE ${where.join(' AND ')} RETURNING ${allCols};`, values, err];
  }

  makeDeleteOneSQL(data) {
    let colList = this.getAllColumns();
    let where = [], values = [];
    let pk = this.tableInfo.pk;
    let idx = 0;
    let name, type;
    let allCols = [];
    let err, errors = [];

    for (let col of colList) {
      name = col.name;
      type = col.type;
      allCols.push(`"${name}"`);

      if (pk.indexOf(name) != -1) {
        idx++;
        
        if (name in data) {
          where.push(`"${name}"=$${idx}`);

          values.push(type == 'JA' || type == 'JB' ? JSON.stringify(data[name]): data[name]);
        }
        else {
          errors.push(name);
        }
      }        

    } 

    allCols = allCols.concat(this.makePKColumns());

    if (errors.length > 0) {
      err = `The following fields are mandatory: ${errors.join(', ')}`;
    }

    return [`DELETE FROM ${this.makeSchemaTableName()} WHERE ${where.join(' AND ')} RETURNING ${allCols};`, values, err];
  }

  makeSelectOneSQL(pk, cols) {
    let colList = this.getAllColumns();
    let pkField = this.tableInfo.pk;
    let name, visible;
    let selCols = [];
    let err, errors = [];

    let where = `"${pkField}" = $1`;
    let values = [pk];

    for (let col of colList) {
      name = col.name;
      visible = !col.hidden;

      if ((cols.indexOf(name) > -1) || (cols[0] == '*' && visible)) {
        selCols.push(`"${name}"`);
      }
    } 

    selCols = selCols.concat(this.makePKColumns());

    if (errors.length > 0) {
      err = `The following fields are mandatory: ${errors.join(', ')}`;
    }

    return [`SELECT ${selCols} FROM ${this.makeSchemaTableName()} WHERE ${where};`, values, err];
  }

  makeSelectManySQL(filters, cols) {
    let colList = this.getAllColumns();
    let text, where = [], values = [];
    let idx = 0;
    let name, type, visible;
    let selCols = [];
    let err;

    for (let col of colList) {
      name = col.name;
      type = col.type;
      visible = !col.hidden;

      if ((cols.indexOf(name) > -1) || (cols[0] == '*' && visible)) {
        selCols.push(`"${name}"`);
      }

      if (name in filters) {
        idx++;
        where.push(`"${name}"=$${idx}`);

        values.push(type == 'JA' || type == 'JB' ? JSON.stringify(filters[name]): filters[name]);
      }
    } 

    selCols = selCols.concat(this.makePKColumns());

    text = `SELECT ${selCols} FROM ${this.makeSchemaTableName()}`;
    if (where.length > 0) text += `WHERE ${where.join(' AND ')};`

    return [text, values, err];
  }

  async makeQueryCols(cols) {
    // table.field
    // table<|>fkname.field
    // table<|>fkname.table<|>fkname.field
    const colList = [];
    const tableList = {};
    const appList = {};

    for (let col of cols) {
      let parts = col.split('.');
      let field = parts.pop();
      let table = parts.pop();

      if (table.indexOf('<') > -1) table = table.substr(0, table.indexOf('<'));
      if (table.indexOf('>') > -1) table = table.substr(0, table.indexOf('>'));

      if (!(table in tableList)) {
        let tRec = await this.getATable(table);

        tableList[table] = tRec.data;
      }

      let app = tableList[table].app;

      if (!(app in appList)) {
        let aRec = await this.getAnApp(app);

        appList[app] = aRec.data;
      }

      let tName = this.makeTableName(appList[app].name, tableList[table].name);

      colList.push(`"${tName}"."${field}"`);
    }

    return colList;
  }

  async makeQueryJoins(cols) {
    // [
    // "eKVExJHhzJCpvxRC7Fsn8W<contact.tXSsfRco6GDhRXiB4tL1Dt.date",
    // "eKVExJHhzJCpvxRC7Fsn8W.last",
    // "eKVExJHhzJCpvxRC7Fsn8W.first"
    // ]

    // LEFT JOIN "ws"."app"_"table" ON ""
    const self = this;
    const tableList = {};
    const appList = {};
    const workList = {};
    const joinList = [];
    const relsFull = [];
    const relsPart = {};

    const getTAW = async function(table) {
      if (!(table in tableList)) {
        let tRec = await self.getATable(table);

        tableList[table] = tRec.data;
      }

      let app = tableList[table].app;

      if (!(app in appList)) {
        let aRec = await self.getAnApp(app);

        appList[app] = aRec.data;
      }

      let ws = appList[app].workspace;

      if (!(ws in workList)) {
        let wRec = await self.getAWorkspace(ws);

        workList[ws] = wRec.data;
      }

      let tRec = tableList[table];
      let aRec = appList[tRec.app];
      let wRec = workList[aRec.workspace];

      return [tRec, aRec, wRec];
    }

    const makeJoin = async function(part) {
      // table<|>[r]fk
      let join = 'LEFT JOIN ';
      let pos = (part.indexOf('<') > -1) ? part.indexOf('<') : part.indexOf('>');
      let table = part.substring(0, pos);
      let dir = part.substring(pos, 1);
      let relName = part.substring(pos+1);
      let [t,a,w] = await getTAW(table);
      let sourcetName = self.makeTableName(a.name, t.name);
      let sourcetfqn = `"${w.name}"."${sourcetName}"`;
      
      let relFld = (dir == '<') ? t.rfks : t.fks;

      for (let rel of relFld) {
        if (rel.name == relName) {
          let ons = [];
          let ftable = rel.ftable;
          let [t,a,w] = await getTAW(ftable);

          let targettName = self.makeTableName(a.name, t.name);
          let targettfqn = `"${w.name}"."${targettName}"`;

          join += targettfqn + ' ON ';
          
          for (let link of rel.links) {
            ons.push(`"${sourcetName}"."${link.source}" = "${targettName}"."${link.target}"`);
          }
          
          join += ons.join(' AND ');
          break;
        }
      }

      return join;
    }

    for (let col of cols) {
      let parts = col.split('.');

      if (parts.length < 3) continue;

      parts.pop();  // field
      let rejoin = parts.join('.');

      //if (relsFull.indexOf(rejoin) == -1) relsFull.push(rejoin);

      parts.pop();  // table

      for (let part of parts) {
        let join = await makeJoin(part);

        //relsPart[part] = join;
        if (joinList.indexOf(join) == -1) joinList.push(join);
      }
    }
//console.log(relsPart, relsFull)
    return joinList;
  }

  makeQueryWhere(where) {
    // from this:  WHERE "frstname" = ${first} to this: WHERE "frstname" = '$1'
    // and return ['first']
    if (!where) return ['', []];

    let posn, posn2;
    let valueobj = [];
    let index = 0;

    if (where.substr(0,5).toUpperCase() != 'WHERE') {
      where = 'WHERE ' + where;
    }
    else {
      where = 'WHERE ' + where.substr(6);
    }

    while (true) {
      posn = where.indexOf('${');
      if (posn == -1) break;

      posn2 = where.indexOf('}', posn);
      if (posn == -1) break;

      let tmpl = where.substring(posn+2, posn2);

      ++index;
      valueobj.push(tmpl || '');
      
      where = `${where.substring(0,posn)} $${index} ${where.substr(posn2+1)}`;
    }

    return [where, valueobj];
  }
}
console.log('XXX')
module.exports = {services, makeQuerySQL, TableInfo};