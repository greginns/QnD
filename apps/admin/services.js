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

const sqlUtil = require(root + '/server/utils/sqlUtil.js');
const migration = require(root + '/server/utils/migration.js');
const {UserError, NunjucksError, InvalidUserError, JSONError} = require(root + '/server/utils/errors.js');
const {TravelMessage} = require(root + '/server/utils/messages.js');
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
        tm.err = new NunjucksError(err);
      }

      return tm;
    },
    
    manage: async function(req) {
      // Main admin manage page.  Needs a user so won't get here without one
      var ctx = {};
      var nj;
      var tm = new TravelMessage();

      ctx.CSRFToken = uuidv1();
      
      // create CSRF record
      rec = new CSRF({token: ctx.CSRFToken, user: req.user.code});
      tm = await rec.insertOne({pgschema});

      ctx.tenant = Tenant.getColumnDefns();
      ctx.user = User.getColumnDefns();
      ctx.dateFormat = 'MM/DD/YYYY';
      ctx.timeFormat = 'hh:mm A';
      ctx.TID = pgschema;
      
      try {
        nj = nunjucks.configure([root], { autoescape: true });
        tm.data = nj.render('apps/admin/views/admin-manage.html', ctx);
        tm.type = 'html';
      }  
      catch(err) {
        tm.err = new NunjucksError(err);
      }

      return tm;
    },
  },
  
  auth: {
    verifySession: async function(req) {
      var tm, user = null;
      var sessID = req.cookies.admin_session || '';

      if (sessID) {
        tm = await Session.selectOne({pgschema, cols: '*', showHidden: true, pks: sessID});

        if (tm.isGood()) {
          tm = await User.selectOne({pgschema, cols: '*', pks: tm.data.user});

          if (tm.isGood()) user = tm.data;
        }
      }
        
      return [{code: 'public'}, user];
    },
    
    verifyCSRF: async function(req) {
      // get token, check if user matches
      var user = req.user;
      var token = req.CSRFToken || null;
      var tm;

      if (!token) return false;

      tm = await CSRF.selectOne({pgschema, pks: token})

      if (tm.isBad()) return false;

      return tm.data.user == user.code;    
    },
    
    login: async function(body) {
      // credentials good?
      // create Session record 
      // setup cookies
      var match, tm, rec;
      var url = config.logins.admin || '';

      // user valid?
      tm = await User.selectOne({pgschema, cols: 'password', pks: body.username});
      if (tm.isBad()) return new TravelMessage({data: '', type: 'text', err: new InvalidUserError()});

      // password valid?
      match = await bcrypt.compare(body.password, tm.data.password);
      if (!match) return new TravelMessage({data: '', type: 'text', err: new InvalidUserError()});
      
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
      var tobj, tm;
      
      if (id) {
        tobj = new Session({id});
        tm = await tobj.deleteOne({pgschema});
      }
      
      return new TravelMessage({data: '/admin', type: 'text', status: 200, cookies: [{name: 'admin_session', value: ''}]});
    },
  },
  
  query: async function(query) {
    var sql, tm;
    
    try {
      sql = sqlUtil.jsonToQuery(query, 'admin', pgschema, {verbose: false});
    }
    catch(err) {
      return new TravelMessage({err: new JSONError(err)});
    }
    
    tm = await sqlUtil.execQuery(sql);
    return tm;
  },
  
// Tenants  
  tenant: {
    get: async function({rec = {}} = {}) {
      // get one or more tenants
      return await Tenant.select({pgschema, rec});
    },
    
    insert: async function({rec = {}} = {}) {
      var tm1, tm2, tm3, tobj, sql;
      var tm = new TravelMessage();

      tobj = new Tenant(rec);

      // insert tenant row
      tm1 = await tobj.insertOne({pgschema});
      if (tm1.err.name == 'DataValidationError') return tm1;

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

        let res = await migFile.write(migrationFile, {});
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
      
      if (!code) {
        return new TravelMessage({err: new UserError('No Tenant Code Supplied')});
      }
          
      rec.code = code;
      
      tobj = new Tenant(rec);
      
      return await tobj.updateOne({pgschema});
    },
    
    delete: async function({code = ''} = {}) {
      // delete Tenant
      // drop schema and tables
      var tm1, tm2, tobj, sql;
      var tm = new TravelMessage();
      
      if (!code) return new TravelMessage({err: new UserError('No Tenant Code Supplied')});

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
      return await User.select({pgschema, rec});
    },
    
    insert: async function({rec = {}} = {}) {
      // Insert Record
      var tobj = new User(rec);
    
      return await tobj.insertOne({pgschema});
    },
    
    update: async function({code = '', rec= {}} = {}) {
      // Update record
      if (!code) return new TravelMessage({err: new UserError('No User Code Supplied')});
          
      rec.code = code;
      var tobj = new User(rec);
        
      return await tobj.updateOne({pgschema});
    },
    
    delete: async function({code = ''} = {}) {
      if (!code) return new TravelMessage({err: new UserError('No User Code Supplied')});
      
      var tobj = new User({code});
      return await tobj.deleteOne({pgschema});
    },  
  },
  
  migrate: {
    run: async function({code = ''} = {}) {
      // run migrations for this tenant
      if (!code) return new TravelMessage({err: new UserError('No Tenant Code Supplied')});
      
      tm = await Tenant.selectOne({pgschema, cols: '*', showHidden: true, pks: code});
      if (tm.isBad()) return tm;

      return await migration({tenant: code});
    }    
  },
}