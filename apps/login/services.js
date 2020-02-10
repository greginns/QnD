const root = process.cwd();
const nunjucks = require('nunjucks');
const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt');

const {User, CSRF} = require(root + '/apps/login/models.js');
const {Session, Tenant} = require(root + '/apps/admin/models.js');
const {NunjucksError, InvalidUserError} = require(root + '/server/utils/errors.js');
const {TravelMessage} = require(root + '/server/utils/messages.js');
const pgschema = 'public';
const config = require(root + '/config.json');

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
    verifySession: async function(req) {
      var sess, tm, tenant = null, user = null;
      var sessID = req.cookies.tenant_session || '';

      if (sessID) {
        sess = await Session.selectOne({pgschema, cols: '*', showHidden: true, pks: sessID});

        if (!sess.err) {
          tm = await Tenant.selectOne({pgschema, cols: '*', pks: sess.data.tenant});

          if (tm.isGood()) {
            tenant = tm.data;

            tm = await User.selectOne({pgschema: tenant.code, cols: '*', pks: sess.data.user});
            if (tm.isGood()) user = tm.data;
          }
        }
      }

      return [tenant, user];
    },
    
    verifyCSRF: async function(req) {
      // get token, check if user matches
      var TID = req.TID;
      var user = req.user;
      var token = req.CSRFToken || null;
      var tm;

      if (!token) return false;

      tm = await CSRF.selectOne({pgschema: TID, pks: token});
      if (tm.err) return false;

      return tm.data.user == user.code;    
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