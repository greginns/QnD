const root = process.cwd();
const config = require(root + '/config.json');

const {send} = require(root + '/lib/server/utils/send.js');
const {SendMessage} = require(root + '/lib/server/utils/messages.js');

const schemaModels = require(root + `/apps/schema/models.js`);
const db4adminServices = require(root + `/apps/db4admin/services.js`);

const postToZapier = async function(body, options) {
  console.log(body, options)  
  let sm = new SendMessage({body, options});
  console.log(sm)  
    
  let ret = await send(sm);  
  console.log(ret)
  
  return ret;
};
  
const saveZapstat = async function({database='', pgschema='', source={}, body={}, options={}, success, retries, status='', result} = {}) {
  // save info to Zapstat
  let added = new Date();
  let rec = {source, body, options, added, success, retries, status, result};
  
  let zrec = new schemaModels.zapstat(rec);
  let tm = await zrec.insertOne({database, pgschema})

  return tm;    
};
  
const deleteZapq = async function(database, pgschema, row) {
  let zrec = new schemaModels.zapq(row);

  zrec.deleteOne({database, pgschema});
  return 
};
  
const processResults = async function(res, row, database, pgschema) {
  if (res.status != 200) {
    // failed
    // increment retries, runat
    // max 5 retries
    if (row.retries < 5) {
      // save new failure result
      let runat = new Date();

      row.retries++;
      row.status = res.status;
      row.result = res.data;
      
      runat.setMinutes(runat.getMinutes() + row.retries);
      row.runat = runat;

      let zrec = new schemaModels.zapq(row);
      await zrec.updateOne(database, pgschema);
    }
    else {
      // total fail after 5 tries
      await saveZapstat({database, pgschema, source: row.source, body: row.body, options: row.options, success: false, retries: row.retries, status: res.status, result: res.data});
      await deleteZapq(database, pgschema, row);
    }
  }
  else {
    // success
    await saveZapstat({database, pgschema, source: row.source, body: row.body, options: row.options, success: true, retries: row.retries, status: res.status, result: res.data});
    await deleteZapq(database, pgschema, row);
  }
}

const runLoop = async function() {
  const accts = await db4adminServices.account.getMany({database: 'db4admin', pgschema: 'public'});
  const dbs = [];

  // gather all dbs
  for (let acct of accts.data) {
    for (let db of acct.databases) {
      dbs.push(db);
    }
  }

  // for each db, gather all zapq requests
  for (let db of dbs) {
    let requests = await schemaModels.zapq.select({database: db, pgschema: 'public'});

    for (let request of requests.data) {
      let res = await postToZapier(request.body, request.options);

      await processResults(res, request, db, 'public');
    }
  }
}

runLoop();

/*
services.try = async function(database, pgschema, source, body, options) {
  // Known issue:
  // if a zap is turned off/on, then the post url changes.  If entries are in the queue they'll have the wrong(old) URL
  let res = await postToZapier(body, options);
  
  if (res.status != 200) {
    // failed, save for retry
    let now = new Date();
    let then = new Date(); 
    then.setMinutes(then.getMinutes()+1);
    let rec = {source, body, options, added: now, runat: then, retries: 0, status: res.status, result: res.data};

    await saveZapq(database, pgschema, rec);
  }
  else {
    // made it!  This should be the norm.
    await saveZapstat({database, pgschema, source, body, options, success: true, retries: 0, status: res.status, result: res.data});
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
                rec.status = res.status;
                rec.result = res.data;
                
                runat.setMinutes(runat.getMinutes() + rec.retries);
                rec.runat = runat;

                await saveZapq(tenant.code, rec);
              }
              else {
                // total fail after 5 tries
                await saveZapstat({tenant: tenant.code, app: row.app, subapp: row.subapp, event: row.event, body: row.body, options: row.options, success: false, retries: row.retries, status: res.status, result: res.data});
                await deleteZapq(tenant.code, row.id);
              }
            }
            else {
              // success
              await saveZapstat({tenant: tenant.code, app: row.app, subapp: row.subapp, event: row.event, body: row.body, options: row.options, success: true, retries: row.retries++, status: res.status, result: res.data});
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
*/