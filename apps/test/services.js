const root = process.cwd();
const nunjucks = require('nunjucks');

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {NunjucksError} = require(root + '/lib/server/utils/errors.js');
/*
const {CSRF} = require(root + '/apps/timeclock/models/models.js');

const makeCSRF = async function(tenant, user) {
  // tenant and user are their codes, not objects
  var CSRFToken = uuidv1();
      
  // create CSRF record
  var rec = new CSRF({token: CSRFToken, user: user});
  await rec.insertOne({pgschema: tenant});

  return CSRFToken;
}
*/
module.exports = {
  output: {
    main: async function(req) {
      // Test Page
      let ctx = {};
      let nj;
      let tm = new TravelMessage();

      ctx['CSRF_Token'] = 'Temp-Token';
      
      try {
        nj = nunjucks.configure([root], {autoescape: true});
        tm.data = nj.render('apps/test/views/module.html', ctx);
        tm.type = 'html';
      }  
      catch(err) {
        tm.err = new NunjucksError(err);
      }

      return tm;
    },
  }
};