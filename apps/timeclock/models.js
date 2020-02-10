const root = process.cwd();
const Fields = require(root + '/server/model/modelFields');
const Model = require(root + '/server/model/modelRun.js');
const login_User = require(root + '/apps/login/models/models.js').User;
const app = 'timeclock';

const Department = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Dept Code'}),
        name: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Dept Name'}),
        mgr: new Fields.Char({null: true, verbose: 'Manager'}),
        password: new Fields.Password({minLength: 8, maxLength: 128, verbose: 'Password'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [{name: 'mgr', columns: ['mgr'], app, table: Employee, tableColumns: ['code'], onDelete: 'NO ACTION'}],
      },
      
      hidden: ['password'],
      
      orderBy: ['name'],
      
      dbschema: 'tenant',
    }
  }
};

const Employee =  class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Code'}),
        first: new Fields.Char({notNull: true, maxLength: 20, verbose: 'First Name'}),
        last: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Last Name'}),
        address: new Fields.Char({maxLength: 30, verbose: 'Address'}),
        city: new Fields.Char({maxLength: 30, verbose: 'City'}),
        state: new Fields.Char({maxLength: 2, verbose: 'State'}),
        zipcode: new Fields.Char({maxLength: 10, verbose: 'Zipcode'}),
        phone: new Fields.Char({maxLength: 15, verbose: 'Telephone'}),
        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Email Address'}),
        ssn: new Fields.Char({maxLength: 10, verbose: 'SSN'}),
        password: new Fields.Password({notNull: true, minLength: 8, maxLength: 128, verbose: 'Password'}),
        dept: new Fields.Char({null: true, maxLength: 10, verbose: 'Department'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),    
        name: new Fields.Derived({defn: 'concat("Employee"."last",\', \',"Employee"."first")', verbose: 'Employee Name'}) 
      },
      
      constraints: {
        pk: ['code'],
        fk: [{name: 'dept', columns: ['dept'], app, table: Department, tableColumns: ['code'], onDelete: 'NO ACTION'}],
      },
      
      hidden: ['password'],
      
      orderBy: ['last', 'first'],
      
      dbschema: 'tenant',
    }
  }
};
  
const Workcode = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Work Code'}),
        desc: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Description'}),
        dept: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Department'}),
        method: new Fields.Char({notNull: true, maxLength: 1, 
          choices: [
            {value: 'H', text: 'Hourly'},
            {value: 'D', text: 'Daily'},
            {value: 'F', text: 'Flat'},
            {value: 'T', text: 'Tip'}
          ], 
          verbose: 'Method'}
        ),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
      },
      
      constraints: {
        pk: ['code'],
        fk: [{name: 'dept', columns: ['dept'], app, table: Department, tableColumns: ['code'], onDelete: 'NO ACTION'}],
      },
      
      orderBy: ['desc'],
      
      dbschema: 'tenant',
    }
  }
};
      
const Empwork = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({}),
        employee: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Employee Code'}),
        workcode: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Work Code'}),
        payrate: new Fields.Decimal({nulNull: true, maxLength: 9, min: 0.00, max: 999999.99, step: .1, verbose: 'Pay Rate'})
      },
      
      constraints: {
        pk: ['id'],
        fk: [{name: 'employee', columns: ['employee'], app, table: Employee, tableColumns: ['code'], onDelete: 'NO ACTION'},
              {name: 'workcode', columns: ['workcode'], app, table: Workcode, tableColumns: ['code'], onDelete: 'NO ACTION'}],
      },
      
      orderBy: ['employee', 'workcode'],
      
      dbschema: 'tenant',
    }
  }
};

const Work = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }

  static definition() {
    return {
      schema: {
        id: new Fields.Serial({}),
        employee: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Employee Code'}),
        workcode: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Work Code'}),
        sdate: new Fields.Date({notNull: true, verbose: 'Start Date'}),
        stime: new Fields.Time({notNull: true, verbose: 'Start Time'}),
        edate: new Fields.Date({null: true, verbose: 'End Date'}),
        etime: new Fields.Time({null: true, 
          test: function(record) { // test if sdate+stime <= edate+etime
            var dt, sdt, edt;
        
            if (record.sdate && record.stime && record.edate && record.etime) {
              [dt, tm] = record.sdate.split('T');
              sdt = new Date(dt + 'T' + record.stime);
          
              [dt, tm] = record.edate.split('T');
              edt = new Date(dt + 'T' + record.etime);
          
              if (sdt > edt) return 'Clock In is after Clock Out';
            }
          
            return null;
          },
          verbose: 'End Time'}
        ),
        hours: new Fields.Float({null: true, verbose: 'Hours Worked'}),
        tip: new Fields.Float({null: true, verbose: 'Tips'}),
      },
      
      constraints: {
        pk: ['id'],
        fk: [
          {name: 'employee', columns: ['employee'], app, table: Employee, tableColumns: ['code'], onDelete: 'NO ACTION'},
          {name: 'workcode', columns: ['workcode'], app, table: Workcode, tableColumns: ['code'], onDelete: 'NO ACTION'}
        ],
      },
      
      orderBy: ['employee', '-sdate', '-stime', '-etime'],
      
      dbschema: 'tenant',
    }
  }
};
  
const Payroll = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({}),
        sdate: new Fields.Date({notNull: true, verbose: 'Pay Period Start Date'}),
        user: new Fields.Char({notNull: true, maxLength: 10, verbose: 'User Code'}),
        rundate: new Fields.DateTime({notNull: true, maxLength: 30, 
          onBeforeInsert: function() {return new Date()}, 
          verbose: 'Run Date/Time'}
        ),
        html: new Fields.Text({null: true, verbose: 'HTML'}),
      },
      
      constraints: {
        pk: ['id'],
        fk: [{name: 'user', columns: ['user'], app: 'login', table: login_User, tableColumns: ['code'], onDelete: 'NO ACTION'}],
      },
      
      orderBy: ['-sdate'],
      
      dbschema: 'tenant',
    }
  }
};

module.exports = {Department, Employee, Workcode, Empwork, Work, Payroll};