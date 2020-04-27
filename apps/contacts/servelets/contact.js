const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const { Contact } = require(root + '/apps/contacts/models.js');

module.exports = {
  getAll: async function({pgschema = '', params = {}} = {}) {
    // get one or more Contacts
    return await Contact.select({pgschema, rec: {}, params});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get one or more Contacts
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
    
    return await tobj.insertOne({pgschema});
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update record
    if (!id) {
      return new TravelMessage({err: new UserError('No Contact id Supplied')});
    }
        
    rec.id = id;

    let tobj = new Contact(rec);
    
    return await tobj.updateOne({pgschema});
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Contact
    if (!id) return new TravelMessage({err: new UserError('No Contact id Supplied')});

    let tobj = new Contact({id});

    return await tobj.deleteOne({pgschema});
  }
};