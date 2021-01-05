const root = process.cwd();
//const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);

const getUUIDV4 = function() {
  return uuidv4();
  //let uuid = crypto.randomBytes(16).toString("hex");

  //return `${uuid.substr(0,8)}-${uuid.substr(8,4)}-${uuid.substr(12,4)}-${uuid.substr(16,4)}-${uuid.substr(20)}`
}

const getTimestamp = function() {
  return (new Date()).toJSON();
}

const Db4admin = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.UUID({notNull: true, onBeforeInsert: getUUIDV4, verbose: 'Admin ID'}),
        first: new Fields.Char({notNull: true, maxLength: 40, verbose: 'First Name'}),
        last: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Last Name'}),
        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Primary Email'}),
        password: new Fields.Password({null: true, maxLength: 20, verbose: 'Password'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created Timestamp'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated Timestamp'}),

        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}) 
      },
      
      constraints: {
        pk: ['id'],
      },
      
      hidden: ['password'],
      
      orderBy: ['last', 'first'],
      
      dbschema: 'public',
      app,
      desc: 'Administrators'
    }
  }
};
  
const Db4workspace = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.UUID({notNull: true, onBeforeInsert: getUUIDV4, verbose: 'Workspace ID'}),
        name: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Workspace Name'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created Timestamp'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated Timestamp'}),
        admin: new Fields.UUID({notNull: true, verbose: 'Admin ID'}),
      },

      constraints: {
        pk: ['id'],
        fk: [{name: 'admin', columns: ['admin'], app, table: Db4admin, tableColumns: ['id'], onDelete: 'NO ACTION'}],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'public',
      app,
      desc: 'Workspaces'
    }
  }
};
  
const Db4app = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.UUID({notNull: true, onBeforeInsert: getUUIDV4, verbose: 'App ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'App Name'}),
        desc: new Fields.Text({null: true, verbose: 'App Description'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created Timestamp'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated Timestamp'}),
        workspace: new Fields.UUID({notNull: true, verbose: 'Workspace ID'}),
      },

      constraints: {
        pk: ['id'],
        fk: [{name: 'workspace', columns: ['workspace'], app, table: Db4workspace, tableColumns: ['id'], onDelete: 'NO ACTION'}],
        index: [{name: 'workspaceapp', columns: ['workspace', 'name']}]
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'public',
      app,
      desc: 'Applications'
    }
  }
};

const Db4table = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.UUID({notNull: true, onBeforeInsert: getUUIDV4, verbose: 'Table ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Table Name'}),
        desc: new Fields.Text({null: true, verbose: 'Table Description'}),
        columns: new Fields.Json({verbose: 'Columns'}),
        pks: new Fields.Json({verbose: 'PKs'}),
        fks: new Fields.Json({verbose: 'FKs'}),
        indexes: new Fields.Json({verbose: 'Indexes'}),
        orderby: new Fields.Json({verbose: 'Order By'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created Timestamp'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated Timestamp'}),        
        workspace: new Fields.UUID({notNull: true, verbose: 'Workspace ID'}),
        app: new Fields.UUID({notNull: true, verbose: 'App ID'}),
      },

      constraints: {
        pk: ['id'],
        fk: [
          {name: 'workspace', columns: ['workspace'], app, table: Db4workspace, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'app', columns: ['app'], app, table: Db4app, tableColumns: ['id'], onDelete: 'NO ACTION'}
        ],
        index: [{name: 'workspaceapptable', columns: ['workspace', 'app', 'name']}]
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'public',
      app,
      desc: 'Tables'
    }
  }
};

module.exports = {Db4admin, Db4workspace, Db4app, Db4table};