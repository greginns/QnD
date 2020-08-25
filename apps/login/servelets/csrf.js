const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const { CSRF } = require(root + `/apps/${app}/models.js`);

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

module.exports = {
  getMany: async function({pgschema = '', query = {}} = {}) {
    // get one or more CSRF rows
    let cols = ['*'], rec = {};

    if ('fields' in query) {
      cols = query.fields.split(',');
    }

    if ('filters' in query) {
      let fldVals = query.filters.split(',');

      for (let fldVal in fldVals) {
        let pair = fldVal.split('|');
        rec[pair[0]] = pair[1];
      }
    }

    return await CSRF.select({pgschema, rec, cols, options: query});    
  },
  
  getOne: async function({pgschema = '', token = ''} = {}) {
    // get specific CSRF row
    if (token == '_default') {
      let tm = new TravelMessage();

      tm.data = [CSRF.getColumnDefaults()];
      tm.type = 'json';

      return tm;
    }
     
    return await CSRF.selectOne({pgschema, pks: token });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert CSRF row
    let tobj = new CSRF(rec);
    let tm = await tobj.insertOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    }

    return tm;    
  },
  
  update: async function({pgschema = '', token = '', rec= {}} = {}) {
    // Update CSRF row
    rec.token = token;

    let tobj = new CSRF(rec);
    let tm = await tobj.updateOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    }
    
    return tm;
  },
  
  delete: async function({pgschema = '', token = ''} = {}) {
    // delete CSRF row
    let tobj = new CSRF({ token });
    let tm = await tobj.deleteOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    }

    return tm;
  }
};