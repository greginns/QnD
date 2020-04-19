const root = process.cwd();
const {modelPubsub} = require(root + '/lib/server/utils/pubsub.js');

class Wouter {
  constructor() {
  }

  static route(text, id, tenant, WSclients) {
    var rc = true;
    var msg = JSON.parse(text);

    switch(msg.cat) {
      case 'sub':
        rc = this.subscribe(msg, id, tenant, WSclients);
        break;

      case 'unsub':
        this.unsubscribe(msg, id, tenant, WSclients);
        break;
        
      default:
        rc = false;
    }

    return rc;
  }

  static unroute(id) {
    modelPubsub.unsubscribeAll(id);
  }

  static subscribe(msg, id, tenant, WSclients) {
    let rc = true;

    switch (msg.source) {
      case 'url':
        let topic = `${tenant}.${msg.url}`;

        modelPubsub.subscribe(topic, id, function(info) {
          let oMsg = JSON.stringify({cat: 'pub', source: 'url', url: msg.url, action: info.action, rows: info.rows});

          WSclients.get(id).ws.send(oMsg);
        })

        break;

      default:
        rc = false;
    }

    return rc;
  }

  static unsubscribe(msg, id, tenant) {
    switch (msg.source) {
      case 'url':
        var topic = `${tenant}.${msg.url}`;

        modelPubsub.unsubscribe(topic, id);
        break;
    }
  }
}

module.exports = {
  Wouter,
}