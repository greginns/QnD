const root = process.cwd();
const fs = require('fs').promises;
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
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
services.activity = new ModelService({model: models.Activity});
services.lodging = new ModelService({model: models.Lodging});

services.actdaily = new ModelService({model: models.Actdaily});
services.actrates = new ModelService({model: models.Actrates});
services.actgroup = new ModelService({model: models.Actgroup});
services.actres = new ModelService({model: models.Actres});
services.actttot = new ModelService({model: models.Actttot});

services.lodgunit = new ModelService({model: models.Lodgunit});
services.lodgrates = new ModelService({model: models.Lodgrates});
services.lodglocn = new ModelService({model: models.Lodglocn});
services.lodgtype = new ModelService({model: models.Lodgtype});

services.area = new ModelService({model: models.Area});
services.glcode = new ModelService({model: models.Glcode});
services.tax = new ModelService({model: models.Tax});
services.waiver = new ModelService({model: models.Waiver});
services.pricelevel = new ModelService({model: models.Pricelevel});
services.pmtterms = new ModelService({model: models.Pmtterms});

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
      let tmpl = 'apps/items/modules/setup/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.activity = models.Activity.getColumnDefns();
      ctx.lodging = models.Lodging.getColumnDefns();

      ctx.actdaily = models.Actdaily.getColumnDefns();
      ctx.actrates = models.Actrates.getColumnDefns();
      ctx.actgroup = models.Actgroup.getColumnDefns();
      ctx.actres = models.Actres.getColumnDefns();
      ctx.actttot = models.Actttot.getColumnDefns();

      ctx.lodgunit = models.Lodgunit.getColumnDefns();
      ctx.lodgrates = models.Lodgrates.getColumnDefns();
      ctx.lodglocn = models.Lodglocn.getColumnDefns();
      ctx.lodgtype = models.Lodgtype.getColumnDefns();
      
      ctx.area = models.Area.getColumnDefns();
      ctx.glcode = models.Glcode.getColumnDefns();
      ctx.tax = models.Tax.getColumnDefns();
      ctx.waiver = models.Waiver.getColumnDefns();
      ctx.pricelevel = models.Pricelevel.getColumnDefns();
      ctx.pmtterms = models.Pmtterms.getColumnDefns();

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