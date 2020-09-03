const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
//const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');
const {modelQueryParse} = require(root + '/lib/server/utils/url.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

const { Postcode } = require(root + `/apps/${app}/models.js`);

module.exports = {
  getMany: async function({pgschema = '', query = {}} = {}) {
    // get one or more Postcode rows
    let {rec, cols} = modelQueryParse(query);

    return await Postcode.select({pgschema, rec, cols, options: query});    
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Postcode row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = Postcode.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
     
    return await Postcode.selectOne({pgschema, pks: [rec.id] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Postcode row
    let tobj = new Postcode(rec);
    let tm = await tobj.insertOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update Postcode row
    rec.id = id;

    let tobj = new Postcode(rec);
    let tm = await tobj.updateOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Postcode row
    let tobj = new Postcode({ id });
    let tm = await tobj.deleteOne({pgschema});

    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
};