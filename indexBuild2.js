const root = process.cwd();
const qParse = require('querystring').parse;
const migration = require(root + '/lib/server/utils/migration.js');
const {send} = require(root + '/lib/server/utils/send.js');
const {SendMessage} = require(root + '/lib/server/utils/messages.js');

//var qstr = 'p1=val1&p2=val2&p2=val21';
//console.log(qParse(qstr));

const database = 'db4_73WakrfVbNJBaAmhQtEeDv';
const pgschema = 'public';
const migApp = 'schema';

(async function() {
  let res = await migration({database, pgschema, migApp});

  console.log(res)
  if (res.status == 400) {
    console.log(res.data.errors)

    for (let mdl of res.data.errors._verify) {
      console.log(mdl.verrs)
    }
  }
})();