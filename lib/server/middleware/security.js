const root = process.cwd();
const {ResponseMessage} = require(root + '/lib/server/utils/messages.js');
const {SystemError} = require(root + '/lib/server/utils/errors.js');
const {Router} = require(root + '/lib/server/utils/router.js');
const config = require(root + '/config.json').server;

module.exports = {
  check: async function(req, res) {
    // logged in status
    var security = Router.getSecurity(req);
    var rm;

    if (security === false) return;  // 404, let router catch it.
    if (security.strategies.length == 0) return;    

  // test each strategy until a 200 status, or failure.
    for (let strategy of security.strategies) {   // no strategies = open access
      let type = Object.keys(strategy)[0];    // session or basic
      let auth = Router.getStrategy(`/${security.app}/v0/${type}`);

      if (!auth) throw new ResponseMessage({status: 500, err: new SystemError(`No ${type} Strategy Route Specified`)});

      rm = await auth.fn(req, security, strategy[type]);

      if (rm.status == 200) break;
    }

    if (rm.status == 200) {
      req.TID = rm.data.tenant.code;
      req.tenant = rm.data.tenant;
      req.user = rm.data.user;
    }
    else {
      throw rm;
    }
  },
  
  checkWS: async function(req) {
    var path = req.parsedURL.pathname.split('/');  
    var app = path[1];
    var auth = Router.getStrategy('/' + app + '/v0/ws');

    if (!auth || req.headers.origin.indexOf(config.domain) == -1) {
      return new ResponseMessage({data: {tenant: null, user: null}});
    }

    return await auth.fn(req);  // tenant, user
  },
}