const root = process.cwd();
const fs = require('fs').promises;

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Error404} = require(root + '/lib/server/utils/errors.js');

/*
  /static is an app that can get a file in any folder
  provided the routes have been setup.
  syntax: /static/path/to/file.ft
*/

module.exports = {
  getResource: async function(req) {
    let tm = new TravelMessage();
    let urlParts = req.parsedURL.pathname.split('/');
    let url, ft;

    urlParts.shift();  // get rid of ""
    urlParts.shift();  // get rid of app (static)  
    urlParts.shift();  // get rid of version

    url = urlParts.join('/');
    ft = req.params.fn.split('.').pop();  // pop off ft
    
    try {
      tm.data = await fs.readFile(root + '/' + url);  
      tm.type = ft;
    }
    catch(err) {
      tm.err = new Error404();
    }

    return tm;
  },

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
}
