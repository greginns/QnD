const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const { Contact } = require(root + '/apps/contacts/models.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__dirname);

module.exports = {
  getMany: async function({pgschema = '', query = {}} = {}) {
    // get one or more Contacts
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

    return await Contact.select({pgschema, rec, cols, options: query});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Contact
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = Contact.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
          
    return await Contact.select({pgschema, rec});
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Contact row
    let tobj = new Contact(rec);
    let tm = await tobj.insertOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    }

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update record
    rec.id = id;

    let tobj = new Contact(rec);
    let tm = await tobj.updateOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    }
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Contact
    let tobj = new Contact({id});
    let tm = await tobj.deleteOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    }

    return tm;
  }
};