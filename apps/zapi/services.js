const root = process.cwd();
const fs = require("fs");

const {Zouter} = require(root + '/lib/server/utils/zouter.js');
const adminServices = require(root + '/apps/admin/services.js');

const path = 'servelets';
const services = {};

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
  // insert Zapsub row
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

module.exports = services;