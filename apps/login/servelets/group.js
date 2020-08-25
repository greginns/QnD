const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const { Group } = require(root + `/apps/${app}/models.js`);

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

module.exports = {
  getMany: async function({pgschema = '', query = {}} = {}) {
    // get one or more Group rows
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

    return await Group.select({pgschema, rec, cols, options: query});    
  },
  
  getOne: async function({pgschema = '', code = ''} = {}) {
    // get specific Group row
    if (code == '_default') {
      let tm = new TravelMessage();

      tm.data = [Group.getColumnDefaults()];
      tm.type = 'json';

      return tm;
    }
     
    return await Group.selectOne({pgschema, pks: code });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Group row
    let tobj = new Group(rec);
    let tm = await tobj.insertOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    }

    return tm;    
  },
  
  update: async function({pgschema = '', code = '', rec= {}} = {}) {
    // Update Group row
    rec.code = code;

    let tobj = new Group(rec);
    let tm = await tobj.updateOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    }
    
    return tm;
  },
  
  delete: async function({pgschema = '', code = ''} = {}) {
    // delete Group row
    let tobj = new Group({ code });
    let tm = await tobj.deleteOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    }

    return tm;
  }
};