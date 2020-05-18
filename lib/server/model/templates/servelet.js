const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {UserError} = require(root + '/lib/server/utils/errors.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const { {{name}} } = require(root + `/apps/${app}/models.js`);
const subapp = '{{nameLC}}';

module.exports = {
  getAll: async function({pgschema = '', query = {}} = {}) {
    // get one or more {{name}} rows
    const cols = ['*'], rec = {};

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

    return await {{name}}.select({pgschema, rec, cols, options: query});    
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
     
    return await {{name}}.selectOne({pgschema, pks: {{pk}} });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // insert {{name}} row
    let tobj = new {{name}}(rec);
    let tm = await tobj.insertOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    }

    return tm;    
  },
  
  update: async function({pgschema = '', {{pk}} = '', rec= {}} = {}) {
    // Update {{name}} row
    if (!{{pk}}) {
      return new TravelMessage({err: new UserError('No {{name}} {{pk}} Supplied')});
    }
        
    rec.{{pk}} = {{pk}};

    let tobj = new {{name}}(rec);
    let tm = await tobj.updateOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.update`, tm.data);
    }
    
    return tm;
  },
  
  delete: async function({pgschema = '', {{pk}} = ''} = {}) {
    // delete {{name}} row
    if (!{{pk}}) return new TravelMessage({err: new UserError('No {{name}} {{pk}} Supplied')});

    let tobj = new {{name}}({ {{pk}} });
    let tm = await tobj.deleteOne({pgschema});

    if (tm.isGood()) {
      zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.delete`, tm.data);
    }

    return tm;
  }
};