/*
  Manage WS connections, multiple messages per connection.
  For websocket notifications when tables are changed
  Accepts (un)subscribes for model events - for now.

  Message format: {cat: sub|unsub, source: model, model}
*/
const root = process.cwd();
const uuidv1 = require('uuid/v1');

const {modelEvents} = require(root + '/lib/server/utils/events.js');
const WSclients = new Map();  // all ws connections

class Wouter {
  constructor(ws, TID, userID) {
    this.wsID = uuidv1();  // unique connection id
    this.ws = ws;
    this.TID = TID;
    this.userID = userID;
    this.handlers = new Map();

    WSclients.set(this.wsID, {ws, TID});
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
    let rc = true, hndlr, key;

    switch (msg.source) {
      case 'model':
        hndlr = new WSModelEvent(this.ws, this.TID, msg.model);
        key = msg.source + '.' + this.TID + '.' + msg.model

        this.handlers.set(key, hndlr);
        break;

      default:
        rc = false;
    }

    return rc;
  }

  unsubscribe(msg) {
    let key; 

    switch (msg.source) {
      case 'model':
        key = msg.source + '.' + this.TID + '.' + msg.model;

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
  constructor(ws, TID, model) {
    this.ws = ws;
    this.TID = TID;
    this.model = model;

    this.topic = `${this.TID}.${this.model}`;

    this.publish = this.publish.bind(this);

    this.register();
  }

  register() {
    modelEvents.on(this.topic, this.publish);
  }

  unregister() {
    modelEvents.off(this.topic, this.publish);
  }

  list() {
    console.log(modelEvents.listenerCount(this.topic))
  }

  publish(info) {
    let xmit = JSON.stringify({cat: 'pub', source: 'model', model: this.model, action: info.action, rows: info.rows});

    this.ws.send(xmit);
  }
}

module.exports = {
  Wouter,
  WSclients
}