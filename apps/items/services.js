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

class CloudService extends ModelService {
  async delete({database = '', pgschema = '', user = {}, pks = {}} = {}) {
    // Delete row
    let tm = new TravelMessage();

    const api_key = config.cloudinary.api_key;
    const api_secret = config.cloudinary.api_secret;
    const url = 'https://api.cloudinary.com/v1_1/roam4/image/destroy';
    const timestamp = (new Date()).valueOf();
    const public_id = pks.path;
    const sorted = `public_id=${public_id}&timestamp=${timestamp}${api_secret}`;
    const signature = crypto.createHash('sha1').update(sorted).digest('hex');
    const body = {
      api_key,
      public_id,
      timestamp,
      signature
    }

    let headers = {};

    let options = {
      url,
      method: 'POST'
    }

    let sm = new SendMessage({headers, body, options});
    let rm = await send(sm);

    console.log(rm);

    if (rm.status != 200) {
      tm.status = rm.status;
      tm.data = rm.data;
      tm.err = rm.err;
      return tm;
    }

    let tobj = new this.model(pks);
    tm = await tobj.deleteOne({database, pgschema, user});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
}

// Model services
services.activity = new ModelService({model: models.Activity});
services.lodging = new ModelService({model: models.Lodging});
services.meals = new ModelService({model: models.Meals});

services.actdaily = new ModelService({model: models.Actdaily});
services.actrates = new ModelService({model: models.Actrates});
services.actprices = new ModelService({model: models.Actprices});
services.actminp = new ModelService({model: models.Actminp});
services.actsched = new ModelService({model: models.Actsched});
services.actphoto = new CloudService({model: models.Actphoto});
services.actinclm = new ModelService({model: models.Actinclm});
services.actreseller = new ModelService({model: models.Actreseller});
services.actgroup = new ModelService({model: models.Actgroup});
services.actres = new ModelService({model: models.Actres});
services.actttot = new ModelService({model: models.Actttot});

services.lodgunit = new ModelService({model: models.Lodgunit});
services.lodgrates = new ModelService({model: models.Lodgrates});
services.lodgprices = new ModelService({model: models.Lodgprices});
services.lodgminp = new ModelService({model: models.Lodgminp});
services.lodgsched = new ModelService({model: models.Lodgsched});
services.lodgphoto = new CloudService({model: models.Lodgphoto});
services.lodginclm = new ModelService({model: models.Lodginclm});
services.lodgreseller = new ModelService({model: models.Lodgreseller});
services.lodglocn = new ModelService({model: models.Lodglocn});
services.lodgtype = new ModelService({model: models.Lodgtype});

services.mealrates = new ModelService({model: models.Mealrates});
services.mealprices = new ModelService({model: models.Mealprices});
services.mealminp = new ModelService({model: models.Mealminp});
services.mealsched = new ModelService({model: models.Mealsched});
services.mealphoto = new CloudService({model: models.Mealphoto});
services.mealreseller = new ModelService({model: models.Mealreseller});
services.meallocn = new ModelService({model: models.Meallocn});
services.mealtype = new ModelService({model: models.Mealtype});

services.area = new ModelService({model: models.Area});
services.glcode = new ModelService({model: models.Glcode});
services.tax = new ModelService({model: models.Tax});
services.waiver = new ModelService({model: models.Waiver});
services.template = new ModelService({model: models.Template});
services.supplier = new ModelService({model: models.Supplier});
services.reseller = new ModelService({model: models.Reseller});
services.pricelevel = new ModelService({model: models.Pricelevel});
services.pmtterms = new ModelService({model: models.Pmtterms});

// Any other needed services
services.query = function({database = '', pgschema = '', user = {}, query = '', values = []}) {
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
      ctx.meals = models.Meals.getColumnDefns();

      ctx.actdaily = models.Actdaily.getColumnDefns();
      ctx.actrates = models.Actrates.getColumnDefns();
      ctx.actinclm = models.Actinclm.getColumnDefns();
      ctx.actgroup = models.Actgroup.getColumnDefns();
      ctx.actres = models.Actres.getColumnDefns();
      ctx.actttot = models.Actttot.getColumnDefns();

      ctx.lodgunit = models.Lodgunit.getColumnDefns();
      ctx.lodgrates = models.Lodgrates.getColumnDefns();
      ctx.lodginclm = models.Lodginclm.getColumnDefns();
      ctx.lodglocn = models.Lodglocn.getColumnDefns();
      ctx.lodgtype = models.Lodgtype.getColumnDefns();
      
      ctx.meallocn = models.Meallocn.getColumnDefns();
      ctx.mealtype = models.Mealtype.getColumnDefns();
      ctx.mealrates = models.Mealrates.getColumnDefns();

      ctx.area = models.Area.getColumnDefns();
      ctx.glcode = models.Glcode.getColumnDefns();
      ctx.tax = models.Tax.getColumnDefns();
      ctx.waiver = models.Waiver.getColumnDefns();
      ctx.template = models.Template.getColumnDefns();
      ctx.supplier = models.Supplier.getColumnDefns();
      ctx.reseller = models.Reseller.getColumnDefns();
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

  test: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/items/modules/setup/test.html';

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