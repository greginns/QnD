const root = process.cwd();
const {ResponseMessage} = require(root + '/server/utils/messages.js');
const {SystemError} = require(root + '/server/utils/errors.js');
const {Router} = require(root + '/server/utils/router.js');
const config = require(root + '/config.json').server;

module.exports = {
  check: async function(req, res) {
    // logged in status
    var app, auth, csrf;
    var options = Router.getOptions(req);

    if (options === false) return;  // 404, let router catch it.
    if (options.bypassUser) return;    

    app = options.authApp;
    auth = Router.getInfo('/' + app + '/auth');
    csrf = Router.getInfo('/' + app + '/csrf');

    if (!app) throw new ResponseMessage({status: 500, err: new SystemError('No Auth App Specified')});
    if (!auth) throw new ResponseMessage({status: 500, err: new SystemError('No app/auth Route Specified')});
    if (!csrf) throw new ResponseMessage({status: 500, err: new SystemError('No app/csrf Route Specified')});

    let [tenant, user] = await auth.fn(req, res);

    if (!user) {
      if (options.needLogin) {
        if (options.redirect) {
          // redirect user
          throw new ResponseMessage({status: 302, data: options.redirect});
        }
        else {
          // security error
          throw new ResponseMessage({status: 401});
        }
      }
    }
    else {
      req.TID = tenant.code;  //these need to be here to do the csrf.fn
      req.tenant = tenant;
      req.user = user;  

      if (options.needLogin && user.code == 'Anonymous' && !options.allowAnon) {
        // Anonymous user but Anon not allowed, and need a login
        throw new ResponseMessage({status: 401});
      }

      if (options.needCSRF) {
        let tokenOK = await csrf.fn(req, res);
        if (!tokenOK) throw new ResponseMessage({status: 401});
      }
    }
  },
  
  checkWS: async function(req) {
    var path = req.parsedURL.pathname.split('/');  
    var app = path[1];
    var auth = Router.getInfo('/' + app + '/auth');

    if (req.headers.origin.indexOf(config.domain) == -1) {
      return [null, null];
    }

    return await auth.fn(req);  // tenant, user
  },
}
