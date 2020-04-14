const root = process.cwd();

const services = require(root + '/apps/static/services.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const app = 'static';
const authApp = '';
const options = {needLogin: false, needCSRF: false, bypassUser: true, authApp};
const routes = [
  '/apps/static/js/:fn', 
  '/apps/test/views/js/:fn', 
  '/apps/admin/views/js/:fn', 
  '/client/widgets/js/:fn'
]

// Pages
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: routes,
  fn: async function(req) {
    var tm = await services.getResource(req);
  
    return tm.toResponse();
  }, 
  options
}));
