const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {Company} = require(root + '/apps/contacts/models.js');
const app = getAppName(__dirname);

const nullify = function(x) {
  return (x == '') ? null : x;
}

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

const RATEBASE1 = [
  {value: 'F', text: 'Flat'},
  {value: 'P', text: 'Per Person'},
  {value: 'C', text: 'Combined'},
]

const RATEBASE2 = [
  {value: 'F', text: 'Fixed'},
  {value: 'D', text: 'Daily'},
  {value: 'H', text: 'Hourly'},
  {value: 'W', text: 'Weekly'},
]

const PRIVILEGES = [
  {value: 'admin', text: 'Administrator', level: 9},
  {value: 'mgmt', text: 'Management', level: 8},
  {value: 'acct', text: 'Accounting', level: 7},
  {value: 'ops', text: 'Operations', level: 6},
  {value: 'rsvsA', text: 'Reservations-A', level: 5},
  {value: 'rsvsB', text: 'Reservations-B', level: 4},
  {value: 'rsvsC', text: 'Reservations-C', level: 3},
  {value: 'guest', text: 'Guest', level: 1},
];

const PRICETYPES = [
  {value: 'R', text: 'Regular'},
  {value: 'T1', text: 'Tiered'},
  {value: 'T2', text: 'Tiered Adult/Youth'},
]

const PMTBASE = [
  {value: 'F', text: 'Flat Amount'},
  {value: 'P', text: 'Per Person'},
  {value: '%', text: '% of Charge'},
  {value: 'Q', text: 'Per Item'},
  {value: 'U', text: 'User Day'},
  {value: 'D', text: 'Per Day/Per Item'},
];

const PMTDATE = [
  {value: 'B', text: 'Before Arrival'},
  {value: 'A', text: 'After Booking'},
  {value: 'S', text: 'Specific Date'},
]

const upper = function(x) {
  return String(x).toUpperCase();
}


// PARENT MODELS
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
        level: new Fields.Integer({null: true, default: 0, verbose: 'Level'}),
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
        template: new Fields.Char({null: true, maxLength: 10, verbose: 'Template'}),
        lastday: new Fields.Integer({null: true, default: 0, verbose: 'Last Day to Book'}),
        lasttime: new Fields.Time({null: true, verbose: 'Last Time to Book'}),
        supplied: new Fields.Boolean({default: true, verbose: 'Supplied'}),
        supplier: new Fields.Char({null: true, maxLength: 65, verbose: 'Supplier'}),
        suppitem: new Fields.Char({null: true, maxLength: 8, verbose: 'Item'}),
        supprate: new Fields.Integer({null: true, maxLength: 2, verbose: 'Rate#'}),
        gl1: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Sales GL-1'}),
        gl2: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Sales GL-2'}),
        gl3: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Sales GL-3'}),
        gl4: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Sales GL-4'}),
        gl1amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl2amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl3amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl4amt: new Fields.Float({null: true, default: 0, verbose: 'Amount'}),
        gl1perc: new Fields.Char({default: '%', verbose: '%/$'}),
        gl2perc: new Fields.Char({default: '%', verbose: '%/$'}),
        gl3perc: new Fields.Char({default: '%', verbose: '%/$'}),
        gl4perc: new Fields.Char({default: '%', verbose: '%/$'}),
        commgl: new Fields.Char({null: true, maxLength: 20, verbose: 'Commission GL'}),
        tax1: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Tax'}),
        tax2: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Tax'}),
        tax3: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Tax'}),
        tax4: new Fields.Char({null: true, maxLength: 20, onBeforeUpsert: nullify, verbose: 'Tax'}),
        narrbook: new Fields.Text({null: true, verbose: 'Narrative - Booking'}),
        narraddon: new Fields.Text({null: true, verbose: 'Narrative - Add-On'}),
        narroff: new Fields.Text({null: true, verbose: 'Narrative - Office'}),
        maxppl: new Fields.Integer({null: true, default: 0, verbose: 'Max Ppl/Item'}),
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
          {name: 'supplier', columns: ['supplier'], app, table: Supplier, tableColumns: ['code'], onDelete: 'NO ACTION'},
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

const Rates = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        rateno: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        pricelevel: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Pricing Levels'}),
        pmtterms: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Payment Terms'}),
        privilege: new Fields.Char({notNull: true, maxLength: 5, default: 'rsvsA', choices: PRIVILEGES, verbose: 'Privilege'}),
        ratebase1: new Fields.Char({notNull: true, maxLength: 5, default: 'P', choices: RATEBASE1, verbose: 'Rate Base-1'}),
        ratebase2: new Fields.Char({notNull: true, maxLength: 5, default: 'F', choices: RATEBASE2, verbose: 'Rate Base-2'}),
        addlppl: new Fields.Integer({notNull: true, default: 0, maxLength: 2, verbose: 'Addl Ppl'}),
      },

      constraints: {
        fk: [
          {name: 'pricelevel', columns: ['pricelevel'], app, table: Pricelevel, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'pmtterms', columns: ['pmtterms'], app, table: Pmtterms, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],

        index: [],
      },
      
      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Rates prototype'
    }      
  }
};

const Prices = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        rateno: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
        year: new Fields.Integer({notNull: true, maxLength: 4, verbose: 'Year'}),
        month: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Month'}),
        prices: new Fields.Jsonb({null: true, verbose: 'Prices'})        
      },

      constraints: {
        fk: [
        ],

        index: [],
      },
      
      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Prices prototype'
    }      
  }
};

const Minppl = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        rateno: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
        year: new Fields.Integer({notNull: true, maxLength: 4, verbose: 'Year'}),
        month: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Month'}),
        minppl: new Fields.Jsonb({null: true, verbose: 'Min Ppl'})        
      },

      constraints: {
        fk: [
        ],

        index: [],
      },
      
      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Min Ppl prototype'
    }      
  }
};

const Itemreseller = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        reseller: new Fields.Char({notNull: true, maxLength: 65, verbose: 'Reseller'}),
        rateno: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
        comm: new Fields.Float({null: true, maxLength: 6, verbose: 'Commission%'}),
      },

      constraints: {
        fk: [
        ],

        index: [],
      },
      
      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Item Reseller prototype'
    }      
  }
};

const Photo = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        path: new Fields.Char({notNull: true, maxLength: 200, verbose: 'Photo path'}),
      },

      constraints: {
        fk: [
        ],

        index: [],
      },
      
      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Item Photo prototype'
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
        actgroup: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Group'}),
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
};

const Actrates = class extends Rates {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
      },

      constraints: {
        pk: ['activity', 'rateno'],

        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['activity', 'rateno'],
      
      dbschema: '',
      app,
      desc: 'Activity Rates'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Actprices = class extends Prices {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
        hour: new Fields.Integer({null: true, maxLength: 2, verbose: 'Hour'}),
        minute: new Fields.Integer({null: true, maxLength: 2, verbose: 'Minute'}),
      },

      constraints: {
        pk: ['activity', 'rateno', 'year', 'month', 'hour', 'minute'],

        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['activity', 'rateno', 'year', 'month', 'hour', 'minute'],
      
      dbschema: '',
      app,
      desc: 'Activity Prices'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Actminp = class extends Minppl {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
      },

      constraints: {
        pk: ['activity', 'rateno', 'year', 'month'],

        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['activity', 'rateno', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Activity Minimum People'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Actsched = class extends Model {
  // sched: [31x {time: {boo, bow, limit}}]
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        year: new Fields.Integer({notNull: true, maxLength: 4, verbose: 'Year'}),
        month: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Month'}),
        sched: new Fields.Jsonb({null: true, verbose: 'Schedule'}) 
      },
      
      constraints: {
        pk: ['activity', 'year', 'month'],
        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['activity', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Activity Schedule'
    }
  }
};

const Actphoto = class extends Photo {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
      },

      constraints: {
        pk: ['activity', 'path'],

        fk: [
        ]
      },

      hidden: [],

      orderby: ['activity', 'path'],
      
      dbschema: '',
      app,
      desc: 'Activity Photos'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Actinclm = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static definition() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Activity'}),
        rateno: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
        seq: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Seq'}),
        day: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Day'}),
        dur: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Duration'}),
        offset: new Fields.Integer({notNull: true, maxLength: 3, verbose: 'Offset Minutes'}),
        meal: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Meal'}),
        mealrate: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
      },
      
      constraints: {
        pk: ['activity', 'rateno', 'seq'],
        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actrates', columns: ['activity', 'rateno'], app, table: Actrates, tableColumns: ['activity', 'rateno'], onDelete: 'NO ACTION'},
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'mealrates', columns: ['meal', 'mealrate'], app, table: Mealrates, tableColumns: ['meal', 'rateno'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['activity', 'rateno', 'day', 'meal'],
      
      dbschema: '',
      app,
      desc: 'Activity Included Meals'
    }
  }  
}

const Actreseller = class extends Itemreseller {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Activity'}),
      },
      
      constraints: {
        pk: ['activity', 'reseller'],
        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actrates', columns: ['activity', 'rateno'], app, table: Actrates, tableColumns: ['activity', 'rateno'], onDelete: 'NO ACTION'},
          {name: 'reseller', columns: ['reseller'], app, table: Reseller, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['activity', 'reseller'],
      
      dbschema: '',
      app,
      desc: 'Activity Resellers'
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

const Actdaily = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        dayno: new Fields.Integer({notNull: true, verbose: 'Day#'}),
        actres1: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Resource-1'}),
        actres2: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Resource-2'}),
        actres3: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Resource-3'}),
        actres4: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Resource-4'}),
        acttot1: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Time Total-1'}),
        acttot2: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Time Total-2'}),
        acttot3: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Time Total-3'}),
        acttot4: new Fields.Char({null: true, maxLength: 8, onBeforeUpsert: nullify, verbose: 'Time Total-4'}),
      },
      
      constraints: {
        pk: ['activity', 'dayno'],
        fk: [
          {name: 'activity', columns: ['activity'], app, table: Activity, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actres1', columns: ['actres1'], app, table: Actres, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actres2', columns: ['actres2'], app, table: Actres, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actres3', columns: ['actres3'], app, table: Actres, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actres4', columns: ['actres4'], app, table: Actres, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actttot1', columns: ['acttot1'], app, table: Actttot, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actttot2', columns: ['acttot2'], app, table: Actttot, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actttot3', columns: ['acttot3'], app, table: Actttot, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'actttot4', columns: ['acttot4'], app, table: Actttot, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['activity', 'dayno'],
      
      dbschema: '',
      app,
      desc: 'Activity Daily'
    }
  }
};

const Actres = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Resource Name'}),
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
      desc: 'Activity Resource Totals'
    }
  }
};

const Actttot = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Time Total Name'}),
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
      desc: 'Activity Time Totals'
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
        unitinv: new Fields.Boolean({null: true, default: true, verbose: 'Units on Invoice'}),
        bookbeds: new Fields.Boolean({null: true, default: true, verbose: 'Book Beds'}),
        assign: new Fields.Char({null: true, maxLength: 1, default: 'B', choices: ASSIGN, verbose: 'Assign unit'}),
        lastoffset: new Fields.Float({null: true, default: 0, verbose: 'Last Time Offset'}),
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

const Lodgrates = class extends Rates {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
        minnts: new Fields.Integer({notNull: true, default: 1, verbose: 'Min Nights'}),
        minchg: new Fields.Float({notNull: true, default: 0, verbose: 'Min Charge'}),
      },

      constraints: {
        pk: ['lodging', 'rateno'],

        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['lodging', 'rateno'],
      
      dbschema: '',
      app,
      desc: 'Lodging Rates'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Lodgprices = class extends Prices {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
      },

      constraints: {
        pk: ['lodging', 'rateno', 'year', 'month'],

        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['lodging', 'rateno', 'year', 'month', 'hour', 'minute'],
      
      dbschema: '',
      app,
      desc: 'Lodging Prices'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Lodgminp = class extends Minppl {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
      },

      constraints: {
        pk: ['lodging', 'rateno', 'year', 'month'],

        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['lodging', 'rateno', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Lodging Minimum People'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Lodginclm = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static definition() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Lodging'}),
        rateno: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
        seq: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Seq'}),
        day: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Day'}),
        dur: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Duration'}),
        meal: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Meal'}),
        mealrate: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Rate#'}),
      },
      
      constraints: {
        pk: ['lodging', 'rateno', 'seq'],
        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'lodgrates', columns: ['lodging', 'rateno'], app, table: Lodgrates, tableColumns: ['lodging', 'rateno'], onDelete: 'NO ACTION'},
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'mealrates', columns: ['meal', 'mealrate'], app, table: Mealrates, tableColumns: ['meal', 'rateno'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['lodging', 'rateno', 'day', 'meal'],
      
      dbschema: '',
      app,
      desc: 'Lodging Included Meals'
    }
  }  
}

const Lodgreseller = class extends Itemreseller {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Lodging'}),
      },
      
      constraints: {
        pk: ['lodging', 'reseller'],
        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'lodgrates', columns: ['lodging', 'rateno'], app, table: Lodgrates, tableColumns: ['lodging', 'rateno'], onDelete: 'NO ACTION'},
          {name: 'reseller', columns: ['reseller'], app, table: Reseller, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['lodging', 'reseller'],
      
      dbschema: '',
      app,
      desc: 'Lodging Resellers'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }  
}

const Lodgunit = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Code'}),
        seq: new Fields.Integer({null: true, verbose: 'Seq'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Unit Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        qtybeds: new Fields.Integer({null: true, default: '0', verbose: '# of Beds'}),
        desc: new Fields.Text({null: true, verbose: 'Description'}),
      },
      
      constraints: {
        pk: ['lodging', 'seq'],
        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['lodging', 'name'],
      
      dbschema: '',
      app,
      desc: 'Lodging Units'
    }
  }
};

const Lodgsched = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        year: new Fields.Integer({notNull: true, maxLength: 4, verbose: 'Year'}),
        month: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Month'}),
        sched: new Fields.Jsonb({null: true, verbose: 'Schedule'}),  // [day1, day2]  day1 = {unitseq: qty, ...} or {-1: qty} for non-unitized
      },
      
      constraints: {
        pk: ['lodging', 'year', 'month'],
        fk: [
          {name: 'lodging', columns: ['lodging'], app, table: Lodging, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['lodging', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Lodging Schedule'
    }
  }
};

const Lodgphoto = class extends Photo {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
      },

      constraints: {
        pk: ['lodging', 'path'],

        fk: [
        ]
      },

      hidden: [],

      orderby: ['lodging', 'path'],
      
      dbschema: '',
      app,
      desc: 'Lodging Photos'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

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

// Meals
const Meals = class extends Items {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meallocn: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Location'}),
        mealtype: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Type'}),
        durdays: new Fields.Integer({null: true, default: 1, verbose: 'Days'}),
        arroffset: new Fields.Integer({null: true, default: 0, verbose: 'Arrival Offset'}),
        lastoffset: new Fields.Float({null: true, default: 0, verbose: 'Last Time Offset'}),
        tipgl: new Fields.Char({null: true, maxLength: 20, verbose: 'Tip GL'}),
      },

      constraints: {
        fk: [
          {name: 'meallocn', columns: ['meallocn'], app, table: Meallocn, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'mealtype', columns: ['mealtype'], app, table: Mealtype, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'tipgl', columns: ['tipgl'], app, table: Glcode, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      dbschema: '',
      app,
      desc: 'Meals'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Mealrates = class extends Rates {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Meal'}),
        tipamt: new Fields.Float({null: true, default: 0, verbose: 'Tip Amount'}),
        tipbasis: new Fields.Boolean({default: true, verbose: 'Tip as %'}),
      },

      constraints: {
        pk: ['meal', 'rateno'],

        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['meal', 'rateno'],
      
      dbschema: '',
      app,
      desc: 'Meal Rates'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Mealprices = class extends Prices {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Meal'}),
      },

      constraints: {
        pk: ['meal', 'rateno', 'year', 'month'],

        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['activity', 'rateno', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Meal Prices'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Mealminp = class extends Minppl {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Meal'}),
      },

      constraints: {
        pk: ['meal', 'rateno', 'year', 'month'],

        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ]
      },

      hidden: [],

      orderby: ['meal', 'rateno', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Meals Minimum People'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Mealsched = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code'}),
        year: new Fields.Integer({notNull: true, maxLength: 4, verbose: 'Year'}),
        month: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Month'}),
        sched: new Fields.Jsonb({null: true, verbose: 'Schedule'}) 
      },
      
      constraints: {
        pk: ['meal', 'year', 'month'],
        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['meal', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Meal Schedule'
    }
  }
};

const Mealphoto = class extends Photo {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Meal'}),
      },

      constraints: {
        pk: ['meal', 'path'],

        fk: [
        ]
      },

      hidden: [],

      orderby: ['meal', 'path'],
      
      dbschema: '',
      app,
      desc: 'Meal Photos'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
}

const Mealreseller = class extends Itemreseller {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Meal'}),
      },
      
      constraints: {
        pk: ['meal', 'reseller'],
        fk: [
          {name: 'meal', columns: ['meal'], app, table: Meals, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'mealrates', columns: ['meal', 'rateno'], app, table: Mealrates, tableColumns: ['meal', 'rateno'], onDelete: 'NO ACTION'},
          {name: 'reseller', columns: ['reseller'], app, table: Reseller, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['meal', 'reseller'],
      
      dbschema: '',
      app,
      desc: 'Meal Resellers'
    }
  }
    
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }  
}

const Meallocn = class extends Model {
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
      desc: 'Meal Locations'
    }
  }
};

const Mealtype = class extends Model {
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
      desc: 'Meal Types'
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
        test: new Fields.Time({null: true, maxLength: 100, array: 1, verbose: 'Times'}),
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
        history: new Fields.Jsonb({verbose: 'Rate History'}),
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
      desc: 'Waivers'
    }
  }
};

const Template = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code', helptext: '1-8 character code to identify this waiver'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
        html: new Fields.Text({null: true, verbose: 'HTML'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Templates'
    }
  }
};

const Pricelevel = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code', helptext: '1-8 character code to identify this waiver'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
        type: new Fields.Char({null: true, maxLength: 2, default: 'R', choices: PRICETYPES, verbose: 'Type'}),
        desc1: new Fields.Char({null: true, maxLength: 15, verbose: 'Desc-1'}),
        desc2: new Fields.Char({null: true, maxLength: 15, verbose: 'Desc-2'}),
        desc3: new Fields.Char({null: true, maxLength: 15, verbose: 'Desc-3'}),
        desc4: new Fields.Char({null: true, maxLength: 15, verbose: 'Desc-4'}),
        desc5: new Fields.Char({null: true, maxLength: 15, verbose: 'Desc-5'}),
        desc6: new Fields.Char({null: true, maxLength: 15, verbose: 'Desc-6'}),
        addl: new Fields.Char({null: true, maxLength: 15, verbose: 'Addl'}),
        tier1min: new Fields.Integer({null: true, default: 1, verbose: 'Min'}),
        tier1max: new Fields.Integer({null: true, default: 19, verbose: 'Max'}),
        tier2min: new Fields.Integer({null: true, default: 20, verbose: 'Min'}),
        tier2max: new Fields.Integer({null: true, default: 39, verbose: 'Max'}),
        tier3min: new Fields.Integer({null: true, default: 40, verbose: 'Min'}),
        tier3max: new Fields.Integer({null: true, default: 59, verbose: 'Max'}),
        tier4min: new Fields.Integer({null: true, default: 60, verbose: 'Min'}),
        tier4max: new Fields.Integer({null: true, default: 79, verbose: 'Max'}),
        tier5min: new Fields.Integer({null: true, default: 80, verbose: 'Min'}),
        tier5max: new Fields.Integer({null: true, default: 99, verbose: 'Max'}),
        tier6min: new Fields.Integer({null: true, default: 100, verbose: 'Min'}),
        tier6max: new Fields.Integer({null: true, default: 999, verbose: 'Max'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Price Breakdowns'
    }
  }
};

const Pmtterms = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, onBeforeUpsert: upper, verbose: 'Code', helptext: '1-8 character code to identify this waiver'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),   
        pmtbase1: new Fields.Char({notNull: true, maxLength: 2, default: 'P', choices: PMTBASE, verbose: 'Pmt Basis'}),
        amt1: new Fields.Float({notNull: true, default: 0, verbose: 'Amount'}),
        datebase1: new Fields.Char({notNull: true, maxLength: 2, default: 'B', choices: PMTDATE, verbose: 'Date Basis'}),
        days1: new Fields.Integer({notNull: true, default: 0, verbose: 'Days'}),
        date1: new Fields.Date({null: true, verbose: 'Actual Date'}),
        pmtbase2: new Fields.Char({notNull: true, maxLength: 2, default: 'P', choices: PMTBASE, verbose: 'Pmt Basis'}),
        amt2: new Fields.Float({notNull: true, default: 0, verbose: 'Amount'}),
        datebase2: new Fields.Char({notNull: true, maxLength: 2, default: 'B', choices: PMTDATE, verbose: 'Date Basis'}),
        days2: new Fields.Integer({notNull: true, default: 0, verbose: 'Days'}),
        date2: new Fields.Date({null: true, verbose: 'Actual Date'}),
        pmtbase3: new Fields.Char({notNull: true, maxLength: 2, default: 'P', choices: PMTBASE, verbose: 'Pmt Basis'}),
        amt3: new Fields.Float({notNull: true, default: 0, verbose: 'Amount'}),
        datebase3: new Fields.Char({notNull: true, maxLength: 2, default: 'B', choices: PMTDATE, verbose: 'Date Basis'}),
        days3: new Fields.Integer({notNull: true, default: 0, verbose: 'Days'}),
        date3: new Fields.Date({null: true, verbose: 'Actual Date'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'name'],
      
      dbschema: '',
      app,
      desc: 'Payment Terms'
    }
  }
};       

const Reseller = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 65, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        email: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Email'}),
        apikey: new Fields.Char({notNull: true, maxLength: 50, verbose: 'API key'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        //items: new Fields.Jsonb({null: true, verbose: 'Items'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: '',
      app,
      desc: 'Resellers'
    }
  }
};

const Supplier = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 65, onBeforeUpsert: upper, verbose: 'Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Name'}),
        email: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Email'}),
        apikey: new Fields.Char({notNull: true, maxLength: 50, verbose: 'API key'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: '',
      app,
      desc: 'Suppliers'
    }
  }
};

module.exports = {
  Activity, 
  Actdaily, Actrates, Actprices, Actminp, 
  Actsched, Actinclm, Actreseller, Actphoto,
  Actgroup, Actres, Actttot, 

  Lodging,
  Lodgunit, Lodgrates, Lodgprices, Lodgminp, 
  Lodgsched, Lodginclm, Lodgreseller, Lodgphoto,
  Lodglocn, Lodgtype, 

  Meals,
  Mealrates, Mealprices, Mealminp,
  Mealsched, Mealreseller, Mealphoto,
  Meallocn, Mealtype,

  Area, Waiver, Template,
  Glcode, Tax,
  Pricelevel, Pmtterms,
  Reseller, Supplier,

  PRIVILEGES,
}