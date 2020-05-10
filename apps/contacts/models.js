const root = process.cwd();
const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const app = 'contacts';

const Contact = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Contact ID'}),
        first: new Fields.Char({notNull: true, maxLength: 40, verbose: 'First Name'}),
        last: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Last Name'}),
        group: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Group Name'}),
        address: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Address'}),
        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Email Address'}),
        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}) 
      },
      
      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['last', 'first'],
      
      dbschema: 'tenant',
      app,
      desc: 'Contact Master'
    }
  }
};

module.exports = {Contact};