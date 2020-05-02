const root = process.cwd();
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {send} = require(root + '/lib/server/utils/send.js');
const {SendMessage} = require(root + '/lib/server/utils/messages.js');

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
      let options = {url};
      let sm = new SendMessage({body, options});
      let res = await send(sm);
console.log(res)      
    })
  }
}

module.exports = {
  Zouter,
}

/*
 data: {
   id: '9ae1c7d1-7217-4d6a-a3c3-7829674b0cf8',
   request_id: '5eaa1703-2a41-4c0c-be2f-91b0ad632d30',
   attempt: '5eaa1703-2a41-4c0c-be2f-91b0ad632d30',
   status: 'success'
 },
 */