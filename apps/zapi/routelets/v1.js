const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');

const services = require(root + '/apps/zapi/services.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const subapp = getSubappName(__filename);
const version = 'v1';

Router.add(new RouterMessage({
  method: 'post',
  app,
  subapp,
  version,
  path: '/:app/:subapp/:event/hooks', 
  id: 'subscribe',
  fn: async function(req) {
    let body = req.body;
    let rec = {};
    let tm;

    rec.app = req.params.app;
    rec.subapp = req.params.subapp;
    rec.event = req.params.event;
    rec.url = body.url;

    tm = await services.subscribe({pgschema: req.TID, rec});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  subapp,
  version,
  path: '/:app/:subapp/hooks/:id', 
  id: 'unsubscribe',
  fn: async function(req) {
    let tm = await services.unsubscribe({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  security: {
    strategies: [
      {basic: {allowAnon: false, needCSRF: false}},
    ],
  } 
}));