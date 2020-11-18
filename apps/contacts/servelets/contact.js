const root = process.cwd();
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {zapPubsub} = require(root + '/lib/server/utils/pubsubs.js');
const {getAppName, getSubappName} = require(root + '/lib/server/utils/utils.js');

const { Contact } = require(root + '/apps/contacts/models.js');

const app = getAppName(__dirname);
const subapp = getSubappName(__filename);
const ilikes = [
  'first',
  'last',
  'group',
  'address1',
  'address2',
  'city',
  'email',
  'email2',
  'emgname',
  'emgrelation',
  'occupation',
];

const json = ['tags'];

module.exports = {
  getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[]} = {}) {
    // get one or more Contacts

    if (where) {
      return await Contact.query({pgschema, where, values, cols});    
    }
    
    // build query rather than a plain select
    let idx = 0;

    where = [];
    values = [];

    for (let field in rec) {
      idx++;

      if (ilikes.indexOf(field) > -1) {
        where.push(`"${field}" ILIKE $${idx} || '%'`);  // ILIKE and Starts with  ||'%'
        values.push(rec[field]);
      }
      else if (json.indexOf(field) > -1) {
        if (rec[field].indexOf(',') > -1) {
          // array
          where.push(`"${field}"::jsonb ?& $${idx}`);  // "field"::jsonb ?& ['1','2']  do all elements exist?
          values.push(rec[field].split(','));
        }
        else {
          where.push(`"${field}"::jsonb ? $${idx}`);  // "field"::jsonb ? '1'  does element exist?
          values.push(rec[field]);  
        }
      }
      else {
        where.push(`"${field}" = $${idx}`);
        values.push(rec[field]);
      }
    }

    where = where.join(' AND ');

    return await Contact.query({pgschema, where, values, cols});    
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // get specific Contact
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = Contact.getColumnDefaults();
      tm.type = 'json';

      tm.data.country = 'CA';
      tm.data.region = 'CA-NS';

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