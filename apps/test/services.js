const root = process.cwd();
const fs = require('fs').promises;
const nunjucks = require('nunjucks');
const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt');

const sqlUtil = require(root + '/server/utils/sqlUtil.js');
const migration = require(root + '/server/utils/migration.js');
const {UserError, NunjucksError, InvalidUserError, JSONError} = require(root + '/server/utils/errors.js');
const {TravelMessage} = require(root + '/server/utils/messages.js');
const config = require(root + '/config.json');
const pgschema = 'public';

module.exports = {
  output: {
    main: async function(req) {
      // Test Page
      var ctx = {};
      var nj;
      var tm = new TravelMessage();
      
      try {
        nj = nunjucks.configure([root], { autoescape: true });
        tm.data = nj.render('apps/test/views/test.html', ctx);
        tm.type = 'html';
      }  
      catch(err) {
        tm.err = new NunjucksError(err);
      }

      return tm;
    },
  }
};