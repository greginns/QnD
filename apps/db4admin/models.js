const root = process.cwd();
//const uuidv4 = require('uuid/v4');
const short = require('short-uuid');
const shortUUID = short();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);

//const getUUIDV4 = function() {
// 36 characters
//  return short.uuid();
//}

const getSUUID = function() {
  // 22 characters
  return shortUUID.new();
}

const getTimestamp = function() {
  return (new Date()).toJSON();
}

const Account = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'User ID'}),
        first: new Fields.Char({notNull: true, maxLength: 40, verbose: 'First Name'}),
        last: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Last Name'}),
        email: new Fields.Char({null: true, maxLength: 60, isEmail: true, verbose: 'Primary Email'}),
        password: new Fields.Password({null: true, maxLength: 60, verbose: 'Password'}),
        database: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Database ID'}),
        isactive: new Fields.Boolean({notNull: true, default: true, verbose: 'Is Active'}),
        billinginfo: new Fields.Json({verbose: 'Billing Info'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),

        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}) 
      },
      
      constraints: {
        pk: ['id'],
        index: [{name: 'email', columns: ['email']}]
      },
      
      hidden: ['password'],
      
      orderBy: ['last', 'first'],
      
      dbschema: 'public',
      app,
      desc: 'Account holders'
    }
  }
};

const Admin = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'User ID'}),
        first: new Fields.Char({notNull: true, maxLength: 40, verbose: 'First Name'}),
        last: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Last Name'}),
        email: new Fields.Char({null: true, maxLength: 60, isEmail: true, verbose: 'Primary Email'}),
        password: new Fields.Password({null: true, maxLength: 60, verbose: 'Password'}),
        isactive: new Fields.Boolean({notNull: true, default: true, verbose: 'Is Active'}),
        isowner: new Fields.Boolean({notNull: true, default: false, verbose: 'Is Admin'}),
        authinfo: new Fields.Json({verbose: 'Authorization Info'}),
        account: new Fields.SUUID({notNull: true, verbose: 'Account ID'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),

        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}) 
      },
      
      constraints: {
        pk: ['id'],
        index: [{name: 'email', columns: ['email']}]
      },
      
      hidden: ['password'],
      
      orderBy: ['last', 'first'],
      
      dbschema: 'public',
      app,
      desc: 'Account admins'
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
        token: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'CSRF token'}),
        admin: new Fields.Char({notNull: true, maxLength: 22, verbose: 'Admin ID'}),
        session: new Fields.Char({null: true, maxLength: 22, verbose: 'Session ID'}),
        issued: new Fields.DateTime({notNull: true, maxLength: 30, onBeforeInsert: getTimestamp, verbose: 'Issued On'}),
      },
      
      constraints: {
        pk: ['token'],
        fk: [{name: 'admin', columns: ['admin'], table: Admin, tableColumns: ['id'], onDelete: 'NO ACTION'}],
      },
      
      orderBy: ['issued'],
      
      dbschema: 'public',
      app
    }
  }
};

const Session = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        token: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Session token'}),
        data: new Fields.Json({verbose: 'Session Data'}),
        issued: new Fields.DateTime({notNull: true, maxLength: 30, onBeforeInsert: getTimestamp, verbose: 'Issued On'}),
      },
      
      constraints: {
        pk: ['token'],
      },
      
      orderBy: ['issued'],
      
      dbschema: 'public',
      app
    }
  }
};

module.exports = {Account, Admin, CSRF, Session};