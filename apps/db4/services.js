const root = process.cwd();
const bcrypt = require('bcrypt');
const config = require(root + '/config.json');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {CSRF, Session, Admin} = require(root + '/apps/db4admin/models.js');
const {exec} = require(root + '/lib/server/utils/db.js');
const {buildActionData} = require(root + '/lib/server/utils/processes.js');

//const {formatEmailObject, emailOne, mergeDoc} = require('./processes.js');
const actionGroups = {};
actionGroups.smtp2go = require('./processes/smtp2go.js');
actionGroups.elastic = require('./processes/elastic.js');
actionGroups.mailmerge = require('./processes/mailmerge.js');
actionGroups.io_int = require('./processes/io_int.js');
actionGroups.io_ext = require('./processes/io_ext.js');
actionGroups.micro_services = require('./processes/microservice.js');

let {_initial, _final} = require('./processes/_.js');
actionGroups._initial = _initial;
actionGroups._final = _final;

const app = getAppName(__dirname);
const database = 'db4admin';
const pgschema = 'public';
const cookie = 'db4admin_session';

const models = require(root + `/apps/schema/models.js`);

class TableInfo {
  constructor(database, table) {
    this.database = database;
    this.table = table;
  }

  async init() {
    let tbl = await models.table.selectOne({database: this.database, pgschema: 'public', pks: this.table});
    let app = await models.application.selectOne({database: this.database, pgschema: 'public', pks: tbl.data.app});
    let workspace = await models.workspace.selectOne({database: this.database, pgschema: 'public', pks: app.data.workspace});

    this.tableInfo = tbl.data;
    this.appInfo = app.data;
    this.workspaceInfo = workspace.data;

    this.tableName = `${this.appInfo.name}_${this.tableInfo.name}`;
    this.schemaName = `${this.workspaceInfo.name}`;
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

  makeTableName() {
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
    let pks = this.tableInfo.pk;
    let pkList = [];
    let idx = -1;

    for (let pk of pks) {
      idx++;
      pkList.push(`"${pk}" AS "_PK${idx}"`);
    }

    return pkList;
  }

  testPKFields(data) {
    let pks = this.tableInfo.pk;
    let errors = [];

    for (let pk of pks) {
      if (! (pk in data)) {
        errors.push(pk);
      }
    }

    if (errors.length > 0) return `The following fields are mandatory: ${errors.join(', ')}`;
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

        if (type == 'MJ') val = JSON.stringify(val);

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

    return [`INSERT INTO ${this.makeTableName()} (${cols.join(',')}) VALUES(${params.join(',')}) RETURNING ${allCols.join(',')};`, values, err];
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

    return [`UPDATE ${this.makeTableName()} SET ${set.join(',')} WHERE ${where.join(' AND ')} RETURNING ${allCols};`, values, err];
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

    return [`DELETE FROM ${this.makeTableName()} WHERE ${where.join(' AND ')} RETURNING ${allCols};`, values, err];
  }

  makeSelectOneSQL(filters, cols) {
    let colList = this.getAllColumns();
    let where = [], values = [];
    let pk = this.tableInfo.pk;
    let idx = 0;
    let name, type, visible;
    let selCols = [];
    let err, errors = [];

    for (let col of colList) {
      name = col.name;
      type = col.type;
      visible = !col.hidden;

      if ((cols.indexOf(name) > -1) || (cols[0] == '*' && visible)) {
        selCols.push(`"${name}"`);
      }

      if (pk.indexOf(name) != -1) {
        idx++;
        
        if (name in filters) {
          where.push(`"${name}"=$${idx}`);

          values.push(type == 'JA' || type == 'JB' ? JSON.stringify(filters[name]): filters[name]);
        }
        else {
          errors.push(name);
        }
      }        
    } 

    selCols = selCols.concat(this.makePKColumns());

    if (errors.length > 0) {
      err = `The following fields are mandatory: ${errors.join(', ')}`;
    }

    return [`SELECT ${selCols} FROM ${this.makeTableName()} WHERE ${where.join(' AND ')};`, values, err];
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

    text = `SELECT ${selCols} FROM ${this.makeTableName()}`;
    if (where.length > 0) text += `WHERE ${where.join(' AND ')};`

    return [text, values, err];
  }
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
  table: {
    insert: async function(database, table, data) {
      let tm;
      let ti = new TableInfo(database, table);
      await ti.init();

      let [text, values, err] = ti.makeInsertOneSQL(data);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});
      }

      return tm;
    },

    update: async function(database, table, data) {
      let tm;
      let ti = new TableInfo(database, table);
      await ti.init();

      let [text, values, err] = ti.makeUpdateOneSQL(data);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});
      }

      return tm;
    },

    delete: async function(database, table, data) {
      let tm;
      let ti = new TableInfo(database, table);
      await ti.init();

      let [text, values, err] = ti.makeDeleteOneSQL(data);

      if (err) {
        tm = new TravelMessage({status: 400, data: err, type: 'text'});
      }
      else {
        tm = await exec(database, {text, values});
        console.log(tm)
      }

      return tm;
    },

    getOne: async function(database, table, pk, filters, columns) {
      let tm;
      let ti = new TableInfo(database, table);
      await ti.init();

      if (pk) {
        // if pk was sent rather than filters, replace filters with pk
        let pks = ti.tableInfo.pk;

        filters = {};
        filters[pks[0]] = pk;
      }

      let [text, values, err] = ti.makeSelectOneSQL(filters, columns);

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

    lookup: async function(database, table, pk, filters, columns) {
      return services.table.getOne(database, table, pk, filters, columns);
    },

    getMany: async function(database, table, filters, columns) {
      let tm;
      let ti = new TableInfo(database, table);
      await ti.init();

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

    query: async function(database, qid) {
      let tm;
      let table = 'eKVExJHhzJCpvxRC7Fsn8W'
      let ti = new TableInfo(database, table);
      await ti.init();

      let filters = {};
      let columns = ['*'];

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

  },

  output: {
    getapi1: async function(req) {
      const tm = new TravelMessage();

      try {
        let ctx = {};
        let tmpl = 'apps/db4/api1.js';

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

    getapi2: async function(req) {
      const tm = new TravelMessage();

      try {
        let ctx = {};
        let tmpl = 'apps/db4/api2.js';

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
  },

  process: {
    output: async function(database, pid, body) {
      let tm = new TravelMessage();
      let data = {};
      let security = {
        'smtp2go': 'api-1F90F3A4875211EBAA9DF23C91C88F4E',
        'elastic': 'A8DAB667B4A3361FDD237E8316B1A0F56A642CC67100A1956B7D7E9A02180AF44BFF79C04A928F6EF5B07C1B58AAB741'
      }

      // Data from post, event or timer.
      data.initial = body;
/*
      data.user = {
        id: 'bcsjdhsjd',
        first: 'Greg',
        last: 'Miller',
        email: 'greg@reservation-net.com'
      }
*/
      const steps = [
        //{id: 'io_ext', action: 'get'},
        {id: 'io_int', action: 'lookup'},
        {id: 'mailmerge', action: 'renderString'},
        {id: 'smtp2go', action: 'sendOne'}
        //{id: 'elastic', action: 'sendOne'}
      ]      

      for (let step of steps) {
        let id = actionGroups[step.id];
        let action = step.action;
        let input = buildActionData(data, id.actionMatch[action], id.actionParams[action]);

        let secVal = security[step.id] || '';  // *** fake

        if (step.id == 'io_int') {
          let ti = new TableInfo(database, input.table);
          await ti.init();

          let res1 = await services.table[action](database, input.table, input.pk, input.filters, input.columns);

          if (res1.status != 200) return res1;

          data[ti.tableName] = res1.data;        
          data.user = res1.data;  // Testing only
        }
        else {
          let res1 = await id.actions[action](input, secVal);

          if (res1.status != 200) return res1;

          data[id.outputName] = res1.data;        
        }
      }

      // Send back all data
      tm.data = data;
      return tm;      
    },

    getGroups: function() {
      let tm = new TravelMessage();
      let data = [];

      data.push({value: '_', text: 'Process Handler'});
      data.push({value: 'io', text: 'I/O'});
      data.push({value: 'email', text: 'Email'});
      data.push({value: 'doc', text: 'Document Process'});

      tm.data = data;

      return tm;
    },

    getActions: function() {
      let tm = new TravelMessage();
      let data = [];

      for (let group in actionGroups) {
        let v = actionGroups[group];

        data.push({group: v.group, text: v.name, value: group});
      }

      tm.data = data;

      return tm;
    },

    getSubActions: function(action) {
      let tm = new TravelMessage();
      let group = actionGroups[action];
      let data = group.actionList;

      tm.data = data;

      return tm;
    },

    getSubActionInputs: function(action, subaction) {
      let tm = new TravelMessage();
      let data = actionGroups[action].actionParams[subaction];

      tm.data = data;

      return tm;
    }

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
        status = await verifyCSRF(sessdata.data.user.id, req.CSRFToken || null, req.cookies[cookie] || '')
      }

      if (!status) {
        if (strategy.redirect) return new TravelMessage({type: 'text', status: (strategy.redirect) ? 302 : 401, message: strategy.redirect});

        return new TravelMessage({type: 'text', status: 401});
      }
        
      return new TravelMessage({type: 'text', status: 200, data: sessdata});
    },

    ws: async function(req) {
      let sessdata = await verifySession(req);

      return new TravelMessage({type: 'text', status: 200, data: sessdata});
    },

    makeCSRF: async function(req) {
      let sessdata = await verifySession(req)

      if (!sessdata) return null;
      
      // create CSRF record
      let rec = new CSRF({admin: sessdata.data.user.id, session: sessdata.token});
      let res = await rec.insertOne({database, pgschema});

      return res.data.token;
    }
  },

  login: async function(body) {
    // credentials good?
    // create Session record 
    // setup cookies
    let match, admin, session, tm;
    let url = config.loginRedirects.db4admin || '';

    // user valid?
    admin = await Admin.select({database, pgschema, cols: ['id', 'first', 'last', 'isowner', 'password'], rec: {email: body.username}});
    if (admin.status != 200 || admin.data.length == 0) return new TravelMessage({status: 403});

    admin.data = admin.data[0];

    // password valid?
    match = await bcrypt.compare(body.password, admin.data.password);
    if (!match) return new TravelMessage({status: 403});
    
    // create session record
    delete admin.data.password;
    session = new Session({data: {database: 'db4_' + admin.data.id, pgschema: 'public', 'user': admin.data}});
    tm = await session.insertOne({database, pgschema});

    if (tm.isBad()) return tm;

    // Reply with blank data, include session as cookie
    return new TravelMessage({data: url, type: 'text', status: 200, cookies: [{name: cookie, value: session.token, path: '/', 'Max-Age': 60*60*24, HttpOnly: true}]});
  },
  
  logout: async function(req) {
    // delete session record
    // remove cookie
    let id = req.cookies[cookie] || '';
    let session;
    
    if (id) {
      session = new Session({id});

      await session.deleteOne({database, pgschema});
    }
    
    return new TravelMessage({data: '/db4admin/v1/login', type: 'text', status: 200, cookies: [{name: cookie, value: ''}]});
  },
};

services.account = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.Account.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.Account.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.Account.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.Account.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.Account(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.Account(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.Account({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

services.admin = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.Admin.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.Admin.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.Admin.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.Admin.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.Admin(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.Admin(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.Admin({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

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

module.exports = services;


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
        tmu = await Admin.selectOne({database, pgschema, cols: '*', pks: sess.data.data.user.id});

        if (tmu.isGood() && tmu.data.isactive) {
          data = sess.data;
        }
      }
    }
  }

  return data;
}

async function verifyCSRF(userID, token, session) {
  // get token, check if user matches
  if (!token) return false;

  let tm = await CSRF.selectOne({database, pgschema, pks: token})

  if (tm.isBad()) return false;

  if (session && session != tm.data.session) return false;

  return tm.data.admin == userID;
}

