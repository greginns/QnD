const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {Company} = require(root + '/apps/contacts/models.js');
const app = getAppName(__dirname);

const TAXBASE = [
  {value: '%', text: 'Percent'},
  {value: 'P', text: 'Per Person'},
  {value: 'U', text: 'Per Person/Day'},
  {value: 'Q', text: 'Quantity'},
  {value: 'N', text: 'Quantity/Day'},
  {value: 'F', text: 'Flat'},
  {value: 'X', text: 'Tiered $/1000'},
  {value: 'Y', text: 'Tiered $'},
  {value: 'Z', text: 'Tiered %'}
];

const EFFECTIVE = [
  {value: 'A', text: 'Arrival'},
  {value: 'B', text: 'Booking'}
];

const ASSIGN = [
  {value: 'A', text: 'Arrival'},
  {value: 'B', text: 'Booking'},
  {value: 'E', text: 'Either'}
];

const upper = function(x) {
  return String(x).toUpperCase();
}

const Items = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        company: new Fields.Char({null: true, maxLength: 1, verbose: 'Company'}),
        areaphy: new Fields.Char({null: true, maxLength: 2, verbose: 'Physical Area'}),
        areadir: new Fields.Char({null: true, maxLength: 2, verbose: 'Arrival Area'}),
        minage: new Fields.Integer({null: true, default: 12, verbose: 'Minimum Age'}),
        allowinf: new Fields.Boolean({default: true, verbose: 'Infants'}),
        allowchl: new Fields.Boolean({default: true, verbose: 'Children'}),
        allowyth: new Fields.Boolean({default: true, verbose: 'Youth'}),
        allowadl: new Fields.Boolean({default: true, verbose: 'Adults'}),
        allowsen: new Fields.Boolean({default: true, verbose: 'Seniors'}),
        online: new Fields.Boolean({default: true, verbose: 'Book Online'}),
        homepage: new Fields.Char({null: true, maxLength: 100, verbose: 'Home Page'}),
        tandc: new Fields.Text({null: true, verbose: 'Addl Terms and Conditions'}),
        rsvmsg: new Fields.Text({null: true, verbose: 'Booking Message'}),
        oninv: new Fields.Boolean({default: true, verbose: 'On Invoice'}),
        invmsg: new Fields.Text({null: true, verbose: 'Invoice Note'}),
        waiver: new Fields.Char({null: true, maxLength: 10, verbose: 'Waiver'}),
        lastday: new Fields.Integer({null: true, default: 0, verbose: 'Last Day to Book'}),
        lasttime: new Fields.Time({null: true, verbose: 'Last Time to Book'}),
        gl1: new Fields.Char({null: true, maxLength: 20, verbose: 'GL'}),
        gl2: new Fields.Char({null: true, maxLength: 20, verbose: 'GL'}),
        gl3: new Fields.Char({null: true, maxLength: 20, verbose: 'GL'}),
        gl4: new Fields.Char({null: true, maxLength: 20, verbose: 'GL'}),
        gl1amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl2amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl3amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl4amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl1perc: new Fields.Boolean({default: true, verbose: 'Percent'}),
        gl2perc: new Fields.Boolean({default: true, verbose: 'Percent'}),
        gl3perc: new Fields.Boolean({default: true, verbose: 'Percent'}),
        gl4perc: new Fields.Boolean({default: true, verbose: 'Percent'}),
        commgl: new Fields.Char({null: true, maxLength: 20, verbose: 'Commission GL'}),
        tax1: new Fields.Char({null: true, maxLength: 20, verbose: 'Tax'}),
        tax2: new Fields.Char({null: true, maxLength: 20, verbose: 'Tax'}),
        tax3: new Fields.Char({null: true, maxLength: 20, verbose: 'Tax'}),
        tax4: new Fields.Char({null: true, maxLength: 20, verbose: 'Tax'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [
          {name: 'company', columns: ['company'], app, table: Company, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'areaphy', columns: ['areaphy'], app, table: Area, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'areadir', columns: ['areadir'], app, table: Area, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'gl1', columns: ['gl1'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'gl2', columns: ['gl2'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'gl3', columns: ['gl3'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'gl4', columns: ['gl4'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'commgl', columns: ['commgl'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'tax1', columns: ['tax1'], app, table: Tax, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'tax2', columns: ['tax2'], app, table: Tax, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'tax3', columns: ['tax3'], app, table: Tax, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'tax4', columns: ['tax4'], app, table: Tax, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'waiver', columns: ['waiver'], app, table: Waiver, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
        index: [
        ],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'code'],
      
      dbschema: '',
      app,
      desc: 'Item prototype'
    }
  }
};

// Activities
const Activity = class extends Items {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        actgroup: new Fields.Char({null: true, maxLength: 10, verbose: 'Group'}),
        durdays: new Fields.Integer({null: true, default: 1, verbose: 'Days'}),
        durhours: new Fields.Integer({null: true, default: 6, verbose: 'Hours'}),
        multi: new Fields.Boolean({default: false, verbose: 'Daily Starts'}),
        assign: new Fields.Char({null: true, maxLength: 1, default: 'B', choices: ASSIGN, verbose: 'Assign time'}),
        arroffset: new Fields.Integer({null: true, default: 0, verbose: 'Arrival Offset'}),
        lastoffset: new Fields.Float({null: true, default: 0, verbose: 'Last Time Offset'}),
      },

      constraints: {
        fk: [
          {name: 'actgroup', columns: ['actgroup'], app, table: Actgroup, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Activities'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Actgroup = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Group Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),      
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Activity Groups'
    }
  }
};

// Lodging
const Lodging = class extends Items {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodglocn: new Fields.Char({null: true, maxLength: 10, verbose: 'Location'}),
        lodgtype: new Fields.Char({null: true, maxLength: 10, verbose: 'Type'}),
        unitized: new Fields.Boolean({null: true, default: true, verbose: 'Unitized'}),
        checkin: new Fields.Time({null: true, verbose: 'Check-in Time'}),
        checkout: new Fields.Time({null: true, verbose: 'Check-out Time'}),
        maxppl: new Fields.Integer({null: true, default: 0, verbose: 'Max ppl/unit'}),
        unitinv: new Fields.Boolean({null: true, default: true, verbose: 'Units on Invoice'}),
        bookbeds: new Fields.Boolean({null: true, default: true, verbose: 'Book Beds'}),
        assign: new Fields.Char({null: true, maxLength: 1, default: 'B', choices: ASSIGN, verbose: 'Assign unit'}),
      },

      constraints: {
        fk: [
          {name: 'lodglocn', columns: ['lodglocn'], app, table: Lodglocn, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'lodgtype', columns: ['lodgtype'], app, table: Lodgtype, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Lodging'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Lodglocn = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Location Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Lodging Locations'
    }
  }
};

const Lodgtype = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Type Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Lodging Types'
    }
  }
};

// All
const Area = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
        latitude: new Fields.Float({null: true, maxlength: 12, verbose: 'Latitude'}),
        longitude: new Fields.Float({null: true, maxlength: 12, verbose: 'Longitude'}),        
        dirlink: new Fields.Char({null: true, maxLength: 100, verbose: 'Directions Link'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Geographic Areas'
    }
  }
};

const Glcode = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'GL Codes'
    }
  }
};

const Tax = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        base: new Fields.Char({null: true, maxLength: 2, default: '%', choices: TAXBASE, verbose: 'Basis'}),
        effwhen: new Fields.Char({null: true, maxLength: 2, default: 'A', choices: EFFECTIVE, verbose: 'Effective'}),
        isgovt: new Fields.Boolean({default: true, verbose: 'Govt Tax'}),
        gl: new Fields.Char({null: true, maxLength: 20, verbose: 'GL'}),
        exemptable: new Fields.Boolean({default: true, verbose: 'Exemptable'}),
        tier1min: new Fields.Float({null: true, default: null, verbose: 'Min'}),
        tier1max: new Fields.Float({null: true, default: null, verbose: 'Max'}),
        tier2min: new Fields.Float({null: true, default: null, verbose: 'Min'}),
        tier2max: new Fields.Float({null: true, default: null, verbose: 'Max'}),
        tier3min: new Fields.Float({null: true, default: null, verbose: 'Min'}),
        tier3max: new Fields.Float({null: true, default: null, verbose: 'Max'}),
        tier4min: new Fields.Float({null: true, default: null, verbose: 'Min'}),
        tier4max: new Fields.Float({null: true, default: null, verbose: 'Max'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [
          {name: 'gl', columns: ['gl'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Taxes and Service Charges'
    }
  }
};

const Waiver = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code', helptext: '1-8 character code to identify this waiver'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
        text: new Fields.Text({null: true, verbose: 'Legal Text'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'GL Codes'
    }
  }
};

//console.log(Activity.definition())
//console.log(Lodging.definition())
module.exports = {Activity, Lodging, Actgroup, Lodglocn, Lodgtype, Area, Waiver, Glcode, Tax}