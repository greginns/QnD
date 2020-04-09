const root = process.cwd();
const nunjucks = require('nunjucks');

const {TravelMessage} = require(root + '/server/utils/messages.js');
const {NunjucksError} = require(root + '/server/utils/errors.js');

module.exports = {
  output: {
    main: async function(req) {
      // Test Page
      var ctx = {};
      var nj;
      var tm = new TravelMessage();
      
      try {
        nj = nunjucks.configure([root], {autoescape: true});
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