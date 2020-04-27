const root = process.cwd();
const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const uuidv1 = require('uuid/v1');
const config = require(root + '/config.json');

const mw = {}
mw.request = require(root + '/lib/server/middleware/request.js');
mw.security = require(root + '/lib/server/middleware/security.js');
mw.reply = require(root + '/lib/server/middleware/reply.js');

const {Router} = require(root + '/lib/server/utils/router.js');
const {Wouter} = require(root + '/lib/server/utils/wouter.js');
const sqlUtil = require(root + '/lib/server/utils/sqlUtil.js');
const {modelPubsub} = require(root + '/lib/server/utils/pubsubs.js');

const WSclients = new Map();

const options = {
  key: fs.readFileSync('./private.key'),
  ca: fs.readFileSync('./ca_bundle.crt'),
  cert: fs.readFileSync('./certificate.crt')
};

//const server = http.createServer();
//const wss = new WebSocket.Server({server, maxPayload: 50000, clientTracking: false});
//const wss = new WebSocket.Server({noServer: true, maxPayload: 50000, clientTracking: false});

const sslServer = https.createServer(options);
//const wssl = new WebSocket.Server({server: sslServer, maxPayload: 50000, clientTracking: false});
const wssl = new WebSocket.Server({noServer: true, maxPayload: 50000, clientTracking: false});

for (app of config.apps) {
  require(root + `/apps/${app}/routes.js`);  // process app routes.
};

// PROCESS ERRORS
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

// SETUP HTTPS/WSS SERVERS
const serverRequest = async function(req, res) {
  var rm;

  try {
    // Middleware - decorates req, res 
    await mw.request.process(req, res);
    await mw.security.check(req, res);

    // Routes - communicate via params and response message
    rm = await Router.go(req, res)
  }
  catch(erm) {
    //console.log(erm);
    rm = erm;
  }

  mw.reply.reply(res, rm);
};

const serverUpgrade = async function(req, socket, head) {
  await mw.request.processWS(req);

  let tm = await mw.security.checkWS(req);
  let {tenant, user} = tm.data;

  if (!user) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, function(ws) {
    wss.emit('connection', socket, ws, tenant.code, user.id);
  });
};

const sslServerUpgrade = async function(req, socket, head) {
  await mw.request.processWS(req);

  let tm = await mw.security.checkWS(req);
  let {tenant, user} = tm.data;

  if (!user) {
    socket.destroy();
    return;
  }

  wssl.handleUpgrade(req, socket, head, function(ws) {
    wssl.emit('connection', socket, ws, tenant.code, user.id);
  });
};

const wsConnect = function(socket, ws, TID, userID) {
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
};

//server
//.on('request', serverRequest)
//.on('upgrade', serverUpgrade)
//.listen(config.server.port);

sslServer
.on('request', serverRequest)
.on('upgrade', sslServerUpgrade)
.listen(config.server.sslport);

//wss
//.on('connection', wsConnect);

wssl
.on('connection', wsConnect);
  
// CHECK IF WS ARE STILL ALIVE
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

// ZAP SUBS
modelPubsub.subscribe('gm./contacts/contact', '', function(info) {
  console.log('PUBSUB', info);
});

// GIDDY UP!
//console.log('GO! on ' + config.server.port);
console.log('GO! on ' + config.server.sslport);

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
