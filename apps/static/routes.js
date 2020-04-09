const root = process.cwd();

const services = require(root + '/apps/static/services.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const app = 'static';
const authApp = '';
const options = {needLogin: false, needCSRF: false, bypassUser: true, authApp};

// Pages
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: ['/apps/static/js/:fn', '/apps/test/views/js/:fn', '/apps/test/views/:fn', '/client/mvc-addons/js/:fn'],
  fn: async function(req) {
    var tm = await services.getResource(req);
  
    return tm.toResponse();
  }, 
  options
}));
