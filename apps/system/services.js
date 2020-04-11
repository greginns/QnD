const root = process.cwd();
const fs = require('fs').promises;
const {TravelMessage} = require(root + '/server/utils/messages.js');
const {Error404} = require(root + '/server/utils/errors.js');

module.exports = {
  getFavicon: async function(req) {
    let tm = new TravelMessage();

    try {
      tm.data = await fs.readFile(root + '/favicon.ico');  
      tm.type = 'icon';
    }
    catch(err) {
      tm.err = new Error404();
    }

    return tm;
  }
};