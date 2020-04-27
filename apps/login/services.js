const root = process.cwd();
const nunjucks = require('nunjucks');
const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt');

const {NunjucksError, InvalidUserError} = require(root + '/lib/server/utils/errors.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {User, CSRF} = require(root + '/apps/login/models.js');
const {Session, Tenant} = require(root + '/apps/admin/models.js');
const pgschema = 'public';
const config = require(root + '/config.json');

async function verifySession(req) {
  // verify session strategy
  var sessID = req.cookies.tenant_session || '';
  var tenant = null, user = null, tm;

  if (sessID) {
    sess = await Session.selectOne({pgschema, cols: '*', showHidden: true, pks: sessID});

    if (!sess.err) {
      tm = await Tenant.selectOne({pgschema, cols: '*', pks: sess.data.tenant});

      if (tm.isGood()) {
        let xtenant = tm.data;

        tm = await User.selectOne({pgschema: xtenant.code, cols: '*', pks: sess.data.user});
        if (tm.isGood() && tm.data.active) {
          tenant = xtenant;
          user = tm.data;
        }
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
        tm.err = new NunjucksError(err);
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
      var status = 401;
      var [tenant, user] = await verifySession(req);

      if (tenant && user) {
        status = verifyAnonAndCSRF(req, user, strategy);
      }

      if (status == 401) {
        if (security.redirect) return new TravelMessage({type: 'text', status: 302, err: {message: security.redirect}});
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
        if (security.redirect) return new TravelMessage({type: 'text', status: 302, err: {message: security.redirect}});
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
      var url = config.logins.login || '';

      // tenant valid?
      tm = await Tenant.selectOne({pgschema, cols: '', pks: body.tenant});
      if (tm.err) return new TravelMessage({data: '', type: 'text', err: new InvalidUserError()});

      // user valid?
      tm = await User.selectOne({pgschema: body.tenant, cols: 'password', pks: body.username});
      if (tm.err) return new TravelMessage({data: '', type: 'text', err: new InvalidUserError()});

      // password valid?
      match = await bcrypt.compare(body.password, tm.data.password);
      if (!match) return new TravelMessage({data: '', type: 'text', err: new InvalidUserError()});
      
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