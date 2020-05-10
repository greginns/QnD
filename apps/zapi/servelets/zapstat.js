const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {UserError, SystemError} = require(root + '/lib/server/utils/errors.js');
const { Zapstat } = require(root + '/apps/zapi/models.js');
const app = 'zapi';
const subapp = 'zapstat';

module.exports = {
  getAll: async function({pgschema = '', query = {}} = {}) {
    // get one or more Zapstat rows
    return await Zapstat.select({pgschema, rec: {}, query});
  },
  
  getOne: async function({pgschema = '', id = ''} = {}) {
    // get specific Zapstat row
    if (!id) {
      return new TravelMessage({err: new UserError('No Zapstat id Supplied')});
    }
        
    if (id == '_default') {
      let tm = new TravelMessage();

      tm.data = Zapstat.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
     
    return await Zapstat.select({pgschema, pks: id});
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert Zapstat row
    let tobj = new Zapstat(rec);
    let tm = await tobj.insertOne({pgschema});

    //if (tm.status == 200) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update Zapstat row
    if (!id) {
      return new TravelMessage({err: new UserError('No Zapstat id Supplied')});
    }
        
    rec.id = id;

    let tobj = new Zapstat(rec);
    let tm = await tobj.updateOne({pgschema});

    //if (tm.status == 200) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    //}
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // delete Zapstat row
    if (!id) return new TravelMessage({err: new UserError('No Zapstat id Supplied')});

    let tobj = new Zapstat({ id });
    let tm = await tobj.deleteOne({pgschema});

    //if (tm.status == 200) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    //}

    return tm;
  }
};