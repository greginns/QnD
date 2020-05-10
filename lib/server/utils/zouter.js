const root = process.cwd();
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
console.log('ZOUTER - DO NOT USE')
class Zouter {
  constructor() {
  }

  static route(tenant, zapRow) {
    // subscribe a whole Zapsubs row
    let id = zapRow.id;
    let url = zapRow.url;
    let app = zapRow.app;
    let subapp = zapRow.subapp;
    let events = zapRow.events;

    for (let event of Object.keys(events)) {
      if (events[event] === true) {
        this.subscribe(tenant, app, subapp, event, url, id);
      }
    }
  }

  static unroute(tenant, id) {
    // unsubscribe a whole Zapsubs row
    let tid = tenant + id;

    zapPubsub.unsubscribeAll(tid);
  }

  static subscribe(tenant, app, subapp, event, url, id) {
    let topic = `${tenant}.${app}.${subapp}.${event}`;
    let tid = tenant + id;  // to be unique

    zapPubsub.subscribe(topic, tid, async function(body) {
      let options = {url, method: 'POST'};

      services.try(tenant, app, subapp, event, body, options);
    })
  }
}

module.exports = {
  Zouter,
}