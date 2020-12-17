const root = process.cwd();
const nunjucks = require('nunjucks');
const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt');

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {User, CSRF} = require(root + '/apps/login/models.js');
const {Session, Tenant} = require(root + '/apps/admin/models.js');
const pgschema = 'public';
const config = require(root + '/config.json');

async function verifySession(req) {
  // verify session strategy
  let sessID = req.cookies.tenant_session || '';
  let tenant = null, user = null, tmt, tmu, sess;

  if (sessID) {
    sess = await Session.selectOne({pgschema, cols: '*', showHidden: true, pks: sessID});

    if (sess.status == 200) {
      tmt = await Tenant.selectOne({pgschema, cols: '*', pks: sess.data.tenant});

      if (tmt.isGood()) {
        tmu = await User.selectOne({pgschema: tmt.data.code, cols: '*', pks: sess.data.user});

        if (tmu.isGood() && tmu.data.active) {
          tenant = tmt.data;
          user = tmu.data;
        }
      }
    }
  }

  return [tenant, user];
}

async function verifyBasic(req) {
  // verify basic strategy
  let tenant = null, user = null, tm;
  let tup, tu, pswd, x, xtenant, xuser;
  let authHdr = req.headers.authorization || null;

  if (!authHdr) return [tenant, user];

  tup = Buffer.from(authHdr.substr(6), 'base64').toString('ascii');
  [tu, pswd, ...x] = tup.split(':');
  [xtenant, xuser, ...x] = tu.split('-');

  tm = await Tenant.selectOne({pgschema, cols: '*', pks: xtenant});

  if (tm.isGood()) {
    xtenant = tm.data;

    tm = await User.selectOne({pgschema: xtenant.code, cols: '*', showHidden: true, pks: xuser});

    if (tm.isGood() && tm.data.active) {
      let match = await bcrypt.compare(pswd, tm.data.password);

      if (match) {
        tenant = xtenant;
        user = tm.data;
      }
    }
  }

  return [tenant, user];
}

async function verifyAnonAndCSRF(req, user, tenant, strategy) {
  // can we have an Anonymous user?
  let status = 401;

  if (user.code != 'Anonymous' || (user.code == 'Anonymous' && strategy.allowAnon)) {
    let res = true;

    if (strategy.needCSRF) { // must we have a valid CSRF token?
      res = await verifyCSRF(user, tenant, req.CSRFToken || null);
    }

    if (res) status = 200;
  }

  return status;
}

async function verifyCSRF(user, tenant, token) {
  // get token, check if user matches
  if (!token) return false;

  let tm = await CSRF.selectOne({pgschema: tenant.code, pks: token})

  if (tm.isBad()) return false;

  return tm.data.user == user.code;    
}

module.exports = {
  output: {
    main: async function() {
      var ctx = {};
      var nj;
      var tm = new TravelMessage();
      
      try {
        nj = nunjucks.configure([root + '/apps', root + '/apps/login/views', root + '/client/macros'], { autoescape: true });
        tm.data = nj.render('login.html', ctx);
        tm.type = 'html';
      }  
      catch(err) {
        tm.status = 500;
        tm.message = err;
      }
      
      return tm;
    },
  },

  auth: {
    session: async function(req, security, strategy) {
      /*
        test SessionID
        test User
        test Anonymous
        test CSRF
      */
      let status = 401;
      let [tenant, user] = await verifySession(req);

      if (tenant && user) {
        status = await verifyAnonAndCSRF(req, user, tenant, strategy);
      }

      if (status != 200) {
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
        status = verifyAnonAndCSRF(req, user, tenant, strategy);
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
      var url = config.loginRedirects.login || '';

      // tenant valid?
      tm = await Tenant.selectOne({pgschema, cols: '', pks: body.tenant});
      if (tm.status != 200) return new TravelMessage({status: 403});

      // user valid?
      tm = await User.selectOne({pgschema: body.tenant, cols: 'password', pks: body.username});
      if (tm.status != 200) return new TravelMessage({status: 403});

      // password valid?
      match = await bcrypt.compare(body.password, tm.data.password);
      if (!match) return new TravelMessage({status: 403});
      
      // create session record
      rec = new Session({id: uuidv1(), tenant: body.tenant, user: body.username});
      tm = await rec.insertOne({pgschema});

      if (tm.isBad()) return tm;
     
      // Reply with blank data not user record, include session as cookie
      return new TravelMessage({data: url, type: 'text', status: 200, cookies: [{name: 'tenant_session', value: tm.data.id, path: '/', 'Max-Age': 60*60*24, HttpOnly: true}]});  //, HttpOnly: true
    },
    
    logout: async function(req) {
      // delete session record
      // remove cookie
      var id = req.cookies.tenant_session || '';
      var tobj;
      
      if (id) {
        tobj = new Session({id});
        await tobj.deleteOne({pgschema});
      }
      
      return new TravelMessage({data: '/tenant', type: 'text', status: 200, cookies: [{name: 'tenant_session', value: ''}]});
    },
  },
}