const root = process.cwd();
const https = require('https');

const {SendResponse} = require(root + '/lib/server/utils/messages.js')

const send = function(sm) {
  const {body, options} = sm.prep();
    
  return new Promise(function(resolve) {
    const chunks = [];

    const handleResponse = function(res) {
      let chunky = Buffer.concat(chunks);
      let data, sm;

      switch(res.headers['content-type']) {
        case 'application/json':
          data = JSON.parse(chunky);
          break;
        default:
          data = chunky.toString();
          break;
      }

      sm = new SendResponse({data, headers: res.headers, status: res.statusCode});

      resolve(sm);
    }

    const req = https.request(options, function(res) {
      res.on('data', function(data) {
        chunks.push(data);
      });

      res.on('end', function() {
        handleResponse(res);
      })
    })

    req.on('error', function(err) {
      let sm = new SendResponse({status: 500, err});

      resolve(sm);
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  })
}

/*
const roptions = {
  url: 'https://roam3.adventurebooking.com:3011/contacts/contact/1',
  
//  hostname: 'roam3.adventurebooking.com',
//  path: '/contacts/contact/1',
//  port: 3011,
  
  method: 'GET',
  auth: 'gm-admin:Admin49!',
  timeout: 10000,
  headers: {},
}
*/

module.exports = {send};