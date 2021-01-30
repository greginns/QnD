const root = process.cwd();
const bcrypt = require('bcrypt');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {CSRF, Session, Admin} = require(root + '/apps/db4admin/models.js');
const config = require(root + '/config.json');

const app = getAppName(__dirname);
const database = 'db4admin';
const pgschema = 'public';
const cookie = 'db4admin_session';

const models = require(root + `/apps/${app}/models.js`);

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

const services = {
  output: {
    login: async function(req) {
      const tm = new TravelMessage();

      try {
        let ctx = {};
        let tmpl = 'apps/db4admin/login.html';

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
    menu: async function(req) {
      const tm = new TravelMessage();

      try {
        let ctx = {};
        let tmpl = 'apps/db4admin/menu.html';

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