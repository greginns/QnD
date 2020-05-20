const root = process.cwd();

const {ResponseMessage} = require(root + '/lib/server/utils/messages.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {Authorization} = require(root + '/lib/server/utils/authorization.js');
const {Router} = require(root + '/lib/server/utils/router.js');
const config = require(root + '/config.json').server;

module.exports = {
  check: async function(req, res) {
    // logged in status
    const security = Router.getSecurity(req);
    const routeInfo = Router.getRouteInfo(req);
    let rm = new ResponseMessage({status: 200});
    
    const testStrategies = async function() {
      // test each strategy until a 200 status, or out of strategies
      let rm;

      for (let strategy of security.strategies) {   
        let method = Object.keys(strategy)[0];    // session, basic, etc
        let auth = Authentication.get(security.app, method);

        if (!auth) {
          rm = new ResponseMessage({status: 500, err: `No ${method} Strategy Route Specified`});
          break;
        }

        rm = await auth(req, security, strategy[method]);

        if (rm.status == 200) break;
      }

      return rm;
    }

    const testRoles = function(userGroup) {
      let id = routeInfo.id;

      if (id) {
        let idp = id.split('.');

        if (idp.length > 2) {
          return Authorization.userCanAccess(idp[0], idp[1], idp[2], userGroup);
        }
      }

      return false;
    }

    // no security = 404, no strategies = open access
    if (security === false || security.strategies.length == 0) return rm;  //if (routeInfo === false) return;

    rm = await testStrategies();

    if (rm.status == 200) {
      console.log('AUTHZ',req.parsedURL.pathname,testRoles('admin'));
    }

    if (rm.status == 200) {
      req.TID = rm.data.tenant.code;
      req.tenant = rm.data.tenant;
      req.user = rm.data.user;
    }

    return rm;
  },
  
  checkWS: async function(req) {
    const path = req.parsedURL.pathname.split('/');  
    const app = path[1];
    const auth = Authentication.get(app, 'ws');

    if (!auth || req.headers.origin.indexOf(config.domain) == -1) {
      return {tenant: null, user: null};
    }
    
    let res = await auth(req);  // tenant, user
    return res.data;
  },
}