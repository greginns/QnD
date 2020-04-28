const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const { Contact } = require(root + '/apps/contacts/models.js');

module.exports = {
  getAll: async function({pgschema = '', params = {}} = {}) {
    // get one or more Contacts
    return await Contact.select({pgschema, rec: {}, params});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Contact
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = [Contact.getColumnDefaults()];
      tm.type = 'json';

      return tm;
    }
          
    return await Contact.select({pgschema, rec});
  },
    
  insert: async function({pgschema = '', rec = {}} = {}) {
    // insert Contact row
    let tobj = new Contact(rec);
    let tm = await tobj.insertOne({pgschema});

    if (tm.status == 200) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app.toLowerCase()}.create`, tm.data);
    }

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update record
    if (!id) {
      return new TravelMessage({err: new UserError('No Contact id Supplied')});
    }
        
    rec.id = id;

    let tobj = new Contact(rec);
    let tm = await tobj.updateOne({pgschema});

    if (tm.status == 200) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app.toLowerCase()}.update`, tm.data);
    }
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Contact
    if (!id) return new TravelMessage({err: new UserError('No Contact id Supplied')});

    let tobj = new Contact({id});
    let tm = await tobj.deleteOne({pgschema});

    if (tm.status == 200) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app.toLowerCase()}.delete`, tm.data);
    }

    return tm;
  }
};