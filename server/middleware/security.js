const root = process.cwd();
const {ResponseMessage} = require(root + '/server/utils/messages.js');
const {SystemError} = require(root + '/server/utils/errors.js');
const {Router} = require(root + '/server/utils/router.js');
const config = require(root + '/config.json').server;

module.exports = {
  check: async function(req, res) {
    // logged in status
    var security = Router.getSecurity(req);
    var rm;

    if (security === false) return;  // 404, let router catch it.
    if (security.strategies.length == 0) return;    

    for (let strategy of security.strategies) {   // no strategies = open access
      let type = Object.keys(strategy)[0];    // session or basic
      let auth = Router.getStrategy(`/${security.app}/${type}`);

      if (!auth) throw new ResponseMessage({status: 500, err: new SystemError(`No ${type} Strategy Route Specified`)});

      rm = await auth.fn(req, security, strategy);

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
    var auth = Router.getStrategy('/' + app + '/ws');

    if (!auth || req.headers.origin.indexOf(config.domain) == -1) {
      return [null, null];
    }

    return await auth.fn(req);  // tenant, user
  },
}