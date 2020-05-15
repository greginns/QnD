const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const services = require(root + '/apps/zapi/services.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const version = 'v1';

Router.add(new RouterMessage({
  method: 'post',
  app,
  version,
  path: '/:app/:subapp/:event/hooks', 
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
  version,
  path: '/:app/:subapp/hooks/:id', 
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