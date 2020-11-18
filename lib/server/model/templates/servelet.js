const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
//const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

const { {{name}} } = require(root + `/apps/${app}/models.js`);

module.exports = {
  getMany: async function({pgschema='', rec={}, cols=['*'], limit, offset} = {}) {
    // get one or more {{name}} rows
    return await {{name}}.select({pgschema, rec, cols, limit, offset});     
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific {{name}} row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = {{name}}.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
     
    return await {{name}}.selectOne({pgschema, pks: [rec.{{pk}}] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert {{name}} row
    let tobj = new {{name}}(rec);
    let tm = await tobj.insertOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  },
  
  update: async function({pgschema = '', {{pk}} = '', rec= {}} = {}) {
    // Update {{name}} row
    rec.{{pk}} = {{pk}};

    let tobj = new {{name}}(rec);
    let tm = await tobj.updateOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  },
  
  delete: async function({pgschema = '', {{pk}} = ''} = {}) {
    // delete {{name}} row
    let tobj = new {{name}}({ {{pk}} });
    let tm = await tobj.deleteOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
};