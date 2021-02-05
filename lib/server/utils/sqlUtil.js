const root = process.cwd();
const db = require(root + '/lib/server/utils/db.js');
const config = require(root + '/config.json');
const models = {}

config.apps.forEach(function(app) {
  models[app] = require(root + `/apps/${app}/models.js`);
})

const jsonQueryExecify = async function({database = '', pgschema = '', query={}, app='', values=[]} = {}) {
  let text = module.exports.jsonToQuery(query, app, pgschema);
  let tm = await module.exports.execQuery(database, {text, values});

  if (tm.status == 200) tm.data = module.exports.objectify(tm.data);
  return tm;
};

const jsonToQuery = function(query, app, pgschema) {
  // [S]ingle quote for [S]trings, [D]ouble quote for things(in the [D]atabase)
  let sql = '';
  let colList = [];
  let joins = [];
  let keys = Object.keys(query);
  let mainTable = keys[0];
  
  let doJoin = function(tblA, tblB, jon) {
    if (!jon) {
      var jona = [];
      var fks = models[app][tblA].getConstraints().fk;
      
      jon = `INNER JOIN "${pgschema}"."${tblB}" AS "${tblB}" ON `;
      
      fks.forEach(function(fk) {
        if (fk.table.name == tblB) {
          let colsA = fk.columns;
          let colsB = fk.tableColumns;      
          
          colsA.forEach(function(col, idx) {
            jona.push(`"${tblA}"."${col}" = "${tblB}"."${colsB[idx]}"`);
          })
        }
      })
      
      jon += jona.join(', ');
    }

    return jon;
  }

  let doOrderby = function(orderBy) {
    if (orderBy.length > 0) {
      let obs = [];
      
      orderBy.forEach(function(tblDef) {

        let tbl = Object.keys(tblDef)[0];
        let cols = Object.values(tblDef)[0];
        var schema = models[app][tbl].getSchema();

        cols.forEach(function(col) {
          if (schema[col].constructor.name == 'Derived') {
            var fn, order;
            
            if (col.substr(0,1) == '-') {
              fn = col.substr(1);
              order = 'DESC';
            }
            else {
              fn = col;
              order = 'ASC';
            }
          
            obs.push(`"${tbl}.${fn}" ${order}`);                              
          }
          else {
            let ad = (col.substr(0,1) == '-') ? `"${col.substr(1)}" DESC` : `"${col}" ASC`;
          
            obs.push(`"${tbl}".${ad}`);                
          }

        });
      })    
      
      return `ORDER BY ${obs.join(', ')}`;
    }
    else {
       return models[app][mainTable].makeOrderBy();
    }
  }

  let swallow = function(tblA, tblADefn, isMainTable, joinName) {
    if (! ('columns' in tblADefn)) tblADefn.columns = ['*'];

    var cols = models[app][tblA].getColumnList({cols: tblADefn.columns || ['*'], isMainTable, joinName})

    if (cols.length > 0) colList = colList.concat(cols);  
    
    (tblADefn.innerJoin || []).forEach(function(ij) {
      let tblB = Object.keys(ij)[0];
      let jon = ij[tblB].on || '';
      
      joins.push(doJoin(tblA, tblB, jon));
      
      swallow(tblB, ij[tblB], false, true);
    })   
  }

  swallow(mainTable, query[mainTable], true, false);    

  sql += `SELECT ${colList.join(',')}\n`;
  sql += `FROM "${pgschema}"."${app}_${mainTable}" AS "${app}_${mainTable}"\n`;   // 
  sql += joins.join('\n');
  sql += (query[mainTable].where) ? '\nWHERE ' + query[mainTable].where : '';    
  sql += '\n' + doOrderby(query[mainTable].orderBy || []);

  return sql;      
};

const objectify = function(data) {
  // turn flat table.col fields into table: {cols}
  // works on a {} or [], returning the same
  let isArray = true;
  let kx = [];

  if (!Array.isArray(data)) {
    data = [data];    
    isArray = false;
  }

  data.forEach(function(row) {
    Object.keys(row).forEach(function(k) {
      if (k.indexOf('.') > -1) {
        kx = k.split('.') // only ever 2 levels deep, ie Department.code
        if (!(kx[0] in row)) row[kx[0]] = {};
        row[kx[0]][kx[1]] = row[k];
        delete row[k];
      }
    })
  })

  return (isArray) ? data : data[0];
};

const execQuery = async function(database, stmt) {
  return await db.exec(database, stmt);
};

const shutdown = async function() {
  return await db.shutdown();
};

class SqlBuilder {
  constructor(pgschema) {
    this.pgschema = pgschema;

    if (!this.pgschema) console.error('Call to SqlBuilder without pgschema');
  }

  static createUser(user, pswd) {
    if (!user) return this._missing('User');
    if (!pswd) return this._missing('Password');

    let sql = `CREATE USER "${user}" PASSWORD "${pswd}"`;
    sql += `REVOKE ALL PRIVILEGES ON SCHEMA public FROM "${user}"`

    return [sql];
  }

  static createSchema(pgschema, user) {
    // not pg_, must start with a-z, A-Z, then a-z,A-Z,0-9,_
    if (!pgschema) return this._missing('Schema');
    if (!user) return this._missing('User');

    let sql = `CREATE SCHEMA IF NOT EXISTS "${pgschema}";`;
    //sql += `ALTER USER "${user}" SET search_path = "${pgschema}";`;
    //sql += `GRANT USAGE ON SCHEMA "${pgschema}" TO "${user}";`;

    return [sql];
  }

  static dropSchema(pgschema) {
    if (!pgschema) return this._missing('Schema');

    return [`DROP SCHEMA IF EXISTS "${pgschema}" CASCADE;`];
  }

  createTable(appName, tableName) {
    // build with one temporary column
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');

    let fullName = this._makeFullTableName(appName, tableName);

    return [`CREATE TABLE ${fullName} (_temp integer PRIMARY KEY);`];
  }

  renameTable(appName, tableName, newName) {
    // *** NOT READY - must redo all FKs first
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');
    if (!newName) return this._missing('New Table Name');

    let alter = this._makeAlterTable(appName, tableName);    
    let newfullName = this._makeFullTableName(appName, newName);

    alter += `RENAME TO ${newfullName}`

    return [alter];
  }

  dropTable(appName, tableName) {
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');

    let fullName = this._makeFullTableName(appName, tableName);

    return [`DROP TABLE IF EXISTS ${fullName};`];
  }

  createColumn(appName, tableName, colParams) {
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');
    if (!colParams.name) return this._missing('Column Name');
   
    let [build, err] = ColumnBuilder.create(colParams);

    if (err) return this._missing(err);

    let alter = this._makeAlterTable(appName, tableName);

    alter += 'DROP COLUMN IF EXISTS "_temp",\n';
    alter += build + ';';

    return [alter];
  }

  alterColumn(appName, tableName, colParams, oldParams) {
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');
    if (!colParams.name) return this._missing('Column Name');    

    let alter = this._makeAlterTable(appName, tableName);
    let colAlters = [];
    // Things that can change:
    //  Name - NOT YET ***
    //  Null/Not Null
    //  Default
    //  Type

    if (colParams.null != oldParams.null) {
      if (!colParams.null) {
        colAlters.push(this._makeAlterColumn(oldParams.name) + ` SET DEFAULT ${colParams.default}`);
        colAlters.push(this._makeAlterColumn(oldParams.name) + ` SET NOT NULL`)
      }
      else {
        colAlters.push(this._makeAlterColumn(oldParams.name) + ` SET NULL`)
      }
    }

    if (colParams.default != oldParams.default) {
      colAlters.push(this._makeAlterColumn(oldParams.name) + ` DROP DEFAULT ${oldParams.default}`);
      colAlters.push(this._makeAlterColumn(oldParams.name) + ` SET DEFAULT ${colParams.default}`);
    }

    if (colParams.type != oldParams.type) {
      colAlters.push(this._makeAlterColumn(oldParams.name) + ` TYPE ${ColumnBuilder._getType(colParams.type)}`);
    }

    if ((colParams.type == oldParams.type) && (colParams.maxlength != oldParams.maxlength) && colParams.type == 'CC') {
      colAlters.push(this._makeAlterColumn(oldParams.name) + ` TYPE ${ColumnBuilder._getType(colParams.type)}(${colParams.maxlength})`);
    }

    if (colParams.name != oldParams.name) {
      colAlters.push(`RENAME COLUMN ${oldParams.name} TO ${colParams.name}`);
    }

    return [alter + colAlters.join(',') + ';'];
  }

  dropColumn(appName, tableName, colParams) {
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');
    if (!colParams.name) return this._missing('Column Name');

    let alter = this._makeAlterTable(appName, tableName);

    return [`${alter}DROP COLUMN IF EXISTS "${colParams.name}";`];
  }

  createPK(appName, tableName, pkParams) {
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');
    if (!pkParams) return this._missing('PK Definition');

    let fullName = `"${tableName}_pkey"`;
    let alter = this._makeAlterTable(appName, tableName);

    alter += `DROP CONSTRAINT IF EXISTS ${fullName},\n`;
    alter += `ADD PRIMARY KEY(${this._makeQuotedList(pkParams).join(',')});`;

    return [alter];
  }

  alterPK(appName, tableName, colParams) {
    return this.createPK(appName, tableName, colParams);
  }

  dropPK() {
    return ['', '']
    // not allowed
  }

  createFK(appName, tableName, fappName, ftableName, fkParams, dropOnly) {
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');
    if (!fkParams) return this._missing('FK Definition');

    let conName = fkParams.name + '_fkey';
    let ffullName = this._makeFullTableName(fappName, ftableName);

    let alter = this._makeAlterTable(appName, tableName);
    let columns = [], fcolumns = [];

    for (let link of fkParams.links) {
      columns.push(link.source);
      fcolumns.push(link.target);
    }

    alter += `DROP CONSTRAINT IF EXISTS "${conName}"`;
    if (!dropOnly) {
      alter += `,\nADD CONSTRAINT "${conName}" FOREIGN KEY(${this._makeQuotedList(columns).join(',')}) REFERENCES ${ffullName} (${this._makeQuotedList(fcolumns).join(',')}) ON DELETE NO ACTION;`;
    }
    else {
      alter += ';';
    }

    return [alter];
  }

  alterFK(appName, tableName, fkParams) {
    // NOT UPDATED
    return this.createFK(appName, tableName, fkParams, false);
  }

  dropFK(appName, tableName, fappName, ftableName, fkParams) {
    return this.createFK(appName, tableName, fappName, ftableName, fkParams, true);
  }

  createIndex(appName, tableName, idxParams, dropOnly) {
    // indexes are Schema wide
    if (!this.pgschema) return this._missing('Schema');
    if (!appName) return this._missing('App Name');
    if (!tableName) return this._missing('Table Name');
    if (!idxParams) return this._missing('Index Definition');

    let fullName = this._makeFullTableName(appName, tableName);
    let conName = `"${appName}_${tableName}_${idxParams.name}_index"`;

    let alter = `DROP INDEX IF EXISTS "${this.pgschema}".${conName};`;    
    if (!dropOnly) alter += `\nCREATE INDEX ${conName} ON ${fullName} (${this._makeQuotedList(idxParams.columns).join(',')});`;

    return [alter];
  }

  alterIndex(appName, tableName, idxParams) {
    return this.createIndex(appName, tableName, idxParams, false);
  }

  dropIndex(appName, tableName, idxParams) {
    return this.createIndex(appName, tableName, idxParams, true);
  }

// HELPERS
  _makeFullTableName(appName, tableName) {
    return `"${this.pgschema}"."${appName}_${tableName}"`
  }

  _makeAlterTable(appName, tableName) {
    let fullName = this._makeFullTableName(appName, tableName);

    return `ALTER TABLE ${fullName}\n`;
  }

  _makeAlterColumn(colName) {
    return `ALTER COLUMN ${colName}\n`;
  }

  _makeQuotedList(list) {
    return list.map(function(el) {
      return `"${el}"`;
    });
  }

  _missing(err) {
    return ['', 'Missing ' + err];
  }
}

class ColumnBuilder {
  constructor() {
    /*
      {value: 'CC', text: 'Text'},
      {value: 'CT', text: 'Textarea'},
      {value: 'CP', text: 'Password'},
      {value: 'NI', text: 'Numeric - Integer'},
      {value: 'NF', text: 'Numeric - Float'},
      {value: 'ND', text: 'Numeric - Currency'},
      {value: 'NS', text: 'Auto-Increment'},
      {value: 'DD', text: 'Date'},
      {value: 'DT', text: 'Time'},
      {value: 'DZ', text: 'Date and Time'},
      {value: 'MB', text: 'Yes/No'},
      {value: 'MU', text: 'Unique ID'},
    */

    /* NOT IMPLEMENTED
      JSON/JSONB
      Array
      Derived
    */
  }

  static create(colParams) {
    let sql = `ADD COLUMN "${colParams.name}" `;

    switch (colParams.type) {
      case 'CC':
        sql += this.varchar(colParams);
        break;

      case 'CP':
        sql += this.password(colParams);
        break;        

      case 'CT':
        sql += this.text(colParams);
        break;
  
      case 'NI':
        sql += this.integer(colParams);
        break;        

      case 'NF':
        sql += this.float(colParams);
        break;        

      case 'ND':
        sql += this.decimal(colParams);
        break; 

      case 'NS':
        sql += this.serial(colParams);
        break;

      case 'DD':
        sql += this.date(colParams);
        break;

      case 'DT':
        sql += this.time(colParams);
        break;                                     

      case 'DZ':
        sql += this.datetime(colParams);
        break;        

      case 'MB':
        sql += this.boolean(colParams);
        break;

      case 'MU':
        sql += this.uuid(colParams);
        break;                  
    }

    sql += (colParams.null) ? ' NULL' : ' NOT NULL';

    return [sql];
  }

  alter(colParams, oldParams) {
    
  }

  drop(colParams) {
    return `DROP COLUMN IF EXISTS ${colParams.name}`;
  }

  static _getType(ctype) {
    let type;

    switch(ctype) {
      case 'CC':
      case 'CP':
        type = 'VARCHAR';
        break;        

      case 'CT':
        type = 'TEXT';
        break;
  
      case 'NI':
        type = 'INT';
        break;        

      case 'NF':
        type = 'FLOAT';
        break;        

      case 'ND':
        type = 'NUMERIC';
        break; 

      case 'NS':
        type = 'SERIAL';
        break;

      case 'DD':
        type = 'DATE';
        break;

      case 'DT':
        type = 'TIME WITHOUT TIME ZONE'
        break;                                     

      case 'DZ':
        type = 'TIMESTAMPTZ';
        break;        

      case 'MB':
        type = 'BOOLEAN';
        break;

      case 'MU':
        type = 'UUID';
        break;                  
    }

    return type;
  }

  static varchar(colParams) {
    let sql = this._getType(colParams.type);

    if ('maxlength' in colParams && colParams.maxlength != '0') sql += `(${colParams.maxlength})`;
    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;
  }

  static password(colParams) {
    let sql = this._getType(colParams.type) + '(128)';

    return sql;
  }

  static text(colParams) {
    let sql = this._getType(colParams.type);

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;
  }

  static integer(colParams) {
    let sql = this._getType(colParams.type);

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;
  }

  static float(colParams) {
    let sql = this._getType(colParams.type);

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;
  }

  static decimal(colParams) {
    let sql = this._getType(colParams.type);

    sql += `(${colParams.digits},${colParams.decimals})`;

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;    
  }

  static serial(colParams) {
    let sql = this._getType(colParams.type);

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;
  } 
  
  static date(colParams) {
    let sql = this._getType(colParams.type);

    if ('defaultDD' in colParams && colParams.defaultDD) {
      if (colParams.defaultDD == 'U') sql+= ` DEFAULT '${colParams.defaultDD2}'`;
    } 

    return sql;
  }
  
  static time(colParams) {
    let sql = this._getType(colParams.type);

    if ('defaultDT' in colParams && colParams.defaultDT) {
      if (defaultDT == 'U') sql+= ` DEFAULT '${colParams.defaultDT2}'`;
    } 

    return sql;
  }

  static datetime(colParams) {
    let sql = this._getType(colParams.type);

    if ('defaultDZ' in colParams && colParams.defaultDZ) {
      if (defaultDZ == 'U') sql+= ` DEFAULT '${colParams.defaultDZ2}'`;
    }     

    return sql;    
  }

  static boolean(colParams) {
    let sql = this._getType(colParams.type);

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;
  }

  static uuid(colParams) {
    let sql = this._getType(colParams.type);

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;
  }

}

module.exports = {
  jsonQueryExecify,
  jsonToQuery,
  objectify,
  execQuery,
  shutdown,
  SqlBuilder
}