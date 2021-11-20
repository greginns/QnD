const root = process.cwd();
const fs = require('fs').promises;
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');
const config = require(root + '/config.json');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {send} = require(root + '/lib/server/utils/send.js');
const {TravelMessage, SendMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {ModelService} = require(root + '/lib/server/utils/services.js');
const {CSRF} = require(root + '/apps/login/models.js');

const app = getAppName(__dirname);
const services = {};

const models = require(root + `/apps/${app}/models.js`);

const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'h:mm A';

const makeCSRF = async function(database, pgschema, user) {
  var CSRFToken = uuidv1();
      
  // create CSRF record
  var rec = new CSRF({token: CSRFToken, user: user});

  await rec.insertOne({database, pgschema});

  return CSRFToken;
}

// Model services
services.main = new ModelService({model: models.Main});

services.discount = new ModelService({model: models.Discount});
services.cancreas = new ModelService({model: models.Cancreas});

// Any other needed services
services.query = function({database = '', pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({database, pgschema, query, app, values});
}

services.output = {
  main: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/reservations/modules/res/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.main = models.Main.getColumnDefns();

      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.USER = JSON.stringify(req.session.user);

      try {
        tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
        tm.type = 'html';
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    }
    catch(err) {
      tm.status = 500;
      tm.message = err.toString();
    }

    return tm;
  },

  setup: async function(req) {
    // main setup manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/reservations/modules/setup/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.discount = models.Discount.getColumnDefns();
      ctx.cancreas = models.Cancreas.getColumnDefns();

      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.USER = JSON.stringify(req.session.user);

      try {
        tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
        tm.type = 'html';
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    }
    catch(err) {
      tm.status = 500;
      tm.message = err.toString();
    }

    return tm;
  },
};

module.exports = services;