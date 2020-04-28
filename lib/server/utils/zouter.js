const root = process.cwd();
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {send} = require(root + '/lib/server/utils/send.js');
const {SendMessage} = require(root + '/lib/server/utils/messages.js');

class Zouter {
  constructor() {
  }

  static route(tenant, zapRow) {
    // subscribe a whole Zapsubs row
    let events = zapRow.events;
    let url = zapRow.url;
    let app = zapRow.app;

    for (let event of Object.keys(events)) {
      if (events[event]) {
        this.subscribe(tenant, app, event, url, id);
      }
    }
  }

  static unroute(id) {
    // unsubscribe a whole Zapsubs row
    zapPubsub.unsubscribeAll(id);
  }

  static subscribe(tenant, app, event, url, id) {
    let topic = `${tenant}.${app}.${event}`;

    zapPubsub.subscribe(topic, id, async function(body) {
      let options = {url};
      let sm = new SendMessage(body, options);
      let res = await send(sm);
console.log(res)      
    })
  }
}

module.exports = {
  Zouter,
}