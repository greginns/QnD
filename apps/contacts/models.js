const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);

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
        group: new Fields.Char({notNull: false, maxLength: 40, verbose: 'Group Name'}),
        title: new Fields.Char({notNull: false, maxLength: 4, verbose: 'Title'}),

        address1: new Fields.Char({null: true, maxLength: 40, verbose: 'Address-1'}),
        address2: new Fields.Char({null: true, maxLength: 40, verbose: 'Address-2'}),
        city: new Fields.Char({null: true, maxLength: 40, verbose: 'City'}),
        postcode: new Fields.Char({null: true, maxLength: 10, verbose: 'Postal Code'}),
        region: new Fields.Char({null: true, maxLength: 5, verbose: 'Region'}),

        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Primary Email'}),
        email2: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Secondary Email'}),
        phone: new Fields.Char({null: true, maxLength: 15, verbose: 'Primary Email'}),

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