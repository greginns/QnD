const root = process.cwd();
const {TravelMessage} = require(root + '/server/utils/messages.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const {Error404} = require(root + '/server/utils/errors.js');
const services = require(root + '/apps/system/services.js');
const app = '';

Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '404',
  fn: async function(req, res) {
    var tm = new TravelMessage({data: '', status: 404, err: new Error404()});

    return tm.toResponse();
  }, 
  options: {needLogin: false, bypassUser: true, authApp: ''}
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  path: 'favicon.ico', 
  fn: async function(req, res) {
    let rm = await services.getFavicon(req);

    return rm.toResponse();
  }, 
  options: {needLogin: false, bypassUser: true, authApp: ''}
}));
