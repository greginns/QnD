const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

const { Tagcat } = require(root + `/apps/${app}/models.js`);

module.exports = {
  getMany: async function({pgschema='', rec={}, cols=['*'], limit, offset} = {}) {
    // get one or more Tagcat rows
    return await Tagcat.select({pgschema, rec, cols, limit, offset});     
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Tagcat row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = Tagcat.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
     
    return await Tagcat.selectOne({pgschema, pks: [rec.id] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Tagcat row
    let tobj = new Tagcat(rec);
    let tm = await tobj.insertOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update Tagcat row
    rec.id = id;

    let tobj = new Tagcat(rec);
    let tm = await tobj.updateOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Tagcat row
    let tobj = new Tagcat({ id });
    let tm = await tobj.deleteOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
};