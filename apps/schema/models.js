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

const user = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Admin ID'}),
        first: new Fields.Char({notNull: true, maxLength: 40, verbose: 'First Name'}),
        last: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Last Name'}),
        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Primary Email'}),
        password: new Fields.Password({null: true, maxLength: 20, verbose: 'Password'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),

        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}) 
      },
      
      constraints: {
        pk: ['id'],
      },
      
      hidden: ['password'],
      
      orderBy: ['last', 'first'],
      
      dbschema: 'public',
      app,
      desc: 'Users'
    }
  }
};

const database = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Workspace ID'}),
        name: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Workspace Name'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'public',
      app,
      desc: 'Databases'
    }
  }
};

const workspace = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Workspace ID'}),
        name: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Workspace Name'}),
        database: new Fields.SUUID({null: true, verbose: 'Workspace ID'}),        
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),
      },

      constraints: {
        pk: ['id'],
        fk: [{name: 'database', columns: ['database'], app, table: database, tableColumns: ['id'], onDelete: 'NO ACTION'}],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'public',
      app,
      desc: 'Workspaces'
    }
  }
};
  
const application = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'App ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'App Name'}),
        desc: new Fields.Text({null: true, verbose: 'App Description'}),
        workspace: new Fields.SUUID({notNull: true, verbose: 'Workspace ID'}),        
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),
      },

      constraints: {
        pk: ['id'],
        fk: [{name: 'workspace', columns: ['workspace'], app, table: workspace, tableColumns: ['id'], onDelete: 'NO ACTION'}],
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

const table = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Table ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Table Name'}),
        desc: new Fields.Text({null: true, verbose: 'Table Description'}),
        columns: new Fields.Json({verbose: 'Columns'}),
        pk: new Fields.Json({default: '[]', verbose: 'PK'}),
        fks: new Fields.Json({default: '[]', verbose: 'FKs'}),
        indexes: new Fields.Json({default: '[]', verbose: 'Indexes'}),
        orderby: new Fields.Json({default: '[]', verbose: 'Order By'}),
        workspace: new Fields.SUUID({notNull: true, verbose: 'Workspace ID'}),
        app: new Fields.SUUID({notNull: true, verbose: 'App ID'}),        
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),        
      },

      constraints: {
        pk: ['id'],
        fk: [
          {name: 'workspace', columns: ['workspace'], app, table: workspace, tableColumns: ['id'], onDelete: 'NO ACTION'},
          {name: 'app', columns: ['app'], app, table: application, tableColumns: ['id'], onDelete: 'NO ACTION'}
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

const query = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Table ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Query Name'}),
        desc: new Fields.Text({null: true, verbose: 'Query Description'}),
        table: new Fields.SUUID({notNull: true, verbose: 'Table ID'}),        
        columns: new Fields.Json({verbose: 'Columns'}),
        where: new Fields.Text({null: true, verbose: 'Where clause'}),
        limit: new Fields.Integer({null: true, verbose: 'Limit'}),
        offset: new Fields.Integer({null: true, verbose: 'Offset'}),
        orderby: new Fields.Json({verbose: 'Orderby'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),        
      },

      constraints: {
        pk: ['id'],
        fk: [
          {name: 'table', columns: ['table'], app, table: table, tableColumns: ['id'], onDelete: 'NO ACTION'},
        ],
        index: [{name: 'querytable', columns: ['table']}]
      },
      
      hidden: [],
      
      orderBy: ['table','name'],
      
      dbschema: 'public',
      app,
      desc: 'Queries'
    }
  }
};

const bizprocess = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Process ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Process Name'}),
        desc: new Fields.Text({null: true, verbose: 'Process Description'}),
        trigger: new Fields.Char({notNull: true, maxLength: 1, verbose: 'Trigger Type'}),
        eventid: new Fields.SUUID({notNull: true, verbose: 'Event ID'}),
        timer: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Timer Config'}),
        initdata: new Fields.Json({verbose: 'Initial Dataschema'}),
        respdata: new Fields.Json({verbose: 'Response Dataschema'}),
        steps: new Fields.Json({verbose: 'Steps'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),        
      },

      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: 'public',
      app,
      desc: 'Processes'
    }
  }
};

module.exports = {database, workspace, application, table, query, bizprocess};