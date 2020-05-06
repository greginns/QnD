const root = process.cwd();
const migration = require(root + '/lib/server/utils/migration.js');
const {send} = require(root + '/lib/server/utils/send.js');
const {SendMessage} = require(root + '/lib/server/utils/messages.js');

/*
const tenant = 'gm';
const migApp = 'zapi';

(async function() {
  let res = await migration({tenant, migApp});

  console.log(res)
})();
*/

const url = 'https://roam3.adventurebooking.com:3011/admin/echo'
const body = {"id":"444","first":"Greggi","last":"Miller","group":"Greg's Group","email":"greg@reservation-net.com","fullname":"Greggi Miller","_pk":"444"};

let options = {url, method: 'POST'};
let sm = new SendMessage({body, options});

async function test() {
  let res = await send(sm);

  console.log(res);
}

test();
