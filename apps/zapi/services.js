/* Needs lots of error trapping and logging */
const root = process.cwd();
const fs = require("fs");

const adminServices = require(root + '/apps/admin/services.js');
const {send} = require(root + '/lib/server/utils/send.js');
const {SendMessage} = require(root + '/lib/server/utils/messages.js');
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');

const path = 'servelets';
const services = {};

const postToZapier = async function(body, options) {
  let sm = new SendMessage({body, options});
  return await send(sm);  
};

const saveZapstat = async function({tenant='', app='', subapp='', event='', body='', options={}, success, retries, result} = {}) {
  // save info to Zapstat
  let added = new Date();
  let rec = {app, subapp, event, body, options, added, success, retries, result};

  return await services.zapstat.create({pgschema: tenant, rec});
};

const saveZapq = async function(tenant, rec) {
  // save Zapq record, either create or update.  
  if ('id' in rec) {
    return await services.zapq.update({pgschema: tenant, id: rec.id, rec});
  }
  else {
    return await services.zapq.create({pgschema: tenant, rec});
  }
};

const deleteZapq = async function(tenant, id) {
  return await services.zapq.delete({pgschema: tenant, id});
};

// get servlet routines
for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  let name = file.split('.')[0];

  services[name] = require(`./${path}/${file}`);
}

// Any other needed services
services.init = async function() {
  // get all zapsubs, for all tenants, and send to Zouter
  let tm = await adminServices.tenant.get();
  let tenants = tm.data;

  for (let tenant of tenants) {
    if (tenant.code != 'G5') {   // *** Remove
      let tm = await services.zapsub.getAll({pgschema: tenant.code});
      let rows = tm.data;

      for (let row of rows) {
        services.initOne(tenant.code, row);
      }
    }
  }
}

services.initOne = function(tenant, row) {
  Zouter.route(tenant, row);
}

services.deinitOne = function(tenant, id) {
  Zouter.unroute(tenant, id);
}

services.subscribe = async function({pgschema = '', rec = {}} = {}) {
  // create Zapsub row
  let tm = await services.zapsub.create({pgschema, rec});

  if (tm.isGood()) {
    services.deinitOne(pgschema, tm.data.id);
    services.initOne(pgschema, tm.data);
  }

  return tm;
}

services.unsubscribe = async function({pgschema = '', id = ''} = {}) {
  // delete Zapsub row
  let tm = await services.zapsub.delete({pgschema, id});

  if (tm.status == 200) {
    services.deinitOne(pgschema, id);
  }
  
  return tm;
}

services.try = async function(tenant, app, subapp, event, body, options) {
  let res = await postToZapier(body, options);
  
  if (res.status != 200) {
    // failed, save for retry
    let now = new Date();
    let then = new Date(); 
    then.setMinutes(then.getMinutes()+1);
    let rec = {app, subapp, event, body, options, added: now, runat: then, retries: 0, result: res.data};

    await saveZapq(tenant, rec);
  }
  else {
    // made it!  This should be the norm.
    await saveZapstat({tenant, app, subapp, event, body, options, success: true, retries: 0, result: res.data});
  }
}

// runat would be +1, +1, +2, +3, +4
services.retry = async function() {
  var fn = async function() {
    let tm = await adminServices.tenant.get();
    let tenants = tm.data;
  
    for (let tenant of tenants) {
      if (tenant.code != 'G5') {   // *** Remove
        let now = new Date();
        let tm = await services.zapq.getAll({pgschema: tenant.code});   // should really be a query using runat
        let rows = tm.data;
  
        for (let row of rows) {
          if (row.runat <= now) {
            let res = await postToZapier(row.body, row.options);

            if (res.status != 200) {
              // failed
              // increment retries, runat
              // max 5 retries
              if (row.retries < 5) {
                // save new failure result
                let runat = new Date();
                let rec = {id: row.id};
  
                rec.retries = row.retries+1;
                rec.result = res.data;
                
                runat.setMinutes(runat.getMinutes() + rec.retries);
                rec.runat = runat;

                await saveZapq(tenant.code, rec);
              }
              else {
                // total fail after 5 tries
                await saveZapstat({tenant: tenant.code, app: row.app, subapp: row.subapp, event: row.event, body: row.body, options: row.options, success: false, retries: row.retries, result: res.data});
                await deleteZapq(tenant.code, row.id);
              }
            }
            else {
              // success
              await saveZapstat({tenant: tenant.code, app: row.app, subapp: row.subapp, event: row.event, body: row.body, options: row.options, success: true, retries: row.retries++, result: res.data});
              await deleteZapq(tenant.code, row.id);
            }

          }
        }
      }
    }

    //setTimeout(fn, 60000);
  }

  setTimeout(fn, 0);
}

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

// fire up retry, forever!
services.retry();

module.exports = services;