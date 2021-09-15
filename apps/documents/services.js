const root = process.cwd();
const fs = require('fs').promises;
const uuidv1 = require('uuid/v1');
const puppeteer = require('puppeteer');

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

// Services override class
class ModelService1 extends ModelService {
  async getOne({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = this.model.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }

    // Get doctypes
    if ('id' in rec && rec.id == '_doctypes') {
      let tm = new TravelMessage();

      let file = root + '/apps/documents/examples/doctypes.json';
      let text = '';

      try {
        text = await fs.readFile(file);
      }
      catch(e) {
        console.log(e)
      }

      tm.data = text.toString();
      tm.type = 'text';

      return tm;
    }

    // Get example
    if ('id' in rec && rec.id.substr(0,1) == '_') {
      let tm = new TravelMessage();

      let doctype = rec.id.substr(1);
      let file = root + '/apps/documents/examples/' + doctype + '.html';
      let text = '';

      try {
        text = await fs.readFile(file);
      }
      catch(e) {
        console.log(e)
      }

      tm.data = text.toString();
      tm.type = 'text';

      return tm;
    }

    return await this.model.selectOne({database, pgschema, pks: [rec.id] });
  }
}

// Model services
services.docsetup = new ModelService({model: models.Docsetup});
services.document = new ModelService1({model: models.Document});
services.docletter = new ModelService1({model: models.Docletter});

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
      let tmpl = 'apps/documents/modules/setup/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.docsetup = models.Docsetup.getColumnDefns();
      ctx.document = models.Document.getColumnDefns();
      ctx.docletter = models.Docletter.getColumnDefns();

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

services.puppeteer = {
  html2pdf: async function(req) {
    const tm = new TravelMessage();
    const html = req.body.html;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.setContent(html);
    let pdf = await page.pdf();

    tm.data = pdf;
    tm.type = 'pdf';

    return tm;    
  }
}

module.exports = services;