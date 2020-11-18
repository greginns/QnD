const root = process.cwd();
const fs = require('fs');
//const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const config = require(root + '/config.json');

const mw = {}
mw.request = require(root + '/lib/server/middleware/request.js');
mw.security = require(root + '/lib/server/middleware/security.js');
mw.reply = require(root + '/lib/server/middleware/reply.js');

const {Router} = require(root + '/lib/server/utils/router.js');
const {Wouter, WSclients} = require(root + '/lib/server/utils/wouter.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const sqlUtil = require(root + '/lib/server/utils/sqlUtil.js');
//const zapiServices = require(root + '/apps/zapi/services.js');

const options = {
  key: fs.readFileSync('./private.key'),
  ca: fs.readFileSync('./ca_bundle.crt'),
  cert: fs.readFileSync('./certificate.crt')
};

const sslServer = https.createServer(options);
const wssl = new WebSocket.Server({noServer: true, maxPayload: 50000, clientTracking: false});
const WSCHECKINTERVAL = 30000;

for (let app of config.apps) {
  require(root + `/apps/${app}/routes.js`);  // process app routes.
}

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
const wsConnect = function(socket, ws, TID, userID) {
  // setup wouter
  const wouter = new Wouter(ws, TID, userID);

  ws.isAlive = true;
    
  ws.on('pong', function() {
    // client ponged us
    ws.isAlive = true;
  });
  
  ws.on('close', function() {
    wouter.kill();
  });
  
  ws.on('message', function message(text) {
    // message from browser
    if (!wouter.handleMessage(text)) {
      // invalid message
      ws.terminate();
      //socket.destroy();
    }
  });
};

const sslServerRequest = async function(req, res) {
  let rm;

  try {
    // Middleware 
    // process augments req, res 
    await mw.request.process(req, res);

    // Routes - augments res with tenant/user.  tests user authentication/authorization
    rm = await mw.security.check(req, res);

    if (rm.status == 200) {
      rm = await Router.go(req, res)
    }    
  }
  catch(err) {
    console.log(err)      
    rm = (new TravelMessage({status: 500, data: err})).toResponse();
  }

  mw.reply.reply(res, rm);
};

const sslServerUpgrade = async function(req, socket, head) {
  // server upgrading to WS
  await mw.request.processWS(req);

  let {tenant, user} = await mw.security.checkWS(req);

  if (!user) {
    socket.destroy();
    return;
  }

  wssl.handleUpgrade(req, socket, head, function(ws) {
    wsConnect(socket, ws, tenant.code, user.code);
  });
};

sslServer
.on('request', sslServerRequest)
.on('upgrade', sslServerUpgrade)
.listen(config.server.sslport);

// CHECK IF WS ARE STILL ALIVE
setInterval(function() {
  for (let wsObj of WSclients.values()) {
    if (!wsObj.ws.isAlive) { 
      wsObj.ws.terminate(); 
      return; 
    }
    
    wsObj.ws.isAlive = false;
    wsObj.ws.ping();
  }
}, WSCHECKINTERVAL);

//zapiServices.init();  // Subscribe all zap events for all tenants

// GIDDY UP!
//console.log('GO! on ' + config.server.port);
console.log('GO! on ' + config.server.sslport);

/* leftover from http 

//const server = http.createServer();
//const wss = new WebSocket.Server({server, maxPayload: 50000, clientTracking: false});
//const wss = new WebSocket.Server({noServer: true, maxPayload: 50000, clientTracking: false});
//const wssl = new WebSocket.Server({server: sslServer, maxPayload: 50000, clientTracking: false});

const serverUpgrade = async function(req, socket, head) {
  await mw.request.processWS(req);

  let {tenant, user} = await mw.security.checkWS(req);

  if (!user) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, function(ws) {
    wss.emit('connection', socket, ws, tenant.code, user.id);
  });
};

//server
//.on('request', serverRequest)
//.on('upgrade', serverUpgrade)
//.listen(config.server.port);

//wss
//.on('connection', wsConnect);

//wssl
//.on('connection', wsConnect);
*/



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
