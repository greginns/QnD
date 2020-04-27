const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {UserError, SystemError} = require(root + '/lib/server/utils/errors.js');
const { {{name}} } = require(root + '/apps/{{app}}/models.js');

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
    
  insert: async function({pgschema = '', rec = {}} = {}) {
    // insert {{name}} row
    try {
      let tobj = new {{name}}(rec);
    
      return await tobj.insertOne({pgschema});
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
    
      return await tobj.updateOne({pgschema});
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

      return await tobj.deleteOne({pgschema});
    }
    catch(err) {
      return new TravelMessage({err: new SystemError(err.message)});
    }
  }
};