const root = process.cwd();
const fs = require("fs");

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {NunjucksError, SystemError} = require(root + '/lib/server/utils/errors.js');
const {Zapsub} = require(root + '/apps/zapi/models.js');

const path = 'servelets';
const services = {};

const dateFormat = 'MM/DD/YYYY';
const timeFormat = 'hh:mm A';

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  let name = file.split('.')[0];

  services[name] = require(`./${path}/${file}`);
}

// Any other needed services
services.subscribe = async function({pgschema = '', rec = {}} = {}) {
  // insert Zapsub row

  return await services.zapsub.insert({pgschema, rec});
},

services.unsubscribe = async function({pgschema = '', id = ''} = {}) {
  // insert Zapsub row
  return await services.zapsub.delete({pgschema, id});
},

module.exports = services;