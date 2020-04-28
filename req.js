const root = process.cwd();

const {SendMessage} = require(root + '/lib/server/utils/messages.js');
const {send} = require(root + '/lib/server/utils/send.js');

const options = {
  url: 'https://roam3.adventurebooking.com:3011/contacts/contact/1',
/*  
  hostname: 'roam3.adventurebooking.com',
  path: '/contacts/contact/1',
  port: 3011,
*/  
  method: 'GET',
  auth: 'gm-admin:Admin49!',
  timeout: 10000,
}

const headers = {};

async function sendIt() {
  let sm = new SendMessage({options, headers})
  let res = await send(sm)
  console.log(res)
}

sendIt();
