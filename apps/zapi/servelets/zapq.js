const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {UserError, SystemError} = require(root + '/lib/server/utils/errors.js');
const { Zapq } = require(root + '/apps/zapi/models.js');
const app = 'zapi';
const subapp = 'zapq'

module.exports = {
  getAll: async function({pgschema = '', query = {}} = {}) {
    // get one or more Zapq rows
    return await Zapq.select({pgschema, rec: {}, query});
  },
  
  getOne: async function({pgschema = '', id = ''} = {}) {
    // get specific Zapq row
    if (!id) {
      return new TravelMessage({err: new UserError('No Zapq id Supplied')});
    }
        
    if (id == '_default') {
      let tm = new TravelMessage();

      tm.data = Zapq.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
     
    return await Zapq.selectOne({pgschema, pks: id});
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Zapq row
    let tobj = new Zapq(rec);
    let tm = await tobj.insertOne({pgschema});

    //if (tm.status == 200) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update Zapq row
    if (!id) {
      return new TravelMessage({err: new UserError('No Zapq id Supplied')});
    }
        
    rec.id = id;

    let tobj = new Zapq(rec);
    let tm = await tobj.updateOne({pgschema});

    //if (tm.status == 200) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Zapq row
    if (!id) return new TravelMessage({err: new UserError('No Zapq id Supplied')});

    let tobj = new Zapq({ id });
    let tm = await tobj.deleteOne({pgschema});

    //if (tm.status == 200) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
};