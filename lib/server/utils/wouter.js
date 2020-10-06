/*
  Manage WS connections, multiple messages per connection.
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
    this.msgHistory = [];

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
    let rc = true, topic;
console.log('subscribe', msg, this.wsID)
    switch (msg.source) {
      case 'model':
        topic = `${this.TID}.${msg.model}`;

        modelEvents.on(topic, this.modelPublish.bind(this, msg));

        this.messageRecord({cat: msg.cat, source: msg.source, model: msg.model, TID: this.TID});        
        break;

      default:
        rc = false;
    }

    return rc;
  }

  unsubscribe(msg) {
    let topic; 

    switch (msg.source) {
      case 'model':
        topic = `${this.TID}.${msg.model}`;

        this.messageUnrecord({cat: 'sub', source: msg.source, model: msg.model, TID: this.TID});

        //modelEvents.off(topic, this.modelPublish.bind(this)); // Doesn't work, due to the bind
        modelEvents.removeAllListeners(topic);
        break;
    }
  }

  unsubscribeAll() {
    // WS connection is gone, get rid of all events
    for (let obj of this.msgHistory) {
      this.unsubscribe(obj);
    }

    this.msgHistory = [];

    modelEvents.removeAllListeners();
  }

  modelPublish(msg, info) {
    let xmit = JSON.stringify({cat: 'pub', source: 'model', model: msg.model, action: info.action, rows: info.rows});
console.log(this.wsID, xmit)
    this.ws.send(xmit);
  }

  messageRecord(obj) {
    this.msgHistory.push(obj);
  }

  messageUnrecord(obj) {
    for (let entry=0; entry<this.msgHistory.length; entry++) {
      if (Object.keys(this.msgHistory[entry]).length == Object.keys(obj).length) {
        let matched = true;

        for (let key in entry) {
          if (this.msgHistory[entry][key] != obj[key]) {
            matched = false;
            break;
          }
        }

        if (matched) {
          this.msgHistory.splice(entry,1);
          break;
        }
      }
    }
  }
  
}

module.exports = {
  Wouter,
  WSclients
}