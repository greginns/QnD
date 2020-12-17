const root = process.cwd();

const {TravelMessage, ResponseMessage} = require(root + '/lib/server/utils/messages.js');
const {Authentication} = require(root + '/lib/server/utils/authentication.js');
const {Authorization} = require(root + '/lib/server/utils/authorization.js');
const {Router} = require(root + '/lib/server/utils/router.js');
const config = require(root + '/config.json').server;

module.exports = {
  check: async function(req, res) {
    // logged in status
    const routeInfo = Router.getRouteInfo(req);
    const security = routeInfo.security;
    let rm = new ResponseMessage({status: 200});
    
    const testStrategies = async function() {
      // test each strategy until a 200 status, or out of strategies
      let rm;

      for (let strategy of security.strategies) {   
        let method = Object.keys(strategy)[0];    // session, basic, etc
        let auth = Authentication.get(security.app, method);

        if (!auth) {
          rm = (new TravelMessage({status: 400, data: {message: 'No Strategy Route Specified'}})).toResponse();
          break;
        }

        rm = await auth(req, security, strategy[method]);

        if (rm.status == 200) break;
      }

      return rm;
    }

    const testRoles = function(userGroup) {
      if (routeInfo.app && routeInfo.version && routeInfo.subapp && routeInfo.id) {
        return Authorization.canUserAccess(routeInfo.app, routeInfo.version, routeInfo.subapp, routeInfo.id, userGroup);
      }

      return false;
    }

    // no security = 404, no strategies = open access
    if (!routeInfo) {
      rm.status = 404;
      return rm;
    }

    if (req.method == 'OPTIONS') {
      if (!routeInfo.allowCORS) {
        rm.data = 'CORS not supported for this request';
        rm.status = 401;
      }
      else {
        rm = routeInfo.CORSInfo.fn(req);
      }

      return rm;
    }

    if (security === false || security.strategies.length == 0) return rm;

    rm = await testStrategies();

    if (rm.status == 200) {
      if (!testRoles(rm.data.user.group)) {
        // no access
        rm = (new TravelMessage({status: 400, data: {message:'Insufficient Privilege'}})).toResponse();
      }      
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