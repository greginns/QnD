const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {UserError} = require(root + '/lib/server/utils/errors.js');
const { Zapsub } = require(root + '/apps/zapi/models.js');

module.exports = {
  getAll: async function({pgschema = '', query = {}} = {}) {
    // get one or more Zapsubs
    return await Zapsub.select({pgschema, rec: {}, query});
  },
  
  getOne: async function({pgschema = '', id = ''} = {}) {
    // get specific Zapsub
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = [Zapsub.getColumnDefaults()];
      tm.type = 'json';

      return tm;
    }
          
    return await Zapsub.selectOne({pgschema, pks: id});
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Zapsub row
    let tobj = new Zapsub(rec);

    return await tobj.insertOne({pgschema});
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update record
    if (!id) {
      return new TravelMessage({err: new UserError('No Zapsub id Supplied')});
    }
        
    rec.id = id;

    let tobj = new Zapsub(rec);
    
    return await tobj.updateOne({pgschema});
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Zapsub
    if (!id) return new TravelMessage({err: new UserError('No Zapsub id Supplied')});

    let tobj = new Zapsub({id});

    return await tobj.deleteOne({pgschema});
  }
};