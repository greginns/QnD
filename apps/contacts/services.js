const root = process.cwd();
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {ModelService} = require(root + '/lib/server/utils/services.js');
const {CSRF} = require(root + '/apps/login/models.js');
const {exec} = require(root + '/lib/server/utils/db.js');

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
services.associate = new ModelService({model: models.Associate});
services.company = new ModelService({model: models.Company});
services.config = new ModelService({model: models.Config});
services.contact = new ModelService({model: models.Contact});
services.country = new ModelService({model: models.Country});
services.egroup = new ModelService({model: models.Egroup});
services.emailhist = new ModelService({model: models.Emailhist});
services.group = new ModelService({model: models.Group});
services.postcode = new ModelService({model: models.Postcode});
services.region = new ModelService({model: models.Region});
services.tag = new ModelService({model: models.Tag});
services.tagcat = new ModelService({model: models.Tagcat});
services.title = new ModelService({model: models.Title});

// Any other needed services
services.query = function({database = '', pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({database, pgschema, query, app, values});
}

services.storedQuery = function({database = '', pgschema = '', qid = '', values = []}) {
  let query;

  switch(qid) {
    case 'contact-basic':
      query = {
        contacts_Contact: {
          columns: ['*'],
          leftJoin: [
            {contacts_Country: {
              columns: ['name', 'id'],
              fkname: 'country'
            }}
          ],

          where: `"contacts_Contact"."id" = $1`
        }
      };
      break;

      case 'emailhist-basic':
        query = {
          contacts_Emailhist: {
            columns: ['*'],
            leftJoin: [
              {documents_Document: {
                columns: ['name'],
                fkname: 'document'
              }},
              {documents_Docletter: {
                columns: ['name'],
                fkname: 'docletter'
              }},
              {login_User: {
                columns: ['name'],
                fkname: 'user'
              }}
            ],
  
            where: `"contacts_Emailhist"."contact" = $1`
          }
        };
        break;      
  }

  return jsonQueryExecify({database, pgschema, query, app, values});
}

services.output = {
  main: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/contacts/modules/main/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.associate = models.Associate.getColumnDefns();
      ctx.contact = models.Contact.getColumnDefns();
      ctx.group = models.Group.getColumnDefns();
      ctx.egroup = models.Egroup.getColumnDefns();
      ctx.tag = models.Tag.getColumnDefns();
      ctx.tagcat = models.Tagcat.getColumnDefns();
      ctx.title = models.Title.getColumnDefns();

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