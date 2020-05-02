const root = process.cwd();

const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const services = require(root + '/apps/zapi/services.js');
const app = 'zapi';

Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/v1/:app/:subapp/hooks', 
  fn: async function(req) {
    let body = req.body;
    let rec = {};
    let tm;
// delete first, in case

    rec.app = req.params.app;
    rec.subapp = req.params.subapp;
    rec.events = {create: body.create || false, update: body.update || false, delete: body.delete || false, renumber: body.renumber || false};
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
  path: '/v1/:app/:subapp/hooks/:id', 
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