const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {UserError, SystemError} = require(root + '/lib/server/utils/errors.js');
const { Zapsub } = require(root + '/apps/zapi/models.js');

module.exports = {
  getAll: async function({pgschema = '', params = {}} = {}) {
    // get one or more Zapsubs
    try {
      return await Zapsub.select({pgschema, rec: {}, params});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Zapsub
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = [Zapsub.getColumnDefaults()];
      tm.type = 'json';

      return tm;
    }
          
    try {
      return await Zapsub.select({pgschema, rec});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }    
  },
    
  insert: async function({pgschema = '', rec = {}} = {}) {
    // insert Zapsub row
    try {
      let tobj = new Zapsub(rec);

      return await tobj.insertOne({pgschema});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update record
    if (!id) {
      return new TravelMessage({err: new UserError('No Zapsub id Supplied')});
    }
        
    try {
      rec.id = id;

      let tobj = new Zapsub(rec);
      
      return await tobj.updateOne({pgschema});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }    
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Zapsub
    if (!id) return new TravelMessage({err: new UserError('No Zapsub id Supplied')});

    try {
      let tobj = new Zapsub({id});

      return await tobj.deleteOne({pgschema});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }    
  }
};