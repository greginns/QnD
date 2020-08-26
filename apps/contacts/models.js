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
        group: new Fields.Char({null: true, maxLength: 40, verbose: 'Group Name'}),
        title: new Fields.Char({notNull: false, maxLength: 4, verbose: 'Title'}),

        address1: new Fields.Char({null: true, maxLength: 40, verbose: 'Address-1'}),
        address2: new Fields.Char({null: true, maxLength: 40, verbose: 'Address-2'}),
        city: new Fields.Char({null: true, maxLength: 40, verbose: 'City'}),
        postcode: new Fields.Char({null: true, maxLength: 10, verbose: 'Postal Code'}),
        region: new Fields.Char({null: true, maxLength: 5, verbose: 'Region'}),

        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Primary Email'}),
        email2: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Secondary Email'}),
        phone: new Fields.Char({null: true, maxLength: 15, verbose: 'Primary Phone'}),
        iscell: new Fields.Boolean({default: true, verbose: 'Cell#?'}),
        phone2: new Fields.Char({null: true, maxLength: 15, verbose: 'Secondary Phone'}),
        iscell2: new Fields.Boolean({default: true, verbose: 'Cell#?'}),

        emgname: new Fields.Char({null: true, maxLength: 40, verbose: 'Contact Name'}),
        emgphone: new Fields.Char({null: true, maxLength: 15, verbose: 'Contact Phone#'}),
        emgrelation: new Fields.Char({null: true, maxLength: 40, verbose: 'Relation'}),

        dob: new Fields.Date({null: true, verbose: 'Date of Birth'}),
        gender: new Fields.Char({notNull: true, default: 'U', maxLength: 1, verbose: 'Gender'}),
        occupation: new Fields.Char({null: true, maxLength: 40, verbose: 'Occupation'}),
        taxno: new Fields.Char({null: true, maxLength: 40, verbose: 'Tax#'}),
        doe: new Fields.Date({null: true, verbose: 'Date Entered'}),

        grptype: new Fields.Char({null: true, maxLength: 4, verbose: 'Group Type'}),
        cat: new Fields.Char({null: true, default: 'F', maxLength: 1, verbose: 'Category'}),
        tags: new Fields.Json({verbose: 'Tags'}),

        massmail: new Fields.Boolean({default: false, verbose: 'Send Mass Mailings'}),
        massemail: new Fields.Boolean({default: false, verbose: 'Send Mass Emailings'}),
        masssms: new Fields.Boolean({default: false, verbose: 'Send SMS Ads'}),
        allowfup: new Fields.Boolean({default: true, verbose: 'Allow Follow Up'}),
        allowrsv: new Fields.Boolean({default: true, verbose: 'Allow Reservations'}),
        allowbill: new Fields.Boolean({default: false, verbose: 'Allow Direct Billing'}),

        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}) 
      },
      
      constraints: {
        pk: ['id'],
        fk: [{name: 'title', columns: ['title'], app, table: Title, tableColumns: ['id'], onDelete: 'NO ACTION'}],
      },
      
      hidden: [],
      
      orderBy: ['last', 'first'],
      
      dbschema: 'tenant',
      app,
      desc: 'Contact Master'
    }
  }
};
  
const Title = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 4, verbose: 'ID'}),
        title: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Title'}),
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['title'],
      
      dbschema: 'tenant',
      app,
      desc: 'Contact Titles'
    }
  }

};

module.exports = {Contact, Title};