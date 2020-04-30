const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {UserError, SystemError} = require(root + '/lib/server/utils/errors.js');
const { {{name}} } = require(root + '/apps/{{app}}/models.js');
const app = {{appLC}};
const subapp = {{nameLC}}

module.exports = {
  getAll: async function({pgschema = '', params = {}} = {}) {
    // get one or more {{name}} rows
    try {
      return await {{name}}.select({pgschema, rec: {}, params});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }    
  },
  
  getOne: async function({pgschema = '', {{pk}} = ''} = {}) {
    // get specific {{name}} row
    if (!{{pk}}) {
      return new TravelMessage({err: new UserError('No {{name}} {{pk}} Supplied')});
    }
        
    if ({{pk}} == '_default') {
      let tm = new TravelMessage();

      tm.data = [{{name}}.getColumnDefaults()];
      tm.type = 'json';

      return tm;
    }
     
    try {
      return await {{name}}.select({pgschema, { {{pk}} }});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }    
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert {{name}} row
    try {
      let tobj = new {{name}}(rec);
      let tm = await tobj.insertOne({pgschema});

      if (tm.status == 200) {
        zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, [tm.data]);
      }
  
      return tm;    
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }
  },
  
  update: async function({pgschema = '', {{pk}} = '', rec= {}} = {}) {
    // Update {{name}} row
    if (!{{pk}}) {
      return new TravelMessage({err: new UserError('No {{name}} {{pk}} Supplied')});
    }
        
    try {
      rec.{{pk}} = {{pk}};

      let tobj = new {{name}}(rec);
      let tm = await tobj.updateOne({pgschema});

      if (tm.status == 200) {
        zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, [tm.data]);
      }
      
      return tm;
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }
  },
  
  delete: async function({pgschema = '', {{pk}} = ''} = {}) {
    // delete {{name}} row
    if (!{{pk}}) return new TravelMessage({err: new UserError('No {{name}} {{pk}} Supplied')});

    try {
      let tobj = new {{name}}({ {{pk}} });
      let tm = await tobj.deleteOne({pgschema});

      if (tm.status == 200) {
        zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, [tm.data]);
      }

      return tm;
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }
  }
};