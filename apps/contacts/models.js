const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);
const {User} = require(root + '/apps/login/models.js');
const {Document, Docletter} = require(root + '/apps/documents/models.js');
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
        id: new Fields.Serial({verbose: 'Contact ID'}),
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

        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Email-1'}),
        email2: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Email-2'}),
        phone: new Fields.Char({null: true, maxLength: 20, verbose: 'Phone-1'}),
        iscell: new Fields.Boolean({default: true, verbose: 'Cell?'}),
        phone2: new Fields.Char({null: true, maxLength: 20, verbose: 'Phone-2'}),
        iscell2: new Fields.Boolean({default: true, verbose: 'Cell?'}),

        emgname: new Fields.Char({null: true, maxLength: 40, verbose: 'Contact Name'}),
        emgphone: new Fields.Char({null: true, maxLength: 15, verbose: 'Contact Phone#'}),
        emgrelation: new Fields.Char({null: true, maxLength: 40, verbose: 'Relation'}),

        dob: new Fields.Date({null: true, verbose: 'Birth Date'}),
        gender: new Fields.Char({notNull: true, default: 'U', maxLength: 1, verbose: 'Gender'}),
        occupation: new Fields.Char({null: true, maxLength: 40, verbose: 'Occupation'}),
        taxno: new Fields.Char({null: true, maxLength: 40, verbose: 'Tax#'}),
        doe: new Fields.Date({null: true, verbose: 'Date Entered'}),
        agentno:  new Fields.Char({null: true, maxLength: 10, verbose: 'Agent ID'}),
        agentper:  new Fields.Decimal({null: true, maxLength: 5, digits: 4, decimals: 2, verbose: 'Agent %'}),

        acct: new Fields.Boolean({default: false, verbose: 'Has Account'}),
        acctlim:  new Fields.Decimal({null: true, maxLength: 8, digits: 5, decimals: 0, verbose: 'Account Limit'}),
        acctcard: new Fields.Char({null: true, maxLength: 20, verbose: 'Card#'}), 
        acctexp: new Fields.Char({null: true, maxLength: 5, verbose: 'Card Expiration'}), 
        acctver: new Fields.Date({null: true, verbose: 'Date Card Last Verified'}),

        company: new Fields.Char({null: true, maxLength: 1, verbose: 'Company'}),
        grptype: new Fields.Char({null: true, maxLength: 4, verbose: 'Group Type'}),
        cat: new Fields.Char({null: true, default: 'F', maxLength: 1, verbose: 'Category'}),
        tags: new Fields.Json({verbose: 'Tags'}),
        egroups: new Fields.Json({verbose: 'E-groups'}),

        massmail: new Fields.Boolean({default: false, verbose: 'Mass Mail'}),
        massemail: new Fields.Boolean({default: false, verbose: 'Mass Email'}),
        masssms: new Fields.Boolean({default: false, verbose: 'SMS Ads'}),
        allowfup: new Fields.Boolean({default: true, verbose: 'Follow Up'}),
        allowrsv: new Fields.Boolean({default: true, verbose: 'Reservations'}),
        allowbill: new Fields.Boolean({default: false, verbose: 'Direct Bill'}),

        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}),
        state: new Fields.Derived({defn: 'substring("contacts_Contact"."region" from 4 for 2)', verbose: 'State'}),
        _pk: new Fields.Derived({defn: 'concat("contacts_Contact"."id")', verbose: 'PK'}) 
      },
      
      constraints: {
        pk: ['id'],
        fk: [
          {name: 'title', columns: ['title'], app, table: Title, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'grptype', columns: ['grptype'], app, table: Group, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'region', columns: ['region'], app, table: Region, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'country', columns: ['country'], app, table: Country, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'agentno', columns: ['agentno'], app, table: Contact, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'company', columns: ['company'], app, table: Company, tableColumns: ['id'], onDelete: 'NO ACTION'},
        ],
        unique: [
          {name: 'email', columns: ['email']},
        ],
      },
      
      hidden: [],
      
      orderBy: ['last', 'first'],
      
      dbschema: '',
      app,
      desc: 'Contact Master'
    }
  }
};

const Emailhist = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({verbose: 'ID'}),
        contact: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Contact'}),
        ref1: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Reference-1'}),
        ref2: new Fields.Char({null: true, maxLength: 10, verbose: 'Reference-2'}),
        transid: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Trans ID'}),
        datesent: new Fields.DateTime({notNull: true, verbose: 'Date Sent'}),
        doctype: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Doc Type'}),
        document: new Fields.Integer({notNull: true, verbose: 'Document'}),
        docletter: new Fields.Integer({null: true, verbose: 'Letter'}),
        subject: new Fields.Char({notNull: true, maxLength: 100, verbose: 'Subject'}),
        from: new Fields.Char({notNull: true, maxLength: 100, verbose: 'From Address'}),
        to: new Fields.Text({verbose: 'To address(es)'}),
        cc: new Fields.Text({verbose: 'CC address(es)'}),
        bcc: new Fields.Text({verbose: 'BCC address(es)'}),
        user: new Fields.Char({notNull: true, maxLength: 20, verbose: 'User'}),
      },

      constraints: {
        pk: ['id'],
        fk: [
          {name: 'contact', columns: ['contact'], app, table: Contact, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'user', columns: ['user'], app: 'login', table: User, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'document', columns: ['document'], app: 'document', table: Document, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'docletter', columns: ['docletter'], app: 'document', table: Docletter, tableColumns: ['id'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'contact', columns: ['contact']},
        ]
      },
      
      hidden: [],
      
      orderBy: ['contact','-datesent'],
      
      dbschema: '',
      app,
      desc: 'Email sending history'
    }
  }
};

const Associate = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({verbose: 'ID'}),
        contact: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Contact'}),
        desc: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Description'}),
        assoc: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Contact'}),
      },

      constraints: {
        pk: ['id'],
        fk: [
          {name: 'contact', columns: ['contact'], app, table: Contact, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'assoc', columns: ['assoc'], app, table: Contact, tableColumns: ['id'], onDelete: 'NO ACTION'}
        ],
        index: [
          {name: 'contact', columns: ['contact']},
          {name: 'assoc', columns: ['assoc']}
        ]
      },
      
      hidden: [],
      
      orderBy: ['contact','desc'],
      
      dbschema: '',
      app,
      desc: 'Associated Contacts'
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
      
      dbschema: '',
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
      
      dbschema: '',
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
      
      dbschema: '',
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
      
      dbschema: '',
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
      
      dbschema: '',
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
      
      dbschema: '',
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
      
      dbschema: '',
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
      
      dbschema: '',
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
      
      dbschema: '',
      app,
      desc: 'Contact Config Info'
    }
  }
};

const Company = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Char({notNull: true, maxLength: 1, verbose: 'ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active?'})
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['id'],
      
      dbschema: '',
      app,
      desc: 'Companies'
    }
  }
};

module.exports = {Contact, Emailhist, Associate, Title, Group, Country, Region, Postcode, Egroup, Tagcat, Tag, Config, Company};