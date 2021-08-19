const root = process.cwd();
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {modelService} = require(root + '/lib/server/utils/services.js');
const {CSRF} = require(root + '/apps/login/models.js');

const app = 'contacts';
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
services.config = new modelService({model: models.Config});
services.contact = new modelService({model: models.Contact});
services.country = new modelService({model: models.Country});
services.egroup = new modelService({model: models.Egroup});
services.group = new modelService({model: models.Group});
services.postcode = new modelService({model: models.Postcode});
services.region = new modelService({model: models.Region});
services.tag = new modelService({model: models.Tag});
services.tagcat = new modelService({model: models.Tagcat});
services.title = new modelService({model: models.Title});

// Any other needed services
services.query = function({pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({query, app, pgschema, values});
}

services.output = {
  main: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/contacts/modules/main/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.contact = models.Contact.getColumnDefns();
      ctx.title = models.Title.getColumnDefns();
      ctx.group = models.Group.getColumnDefns();
      ctx.egroup = models.Egroup.getColumnDefns();
      ctx.tag = models.Tag.getColumnDefns();
      ctx.tagcat = models.Tagcat.getColumnDefns();

      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.TID = req.TID;    
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
}

module.exports = services;