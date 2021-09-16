const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {Company} = require(root + '/apps/contacts/models.js');
const app = getAppName(__dirname);

const Items = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static parent() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 8, verbose: 'Item Code'}),
        name: new Fields.Char({notNull: true, maxLength: 50, verbose: 'Item Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        company: new Fields.Char({null: true, maxLength: 1, verbose: 'Company'}),
        areaphy: new Fields.Char({null: true, maxLength: 2, verbose: 'Physical Area'}),
        areadir: new Fields.Char({null: true, maxLength: 2, verbose: 'Directions Area'}),
        minage: new Fields.Integer({null: true, default: 12, verbose: 'Minimum Age'}),
        allowinf: new Fields.Boolean({default: true, verbose: 'Infants'}),
        allowchl: new Fields.Boolean({default: true, verbose: 'Children'}),
        allowyth: new Fields.Boolean({default: true, verbose: 'Youth'}),
        allowadl: new Fields.Boolean({default: true, verbose: 'Adults'}),
        allowsen: new Fields.Boolean({default: true, verbose: 'Seniors'}),
        online: new Fields.Boolean({default: true, verbose: 'Book Online'}),
        homepage: new Fields.Char({null: true, maxLength: 100, verbose: 'Home Page'}),
        tandc: new Fields.Text({null: true, verbose: 'Additional Terms and Conditions'}),
        rsvmsg: new Fields.Text({null: true, verbose: 'Booking Message'}),
        oninv: new Fields.Boolean({default: true, verbose: 'On Invoice'}),
        invmsg: new Fields.Text({null: true, verbose: 'Invoice Note'}),
        waiver: new Fields.Char({null: true, maxLength: 10, verbose: 'Waiver'}),
        lastday: new Fields.Integer({null: true, default: 0, verbose: 'Last Day to Book'}),
        lasttime: new Fields.Time({null: true, verbose: 'Last Time to Book'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [
          {name: 'company', columns: ['company'], app, table: Company, tableColumns: ['id'], onDelete: 'NO ACTION'},
        ],
        index: [
          {name: 'email', columns: ['email'], unique: true},
        ],
      },
      
      hidden: [],
      
      orderBy: ['-active', 'code'],
      
      dbschema: '',
      app,
      desc: 'Item prototype'
    }
  }

  static merge(target, source) {
    // schema is merged
    for (let key in source.schema) {
      target.schema[key] = source.schema[key];
    }

    // constraints: pk is replaced, fk are merged, index is merged
    if ('constraints' in source) {
      if (source.constraints.pk) target.constraints.pk = source.constraints.pk;

      if (source.constraints.fk) {
        for (let key in source.constraints.fk) {
          target.constraints.fk[key] = source.constraints.fk[key];
        }
      }

      if (source.constraints.index) {
        for (let key in source.constraints.index) {
          target.constraints.index[key] = source.constraints.index[key];
        }
      }
    }

    // hidden is merged, orderby is replaced, dbschema is replaced, app is replaced, desc is replaced
    for (let key of source.hidden) {
      target.hidden.push(key);
    }

    if (source.orderBy) target.orderBy = source.orderBy;
    if (source.dbschema) target.dbschema = source.dbschema;
    if (source.app) target.app = source.app;
    if (source.desc) target.desc = source.desc;
    
    return target;
  }
};

const Activity = class extends Items {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        actgroup: new Fields.Char({null: true, maxLength: 10, verbose: 'Group'}),
        durdays: new Fields.Integer({null: true, default: 1, verbose: 'Duration Days'}),
        durhours: new Fields.Integer({null: true, default: 6, verbose: 'Duration Hours'}),
        multi: new Fields.Boolean({default: false, verbose: 'Daily Start'}),
        assatarr: new Fields.Boolean({default: false, verbose: 'Assign Time at Arrival'}),
        arroffset: new Fields.Integer({null: true, default: 0, verbose: 'Arrival Offset'}),
        lastoffset: new Fields.Integer({null: true, default: 0, verbose: 'Last Time Offset'}),
      },

      constraints: {

      },

      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Activities'
    }
  }

  static definition() {
    return this.merge(this.parent(), this.child());
  }
}

const Lodging = class extends Items {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static child() {
    return {
      schema: {
        unitized: new Fields.Boolean({null: true, default: true, verbose: 'Unitized'}),
      },

      constraints: {

      },

      hidden: [],
      
      dbschema: '',
      app,
      desc: 'Lodging'
    }
  }

  static definition() {
    return this.merge(this.parent(), this.child());
  }
}

console.log(Activity.definition())
console.log(Lodging.definition())
//export {Activity, Lodging}