const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
//const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

const { Tag } = require(root + `/apps/${app}/models.js`);

module.exports = {
  getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // get one or more Tags
    return (where) 
      ? await Tag.where({pgschema, where, values, cols, limit, offset, orderby}) 
      : await Tag.select({pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Tag row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = Tag.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
     
    return await Tag.selectOne({pgschema, pks: [rec.id] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Tag row
    let tobj = new Tag(rec);
    let tm = await tobj.insertOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update Tag row
    rec.id = id;

    let tobj = new Tag(rec);
    let tm = await tobj.updateOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Tag row
    let tobj = new Tag({ id });
    let tm = await tobj.deleteOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
};