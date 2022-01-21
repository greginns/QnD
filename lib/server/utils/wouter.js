/*
  Manage WS connections, multiple messages per connection.
  For websocket notifications when tables are changed
  Accepts (un)subscribes for model events - for now.

  Message format: {cat: sub|unsub, source: model, model}
*/
const root = process.cwd();
const uuidv4 = require('uuid/v4');

const {modelEvents} = require(root + '/lib/server/utils/events.js');
const WSclients = new Map();  // all ws connections

class Wouter {
  constructor(ws, sessdata) {
    this.wsID = uuidv4();  // unique connection id
    this.ws = ws;
    this.database = sessdata.data.database;
    this.pgschema = sessdata.data.pgschema;
    this.handlers = new Map();

    WSclients.set(this.wsID, {ws, database: this.database, pgschema: this.pgschema});
  }

  handleMessage(text) {
    let msg = JSON.parse(text);
    let rc = true;

    switch(msg.cat) {
      case 'sub':
        rc = this.subscribe(msg);
        break;

      case 'unsub':
        this.unsubscribe(msg);
        break;
        
      default:
        rc = false;
    }

    return rc;
  }

  kill() {
    WSclients.delete(this.wsID);
    
    this.unsubscribeAll();
  }

  subscribe(msg) {
    let rc = true, hndlr, key, database, pgschema;

    switch (msg.source) {
      case 'model':
        database = msg.database || this.database;
        pgschema = msg.pgschema || this.pgschema;
        key = `${msg.source}.${database}.${pgschema}.${msg.model}`;
        hndlr = new WSModelEvent(this.ws, database, pgschema, msg.model);

        this.handlers.set(key, hndlr);
        break;

      default:
        rc = false;
    }

    return rc;
  }

  unsubscribe(msg) {
    let key, database, pgschema; 

    switch (msg.source) {
      case 'model':
        database = msg.database || this.database;
        pgschema = msg.pgschema || this.pgschema;
        key = `${msg.source}.${database}.${pgschema}.${msg.model}`;

        if (this.handlers.has(key)) {
          let hndlr = this.handlers.get(key);
    
          hndlr.unregister();
    
          this.handlers.delete(key);
        }    

        break;
    }
  }

  unsubscribeAll() {
    // WS connection is gone, get rid of all events
    this.handlers.forEach(function(hndlr) {
      hndlr.unregister();
    })

    this.handlers.clear();
  }
}

class WSModelEvent {
  // handle(notify clients) model events: insert, update, delete.
  constructor(ws, database, pgschema, model) {
    this.ws = ws;
    this.database = database;
    this.pgschema = pgschema;
    this.model = model;   //  /app/model

    this.topic = `${this.database}.${this.pgschema}.${this.model}`;

    this.publish = this.publish.bind(this); // to get proper reference to function for unregistering

    this.register();
  }

  register() {
    modelEvents.on(this.topic, this.publish);
console.log('register', this.topic)    
  }

  unregister() {
    modelEvents.off(this.topic, this.publish);
  }

  list() {
    console.log(modelEvents.listenerCount(this.topic))
  }

  publish(info) {
    let xmit = JSON.stringify({cat: 'pub', source: 'model', model: this.model, action: info.action, rows: info.rows});
//console.log('publish', xmit)
    this.ws.send(xmit);
  }
}

module.exports = {
  Wouter,
  WSclients
}