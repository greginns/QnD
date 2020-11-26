const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
//const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

const { Config } = require(root + `/apps/${app}/models.js`);

module.exports = {
  getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // get one or more Configs
    return (where) 
      ? await Config.where({pgschema, where, values, cols, limit, offset, orderby}) 
      : await Config.select({pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Config row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = Config.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
     
    return await Config.selectOne({pgschema, pks: [rec.id] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Config row
    let tobj = new Config(rec);
    let tm = await tobj.insertOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update Config row
    rec.id = id;

    let tobj = new Config(rec);
    let tm = await tobj.updateOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Config row
    let tobj = new Config({ id });
    let tm = await tobj.deleteOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
};