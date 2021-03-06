/*
  session expiration
  remove csrf records when logging out
  remove csrf records when creating a new one
*/
const root = process.cwd();
const fs = require('fs').promises;
const nunjucks = require('nunjucks');
const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt');

const sqlUtil = require(root + '/lib/server/utils/sqlUtil.js');
const migration = require(root + '/lib/server/utils/migration.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Tenant, User, Session, CSRF} = require(root + '/apps/admin/models.js');
const tenantUser = require(root + '/apps/login/models.js').User;
const config = require(root + '/config.json');
const pgschema = 'public';
const appNames = [];

config.apps.forEach(function(app) {
  if (app != 'admin') {
    appNames.push(app);
  }
})

async function verifySession(req) {
  // verify session strategy
  var sessID = req.cookies.admin_session || '';
  var tenant = null, user = null, tm;

  if (sessID) {
    tm = await Session.selectOne({pgschema, cols: '*', showHidden: true, pks: sessID});

    if (tm.isGood()) {  // good session ID, get user associated with session
      tm = await User.selectOne({pgschema, cols: '*', pks: tm.data.user});

      if (tm.isGood() && tm.data.active) {  // good user
        tenant = {code: 'public'};  // this is the system app
        user = tm.data;
      }
    }
  } 
  
  return [tenant, user];
}

async function verifyBasic(req) {
  // verify basic strategy
  var tenant = null, user = null, tm;
  var tup, tu, pswd, x, xtenant, xuser;
  var authHdr = req.headers.authorization || null;

  if (!authHdr) return [tenant, user];

  tup = Buffer.from(authHdr.substr(6), 'base64').toString('ascii');
  [tu, pswd, ...x] = tup.split(':');
  [xtenant, xuser, ...x] = tu.split('-');

  tm = await User.selectOne({pgschema, cols: '*', showHidden: true, pks: xuser});

  if (tm.isGood() && tm.data.active) {
    let match = await bcrypt.compare(pswd, tm.data.password);

    if (match) {
      tenant = {code: 'public'};
      user = tm.data;
    }
  }

  return [tenant, user];
}

async function verifyAnonAndCSRF(req, user, strategy) {
  // can we have an Anonymous user?
  var status = 401;

  if (user.code != 'Anonymous' || (user.code == 'Anonymous' && strategy.allowAnon)) {
    let res = true;

    if (strategy.needCSRF) { // must we have a valid CSRF token?
      res = await verifyCSRF(user, req.CSRFToken || null);
    }

    if (res) status = 200;
  }

  return status;
}

async function verifyCSRF(user, token) {
  // get token, check if user matches
  var tm;

  if (!token) return false;

  tm = await CSRF.selectOne({pgschema, pks: token})

  if (tm.isBad()) return false;

  return tm.data.user == user.code;    
}

const migFile = {
  write: async function(file, json) {
    var data = false
    
    try {
      await fs.writeFile(file, JSON.stringify(json));
      
      data = true;
    }
    catch(err) {
      console.log(err)
    }
    
    return data;
  },

  delete: async function(file) {
    var rc = false
    
    try {
      await fs.unlink(file);
      
      rc = true;    
    }
    catch(err) {
      console.log(err);
    }
    
    return rc;
  }
};

module.exports = {
  auth: {
    session: async function(req, security, strategy) {
      /*
        test SessionID
        test User
        test Anonymous
        test CSRF
      */
      var status = 401;
      var [tenant, user] = await verifySession(req);

      if (tenant && user) {
        status = verifyAnonAndCSRF(req, user, strategy);
      }

      if (status == 401) {
        if (strategy.redirect) return new TravelMessage({type: 'text', status: 302, message: strategy.redirect});

        return new TravelMessage({type: 'text', status: 401});
      }
        
      return new TravelMessage({type: 'text', status: 200, data: {tenant, user}});
    },

    basic: async function(req, security, strategy) {
      // tenant-user:password
      // decode base64 authorization header
      // get user, compare password
      // test Anonymous
      // test CSRF

      var status = 401;
      var [tenant, user] = await verifyBasic(req);

      if (tenant && user) {
        status = verifyAnonAndCSRF(req, user, strategy);
      }

      if (status == 401) {
        if (strategy.redirect) return new TravelMessage({type: 'text', status: 302, message: strategy.redirect});

        return new TravelMessage({type: 'text', status: 401});
      }
        
      return new TravelMessage({type: 'text', status: 200, data: {tenant, user}});
    },

    ws: async function(req) {
      var [tenant, user] = await verifySession(req);

      return new TravelMessage({type: 'text', status: 200, data: {tenant, user}});
    },
   
    login: async function(body) {
      // credentials good?
      // create Session record 
      // setup cookies
      var match, tm, rec;
      var url = config.loginRedirects.admin || '';

      // user valid?
      tm = await User.selectOne({pgschema, cols: 'password', pks: body.username});
      if (tm.isBad()) return new TravelMessage({status: 403});

      // password valid?
      match = await bcrypt.compare(body.password, tm.data.password);
      if (!match) return new TravelMessage({status: 403});
      
      // create session record
      rec = new Session({id: uuidv1(), tenant: 'public', user: body.username});
      tm = await rec.insertOne({pgschema});

      if (tm.isBad()) return tm;
     
      // Reply with blank data not user record, include session as cookie
      return new TravelMessage({data: url, type: 'text', status: 200, cookies: [{name: 'admin_session', value: tm.data.id, 'Max-Age': 60*60*24, HttpOnly: true}]});
    },
    
    logout: async function(req) {
      // delete session record
      // remove cookie
      var id = req.cookies.admin_session || '';
      var tobj;
      
      if (id) {
        tobj = new Session({id});
        await tobj.deleteOne({pgschema});
      }
      
      return new TravelMessage({data: '/admin', type: 'text', status: 200, cookies: [{name: 'admin_session', value: ''}]});
    },
  },

  output: {
    main: async function(req) {
      // Login Page
      var ctx = {};
      var nj;
      var tm = new TravelMessage();
      
      try {
        nj = nunjucks.configure([root], { autoescape: true });
        tm.data = nj.render('apps/admin/views/admin.html', ctx);
        tm.type = 'html';
      }  
      catch(err) {
        tm.status = 500;
        tm.message = err;
      }

      return tm;
    },
    
    manage: async function(req) {
      // Main admin manage page.  Needs a user so won't get here without one
      var ctx = {};
      var nj, rec;
      var tm = new TravelMessage();

      ctx.TID = pgschema;
      ctx.CSRFToken = uuidv1();
      ctx.tenant = Tenant.getColumnDefns();   // for field defns
      ctx.user = User.getColumnDefns();
      
      // create CSRF record
      rec = new CSRF({token: ctx.CSRFToken, user: req.user.code});
      tm = await rec.insertOne({pgschema});

      try {
        nj = nunjucks.configure([root], { autoescape: true });
        tm.data = nj.render('apps/admin/views/admin-manage.html', ctx);
        tm.type = 'html';
      }  
      catch(err) {
        tm.status = 500;
        tm.message = err;
      }

      return tm;
    },
  },

  query: async function(query) {
    var sql, tm;
    
    try {
      sql = sqlUtil.jsonToQuery(query, 'admin', pgschema, {verbose: false});
    }
    catch(err) {
      return new TravelMessage({status: 500, message: err});
    }
    
    tm = await sqlUtil.execQuery(sql);
    return tm;
  },
  
// Tenants  
  tenant: {
    get: async function({rec = {}} = {}) {
      // get one or more tenants
      if ('code' in rec && rec.code == '_default') {
        let tm = new TravelMessage();

        tm.data = [Tenant.getColumnDefaults()];
        tm.type = 'json';

        return tm;
      }
            
      return await Tenant.select({pgschema, rec});
    },
    
    insert: async function({rec = {}} = {}) {
      var tm1, tm2, tm3, tobj, sql;
      var tm = new TravelMessage();

      tobj = new Tenant(rec);

      // insert tenant row
      tm1 = await tobj.insertOne({pgschema});
      if (tm1.isBad() && 'errors' in tm.data) return tm1;

      if (tm1.isBad()) {
        // insert failure, most likely exists already
        await tobj.deleteOne({pgschema});
        return tm1;
      }

      // create schema
      sql = `CREATE SCHEMA IF NOT EXISTS "${rec.code}"`;
      tm2 = await sqlUtil.execQuery(sql);
      
      if (tm2.isBad()) {
        // create schema error
        await tobj.deleteOne({pgschema});

        return tm2; 
      }
      
      // create empty migration files
      for (var app of appNames) {
        let migrationFile = root + `/apps/${app}/migrations/${rec.code}.json`;

        await migFile.write(migrationFile, {});
      }

      tm3 = await migration({tenant: rec.code});

      if (tm3.status == 200) {
        // create admin user 
        var user = new tenantUser({code: 'admin', name: 'Administrator', password: 'Admin49!', email: rec.email, active: true});
        tm2 = await user.insertOne({pgschema: rec.code});
      }
      else {
        console.log(tm3.data.errors._verify)
        await tobj.deleteOne({pgschema});
      }

      return tm;
    },
    
    update: async function({code = '', rec= {}} = {}) {
      // Update record
      var tobj;
      
      if (!code) return new TravelMessage({status: 400, data: {message: 'No Tenant Code Supplied'}});
          
      rec.code = code;

      tobj = new Tenant(rec);
      
      return await tobj.updateOne({pgschema});
    },
    
    delete: async function({code = ''} = {}) {
      // delete Tenant
      // drop schema and tables
      var tm1, tm2, tobj, sql;
      var tm = new TravelMessage();
      
      if (!code) return new TravelMessage({status: 400, data: {message: 'No Tenant Code Supplied'}});

      // drop schema
      sql = `DROP SCHEMA IF EXISTS "${code}" CASCADE`;
      tm2 = await sqlUtil.execQuery(sql);

      if (tm2.isBad()) return tm2;  // drop schema error
      
      tobj = new Tenant({code});
      tm1 = await tobj.deleteOne({pgschema});
            
      if (tm1.isBad()) return tm1;  // delete failure

      for (var app of appNames) {
        let migrationFile = root + `/apps/${app}/migrations/${code}.json`;

        migFile.delete(migrationFile);
      }
      
      return tm;
    },
  },
  
  user: {
    get: async function({rec = {}} = {}) {
      // get one or more users
      if ('code' in rec && rec.code == '_default') {
        let tm = new TravelMessage();

        tm.data = [Tenant.getColumnDefaults()];
        tm.type = 'json';

        return tm;
      }

      return await User.select({pgschema, rec});
    },
    
    insert: async function({rec = {}} = {}) {
      // Insert Record
      var tobj = new User(rec);
    
      return await tobj.insertOne({pgschema});
    },
    
    update: async function({code = '', rec= {}} = {}) {
      // Update record
      if (!code) return new TravelMessage({status: 400, data: {message: 'No User Code Supplied'}});
          
      rec.code = code;
      var tobj = new User(rec);
        
      return await tobj.updateOne({pgschema});
    },
    
    delete: async function({code = ''} = {}) {
      if (!code) return new TravelMessage({status: 400, data: {message: 'No User Code Supplied'}});
      
      var tobj = new User({code});
      return await tobj.deleteOne({pgschema});
    },  
  },
  
  migrate: {
    run: async function({code = ''} = {}) {
      // run migrations for this tenant
      if (!code) if (!code) return new TravelMessage({status: 400, data: {message: 'No Tenant Code Supplied'}});
      
      let tm = await Tenant.selectOne({pgschema, cols: '*', showHidden: true, pks: code});
      if (tm.isBad()) return tm;

      return await migration({tenant: code});
    }    
  },
}