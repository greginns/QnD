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
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'User ID'}),
        first: new Fields.Char({notNull: true, maxLength: 40, verbose: 'First Name'}),
        last: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Last Name'}),
        email: new Fields.Char({null: true, maxLength: 50, isEmail: true, verbose: 'Primary Email'}),
        password: new Fields.Password({null: true, maxLength: 20, verbose: 'Password'}),
        workspace: new Fields.SUUID({notNull: true,  verbose: 'Workspace ID'}),
        apikey: new Fields.Char({null: true, maxLength: 45, verbose: 'API key'}),
        tacl: new Fields.Json({default: '[]', verbose: 'Table Access Control'}),
        pacl: new Fields.Json({default: '[]', verbose: 'Process Access Control'}),
        created: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, verbose: 'Created on'}),
        updated: new Fields.DateTime({notNull: true, onBeforeInsert: getTimestamp, onBeforeUpdate: getTimestamp, verbose: 'Updated on'}),

        fullname: new Fields.Derived({defn: 'concat("first",\' \',"last")', verbose: 'Contact Name'}) 
      },
      
      constraints: {
        pk: ['id'],
        fk: [{name: 'workspace', columns: ['workspace'], app, table: workspace, tableColumns: ['id'], onDelete: 'NO ACTION'}],
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
        database: new Fields.SUUID({notNull: true, verbose: 'Database ID'}),
        domains: new Fields.Json({default: '[]', verbose: 'Allowed Domains'}),        
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
        rfks: new Fields.Json({default: '[]', verbose: 'Reverse FKs'}),
        indexes: new Fields.Json({default: '[]', verbose: 'Indexes'}),
        orderby: new Fields.Json({default: '[]', verbose: 'Order By'}),
        workspace: new Fields.SUUID({notNull: true, verbose: 'Workspace ID'}),
        app: new Fields.SUUID({notNull: true, verbose: 'App ID'}),     
        apiacl: new Fields.Json({default: {"one": false, "many": false, "create": false, "update": false, "delete": false}, verbose: 'API ACL'}),   // one, many, create, update, delete
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
        orderby: new Fields.Json({verbose: 'Orderby'}),
        sql: new Fields.Text({null: true, verbose: 'Generated SQL'}),
        valueobj: new Fields.Json({verbose: 'Values object'}),
        api: new Fields.Boolean({default: false, verbose: 'API Access'}),
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
        trigger: new Fields.Char({null: true, maxLength: 1, verbose: 'Trigger Type'}),
        eventid: new Fields.SUUID({null: true, verbose: 'Event ID'}),
        timer: new Fields.Char({null: true, maxLength: 20, verbose: 'Timer Config'}),
        initdata: new Fields.Json({verbose: 'Initial Dataschema'}),
        respdata: new Fields.Json({verbose: 'Response Dataschema'}),
        steps: new Fields.Json({verbose: 'Steps'}),
        api: new Fields.Boolean({default: false, verbose: 'API Access'}),
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

const code = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Code ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Function Name'}),
        tag: new Fields.Char({null: true, maxLength: 100, verbose: 'Tag'}),
        desc: new Fields.Text({null: true, verbose: 'Description'}),
        code: new Fields.Text({null: true, verbose: 'Code'}),
        type: new Fields.Char({notNull: true, maxLength: 2, verbose: 'Usage'}),
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
      desc: 'Code'
    }
  }
};

const codebundle = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.SUUID({notNull: true, onBeforeInsert: getSUUID, verbose: 'Bundle ID'}),
        name: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Bundle Name'}),
        desc: new Fields.Text({null: true, verbose: 'Bundle Description'}),
        bundle: new Fields.Json({null: true, verbose: 'Functions'}),
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
      desc: 'Code Bundles'
    }
  }
};

module.exports = {user, database, workspace, application, table, query, bizprocess, code, codebundle};