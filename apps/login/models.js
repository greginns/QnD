const root = process.cwd();
const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const app = 'login';

var setNewDate = function() {
  return new Date();
};

const User =  class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 10, verbose: 'User Code'}),
        name: new Fields.Char({notNull: true, maxLength: 30, verbose: 'User Name'}),
        email: new Fields.Char({notNull: true, maxLength: 50, isEmail: true, verbose: 'Email Address'}),
        password: new Fields.Password({notNull: true, minLength: 8, maxLength: 128, verbose: 'Password'}),
        group: new Fields.Char({null: true, verbose: 'Group Code'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),     
      },
      
      constraints: {
        pk: ['code'],
        fk: [{name: 'group', columns: ['group'], app, table: Group, tableColumns: ['code'], onDelete: 'NO ACTION'}],
      },
      
      hidden: ['password'],
      
      orderBy: ['name'],
      
      dbschema: '',
      app
    }
  }
};

const Group =  class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        code: new Fields.Char({notNull: true, maxLength: 10, verbose: 'Group Code'}),
        name: new Fields.Char({notNull: true, maxLength: 30, verbose: 'Group Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),     
      },
      
      constraints: {
        pk: ['code'],
      },
      
      orderBy: ['name'],
      
      dbschema: '',
      app
    }
  }
};

const CSRF = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        token: new Fields.Char({notNull: true, maxLength: 128, verbose: 'CSRF Token'}),
        user: new Fields.Char({null: true, maxLength: 10, verbose: 'User Code'}),
        issued: new Fields.DateTime({notNull: true, maxLength: 30, onBeforeInsert: setNewDate, verbose: 'Issued On'}),
      },
      
      constraints: {
        pk: ['token'],
        fk: [{name: 'user', columns: ['user'], table: User, tableColumns: ['code'], onDelete: 'NO ACTION'}],
      },
      
      orderBy: ['issued'],
      
      dbschema: '',
      app
    }
  }
};

module.exports = {User, Group, CSRF};