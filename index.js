const root = process.cwd();
const http = require('http');
const server = http.createServer();
const WebSocket = require('ws');
const wss = new WebSocket.Server({noServer: true, maxPayload: 50000, clientTracking: false});
const uuidv1 = require('uuid/v1');
const config = require(root + '/config.json');

const mw = {}
mw.request = require(root + '/server/middleware/request.js');
mw.security = require(root + '/server/middleware/security.js');
mw.reply = require(root + '/server/middleware/reply.js');

const {Router} = require(root + '/server/utils/router.js');
const {Wouter} = require(root + '/server/utils/wouter.js');
const sqlUtil = require(root + '/server/utils/sqlUtil.js');
const WSclients = new Map();

for (app of config.apps) {
  require(root + `/apps/${app}/routes.js`);  // process app routes.
};

process
.on('unhandledRejection', (reason, rej) => {
  console.error(reason);
  console.error('There was an uncaught rejection', rej);

  sqlUtil.shutdown();
  process.exit(1) //mandatory (as per the Node docs)
})
.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);

  sqlUtil.shutdown();
  process.exit(1) //mandatory (as per the Node docs)
});

server
.on('request', async function(req, res) {
  var rm;

  try {
    // Middleware - decorates req, res 
    await mw.request.process(req, res);
    await mw.security.check(req, res);

    // Routes - communicate via params and response message
    rm = await Router.go(req, res)
  }
  catch(erm) {
    console.log(erm);
    rm = erm;
  }

  mw.reply.reply(res, rm);
})
.on('upgrade', async function(req, socket, head) {
  await mw.request.processWS(req);

  var [tenant, user] = await mw.security.checkWS(req);

  if (!user) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, function(ws) {
    wss.emit('connection', socket, ws, tenant.code, user.id);
  });
});

wss
.on('connection', function(socket, ws, TID, userID) {
  // record clients 
  const wsID = uuidv1();
  
  ws.isAlive = true;
  WSclients.set(wsID, {ws, TID});
  
  ws.on('pong', function() {
    ws.isAlive = true;
  });
  
  ws.on('close', function() {
    // unsubscribe
    Wouter.unroute(wsID);
    WSclients.delete(wsID);
  });
  
  ws.on('message', function message(msg) {
    if (!Wouter.route(msg, wsID, TID, WSclients)) {
      // invalid message
      ws.terminate();
      //socket.destroy();
    }
  });
});
  
setInterval(function() {
  for (var wsObj of WSclients.values()) {
    if (!wsObj.ws.isAlive) { 
      wsObj.ws.terminate(); 
      return; 
    }
    
    wsObj.ws.isAlive = false;
    wsObj.ws.ping();
  }
}, 30000);


server.listen(config.server.port);
console.log('GO! on ' + config.server.port);

/*
if(this.limitCounter >= Socket.limit) {
  if(this.burstCounter >= Socket.burst) {
     return 'Bucket is leaking'
  }
  ++this.burstCounter
  return setTimeout(() => {
  this.verify(callingMethod, ...args)
  setTimeout(_ => --this.burstCounter, Socket.burstTime)
  }, Socket.burstDelay)
}
++this.limitCounter

For example, if you’re using WS library for Node for creating websockets on server, you can use the maxPayload option to specify the maximum payload size in bytes. 
*/

/* VERIFY
  // USAGE
  Object.keys(models['tenant']).forEach(function(model) {
    models['tenant'][model].doManagers();
  });

  Object.keys(models['public']).forEach(function(model) {
    models['public'][model].doManagers();
  });
  
  var x = new models.tenant.Employee({code: 'E1', first: 'Greg'});
  console.log(x.toObject())
  x.getDepartments(pgschema)  
*/
