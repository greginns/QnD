const root = process.cwd();
const fs = require("fs");
const nunjucks = require('nunjucks');
const uuidv1 = require('uuid/v1');

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
    var ctx = {};
    var nj;
    var tm = new TravelMessage();

    try {
      ctx.CSRFToken = await makeCSRF(req.TID, req.user.code);
      ctx.contact = Contact.getColumnDefns();
      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.TID = req.TID;

      try {
        nj = nunjucks.configure([root], { autoescape: true });
        tm.data = nj.render('apps/contacts/views/module.html', ctx);
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