const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {Activity, Actres, Actttot, Lodging, Meals} = require(root + '/apps/items/models.js');

const app = getAppName(__dirname);

const Booked = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        year: new Fields.Integer({notNull: true, maxLength: 4, verbose: 'Year'}),
        month: new Fields.Integer({notNull: true, maxLength: 2, verbose: 'Month'}),
        booked: new Fields.Jsonb({null: true, verbose: 'Bookings'}) 
      },
      
      constraints: {
        fk: [],
      },
      
      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Bookings Prototype'
    }
  }
};

const Activitybooked = class extends Booked {
  // booked:
  //    31x [{time: {booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx}, ]}, }, ] 
  //    one {} for all times in a day, one {} for each rsv daily
  //
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        activity: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity'}),
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
      desc: 'Activity Bookings'
    }
  }
  
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Actresbooked = class extends Booked {
  // booked:
  //    31x [{booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx}, ]}, ] 
  //    one total for a day, one {} for each rsv daily
  //
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        actres: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity Resource'}),
      },
      
      constraints: {
        pk: ['actres', 'year', 'month'],
        fk: [
          {name: 'actres', columns: ['actres'], app, table: Actres, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['actres', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Activity Resource Bookings'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Actttotbooked = class extends Booked {
  // booked:
  //    31x [{time: {booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx}, ]}, }, ] 
  //    one {} for all times in a day, one {} for each rsv daily
  //
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        actttot: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Activity Resource'}),
      },
      
      constraints: {
        pk: ['actttot', 'year', 'month'],
        fk: [
          {name: 'actttot', columns: ['actttot'], app, table: Actttot, tableColumns: ['code'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['actttot', 'year', 'month'],
      
      dbschema: '',
      app,
      desc: 'Activity Time Total Bookings'
    }
  }

  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Lodgingbooked = class extends Booked {
  // booked:
  //    31x [{unitseq: {booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx, seq3: xx}, ]}}, ] 
  //    one {} for all units, one {} for each rsv daily
  //    mostly have only one daily entry, except for non-unitized and book beds, where more than one item can be in the same unit.
  //
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        lodging: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Lodging'}),
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
      desc: 'Lodging Bookings'
    }
  }
    
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

const Mealbooked = class extends Booked {
  // booked:
  //    31x [{time: xx, booked: xx, daily: [{rsvno: xx, seq1: xx, seq2: xx, day: xx}, ]}, ] 
  //    one {} for each time, one {} for each rsv daily
  //
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        meal: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Meal'}),
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
      desc: 'Meal Bookings'
    }
  }
    
  static definition() {
    return this.mergeSchemas(this.parent(), this.child());
  }
};

module.exports = {
  Activitybooked, Actresbooked, Actttotbooked, Lodgingbooked, Mealbooked
};