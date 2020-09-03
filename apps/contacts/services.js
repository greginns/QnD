const root = process.cwd();
const fs = require("fs");
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {CSRF} = require(root + '/apps/login/models.js');
const {Contact, Title, Group} = require(root + '/apps/contacts/models.js');

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
      let tmpl = 'apps/contacts/modules/main/module.html';
      //let rando1 = Math.round(Math.random() * 10000000);
      //let rando2 = Math.round(Math.random() * 10000000);
      //let rando3 = Math.round(Math.random() * 10000000);

      ctx.CSRFToken = await makeCSRF(req.TID, req.user.code);
      ctx.contact = Contact.getColumnDefns();
      ctx.title = Title.getColumnDefns();
      ctx.group = Group.getColumnDefns();
      //ctx.contactSearch = Contact.getColumnDefns(rando1);
      //ctx.contactCreate = Contact.getColumnDefns(rando2);
      //ctx.contactUpdate = Contact.getColumnDefns(rando3);
      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.TID = req.TID;    

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