const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const egroupChoices = [
  {value: 'D', text: 'Daily'},
  {value: 'W', text: 'Weekly'},
  {value: 'M', text: 'Monthly'},
  {value: 'O', text: 'Once'},
  {value: '', text: 'Manual'}
]

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
        region: new Fields.Char({null: true, maxLength: 10, verbose: 'Region'}),
        country: new Fields.Char({null: true, maxLength: 2, verbose: 'Country'}),
        postcode: new Fields.Char({null: true, maxLength: 10, verbose: 'Postal Code'}),

        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Primary Email'}),
        email2: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Secondary Email'}),
        phone: new Fields.Char({null: true, maxLength: 20, verbose: 'Primary Phone'}),
        iscell: new Fields.Boolean({default: true, verbose: 'Cell#?'}),
        phone2: new Fields.Char({null: true, maxLength: 20, verbose: 'Secondary Phone'}),
        iscell2: new Fields.Boolean({default: true, verbose: 'Cell#?'}),

        emgname: new Fields.Char({null: true, maxLength: 40, verbose: 'Contact Name'}),
        emgphone: new Fields.Char({null: true, maxLength: 15, verbose: 'Contact Phone#'}),
        emgrelation: new Fields.Char({null: true, maxLength: 40, verbose: 'Relation'}),

        dob: new Fields.Date({null: true, verbose: 'Date of Birth'}),
        gender: new Fields.Char({notNull: true, default: 'U', maxLength: 1, verbose: 'Gender'}),
        occupation: new Fields.Char({null: true, maxLength: 40, verbose: 'Occupation'}),
        taxno: new Fields.Char({null: true, maxLength: 40, verbose: 'Tax#'}),
        doe: new Fields.Date({null: true, verbose: 'Date Entered'}),
        agentno:  new Fields.Char({null: true, maxLength: 10, verbose: 'Agent ID'}),
        agentper:  new Fields.Decimal({null: true, maxLength: 5, digits: 4, decimals: 2, verbose: 'Agent Percent'}),

        acct: new Fields.Boolean({default: false, verbose: 'Has Account'}),
        acctlim:  new Fields.Decimal({null: true, maxLength: 8, digits: 5, decimals: 0, verbose: 'Account Limit'}),
        acctcard: new Fields.Char({null: true, maxLength: 20, verbose: 'Card#'}), 
        acctexp: new Fields.Char({null: true, maxLength: 5, verbose: 'Card Expiration'}), 
        acctver: new Fields.Date({null: true, verbose: 'Date Card Last Verified'}),

        grptype: new Fields.Char({null: true, maxLength: 4, verbose: 'Group Type'}),
        cat: new Fields.Char({null: true, default: 'F', maxLength: 1, verbose: 'Category'}),
        tags: new Fields.Json({verbose: 'Tags'}),
        egroups: new Fields.Json({verbose: 'E-groups'}),

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
        fk: [
          {name: 'title', columns: ['title'], app, table: Title, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'grptype', columns: ['grptype'], app, table: Group, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'region', columns: ['region'], app, table: Region, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'country', columns: ['country'], app, table: Country, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'agentno', columns: ['agentno'], app, table: Contact, tableColumns: ['id'], onDelete: 'NO ACTION'},
        ],
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
        active: new Fields.Boolean({default: true, verbose: 'Active?'})
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
  
const Group = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 4, verbose: 'ID'}),
        type: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Type'}),
        active: new Fields.Boolean({default: true, verbose: 'Active?'})
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['type'],
      
      dbschema: 'tenant',
      app,
      desc: 'Contact Group Types'
    }
  }
};

const Country = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 2, verbose: 'ID'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        format: new Fields.Char({null: true, maxLength: 20, verbose: 'Postal Code Format'}),
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'tenant',
      app,
      desc: 'Countries'
    }
  }
};
  
const Region = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 10, verbose: 'ID'}),  // cc-rrr  country-region
        country: new Fields.Char({notNull: true, maxLength: 2, verbose: 'Country ID'}),
        region: new Fields.Char({notNull: true, maxLength: 3, verbose: 'Region Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
      },

      constraints: {
        pk: ['id'],
        fk: [{name: 'country', columns: ['country'], app, table: Country, tableColumns: ['id'], onDelete: 'NO ACTION'}],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'tenant',
      app,
      desc: 'Regions'
    }
  }
};
  
const Postcode = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({verbose: 'ID'}),
        country: new Fields.Char({notNull: true, maxLength: 2, verbose: 'Country ID'}),
        postcode: new Fields.Char({null: true, maxLength: 10, verbose: 'Postal Code'}),
        region: new Fields.Char({null: true, maxLength: 10, verbose: 'Region Code'}),
        city: new Fields.Char({notNull: true, maxLength: 100, verbose: 'City'}),
      },

      constraints: {
        pk: ['id'],
        fk: [
          {name: 'country', columns: ['country'], app, table: Country, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'region', columns: ['region'], app, table: Region, tableColumns: ['id'], onDelete: 'NO ACTION'}
        ],
        index: [{name: 'country', columns: ['country']}]
      },
      
      hidden: [],
      
      orderBy: ['country', 'postcode'],
      
      dbschema: 'tenant',
      app,
      desc: 'Postal Codes'
    }
  }
};

const Egroup = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 4, verbose: 'ID'}),
        desc: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Description'}),
        freq: new Fields.Char({null: true, maxLength: 2, default: '', choices: egroupChoices, verbose: 'Frequency'}),
        active: new Fields.Boolean({default: true, verbose: 'Active?'})
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['desc'],
      
      dbschema: 'tenant',
      app,
      desc: 'Email Groups'
    }
  }
};

const Tagcat = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 8, verbose: 'ID'}),
        desc: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Description'}),
        active: new Fields.Boolean({default: true, verbose: 'Active?'})
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['desc'],
      
      dbschema: 'tenant',
      app,
      desc: 'Tag categories'
    }
  }
};

const Tag = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 8, verbose: 'ID'}),
        desc: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Description'}),
        cat: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Category'}),
        active: new Fields.Boolean({default: true, verbose: 'Active?'})
      },

      constraints: {
        pk: ['id'],
        fk: [
          {name: 'cat', columns: ['cat'], app, table: Tagcat, tableColumns: ['id'], onDelete: 'NO ACTION'}
        ]
      },
      
      hidden: [],
      
      orderBy: ['desc'],
      
      dbschema: 'tenant',
      app,
      desc: 'Tags'
    }
  }
};

const Config = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 50, verbose: 'ID'}),
        data: new Fields.Json({verbose: 'Data'}),
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['id'],
      
      dbschema: 'tenant',
      app,
      desc: 'Contact Config Info'
    }
  }
};

module.exports = {Contact, Title, Group, Country, Region, Postcode, Egroup, Tagcat, Tag, Config};