const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const { User } = require(root + `/apps/${app}/models.js`);

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

module.exports = {
  getMany: async function({pgschema = '', query = {}} = {}) {
    // get one or more User rows
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

    return await User.select({pgschema, rec, cols, options: query});    
  },
  
  getOne: async function({pgschema = '', code = ''} = {}) {
    // get specific User row
    if (code == '_default') {
      let tm = new TravelMessage();

      tm.data = [User.getColumnDefaults()];
      tm.type = 'json';

      return tm;
    }
     
    return await User.selectOne({pgschema, pks: code });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert User row
    let tobj = new User(rec);
    let tm = await tobj.insertOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    }

    return tm;    
  },
  
  update: async function({pgschema = '', code = '', rec= {}} = {}) {
    // Update User row
    rec.code = code;

    let tobj = new User(rec);
    let tm = await tobj.updateOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    }
    
    return tm;
  },
  
  delete: async function({pgschema = '', code = ''} = {}) {
    // delete User row
    let tobj = new User({ code });
    let tm = await tobj.deleteOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    }

    return tm;
  }
};