const root = process.cwd();
const {TravelMessage} = require(root + '/server/utils/messages.js');
const {RouterMessage} = require(root + '/server/utils/router.js');
const {Error404} = require(root + '/server/utils/errors.js');

Router.add(new RouterMessage({
  method: 'get',
  path: '404', 
  fn: async function(req, res) {
    var tm = new TravelMessage({data: '', status: 404, err: new Error404()});

    return tm.toResponse();
  }, 
  options: {needLogin: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/favicon.ico', 
  fn: async function(req, res) {
    var tm = new TravelMessage();

    try {
      tm.data = await fs.readFile(root + '/favicon.ico');  
      tm.type = 'icon';
    }
    catch(err) {
      tm.err = new Error404();
    }
    
    return tm.toResponse();
  }, 
  options: {needLogin: false, bypassUser: true}
}));
