const root = process.cwd();
const fs = require('fs').promises;

const {ResponseMessage} = require(root + '/server/utils/messages.js');
const services = require(root + '/apps/test/services.js');
const {Router, RouterMessage} = require(root + '/server/utils/router.js');
const app = 'test';
const authApp = 'test';

// Pages
// Main/Login
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: ['','/','/:etc'], 
  fn: async function(req) {
    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  options: {needLogin: false, needCSRF: false, authApp}
}));

// info rtns
Router.add(new RouterMessage({
  method: 'info',
  app,
  path: '/auth', 
  fn: async function(req) {
    return ['test', false];
  },
}));

Router.add(new RouterMessage({
  method: 'info',
  app,
  path: '/csrf', 
  fn: async function(req) {
    return true;
  },
}));

