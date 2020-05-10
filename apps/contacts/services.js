const root = process.cwd();
const fs = require("fs");
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {NunjucksError, SystemError} = require(root + '/lib/server/utils/errors.js');
const {CSRF} = require(root + '/apps/login/models.js');
const {Contact} = require(root + '/apps/contacts/models.js');

const path = 'servelets';
const services = {};

const dateFormat = 'MM/DD/YYYY';
const timeFormat = 'hh:mm A';

const makeCSRF = async function(tenant, user) {
  // tenant and user are their codes
  var CSRFToken = uuidv1();
      
  // create CSRF record
  var rec = new CSRF({token: CSRFToken, user: user});
  await rec.insertOne({pgschema: tenant});

  return CSRFToken;
}

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  let name = file.split('.')[0];

  services[name] = require(`./${path}/${file}`);
}

// Any other needed services
services.output = {
  main: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/contacts/views/module.html';

      ctx.CSRFToken = await makeCSRF(req.TID, req.user.code);
      ctx.contact = Contact.getColumnDefns();
      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.TID = req.TID;    

      try {
        tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
        tm.type = 'html';
      }
      catch(err) {
        tm.err = new NunjucksError(err);
      }
    }
    catch(err) {
      tm.err = new SystemError(err);
    }

    return tm;
  },
}

module.exports = services;