const root = process.cwd();
const services = require(root + '/apps/static/services.js');
const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const app = 'static';
const allowedSubdirs = [
  '/apps/test/views/js/:fn', 
  '/apps/admin/views/js/:fn', 
  '/apps/contacts/views/js/:fn', 
  '/lib/client/widgets/js/:fn',
  '/lib/client/core/:fn', 
]

// Pages
Router.add(new RouterMessage({
  method: 'get',
  app: '',
  path: '404',
  fn: async function(req, res) {
    var tm = new TravelMessage({data: '', status: 404, err: new Error404()});

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app: '',
  path: 'favicon.ico', 
  fn: async function(req, res) {
    let rm = await services.getFavicon(req);

    return rm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  path: allowedSubdirs,
  fn: async function(req) {
    var tm = await services.getResource(req);
  
    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));