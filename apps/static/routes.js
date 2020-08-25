const root = process.cwd();
const services = require(root + '/apps/static/services.js');
const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {Shortcut} = require(root + '/lib/server/utils/rewrite.js');
const config = require(root + '/config.json');
const app = 'static';
const subapp = 'static';
const version = 'v1';

Shortcut.add('~static', 'static/v1/static');

// Pages
Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: '404',
  id: '404',
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
  app,
  subapp,
  version,
  path: '/favicon.ico', 
  id: 'favicon',
  rewrite: true,
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
  subapp,
  version,
  path: '/logo.png', 
  id: 'logo',
  rewrite: true,
  fn: async function(req, res) {
    let rm = await services.getLogo(req);

    return rm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  subapp,
  version,
  path: config.staticFolders,
  id: 'subdirs',
  fn: async function(req) {
    var tm = await services.getResource(req);
  
    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));
