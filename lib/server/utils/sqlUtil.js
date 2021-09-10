const root = process.cwd();
const db = require(root + '/lib/server/utils/db.js');
const config = require(root + '/config.json');
const models = {}

config.apps.forEach(function(app) {
console.log(app)  
  try {
    if (app != 'db4') {
      models[app] = require(root + `/apps/${app}/models.js`);
    }
  }
  catch(err) {
    console.log('No Models for ' + app);
    console.log(err)
  }
})

const jsonQueryExecify = async function({database = '', pgschema = '', query={}, app='', values=[]} = {}) {
  let text = module.exports.jsonToQuery(query, app, pgschema);
  let tm = await module.exports.execQuery(database, {text, values});

  if (tm.status == 200) tm.data = module.exports.objectify(tm.data);
  return tm;
};

const jsonToQuery = function(query, dfltApp, pgschema) {
  // [S]ingle quote for [S]trings, [D]ouble quote for things(in the [D]atabase)
  /* format:
        query = {
          [app_]maintable: {
            columns: [...],
            leftJoin: [
              {[app_]jointable: {
                  columns: [...],
                  leftJoin: [],
                  fkname: 'fk name to use',
                  as: 'table name for AS'
                }
              }
            ],
            where: 'use full table name, ie app_tablename',
            as: 'table name for AS'
          }
        }
  */
  let sql = '';
  let colList = [];
  let joins = [];
  let keys = Object.keys(query);
  let mainTable = keys[0];

  let splitTableName = function(tbl) {
    return (tbl.indexOf('_') > 0) ? tbl.split('_') : [dfltApp, tbl]
  }

  let makeMainColumns = function(tbl, app, cols) {
    let tname = models[app][tbl].getTableNamePhysical(true);

    for (let col of cols) {
      colList.push(`${tname}."${col}"`);
    }
  }

  let makeJoinColumns = function(tbl, app, cols, pfx, as) {
    let tname = models[app][tbl].getTableNamePhysical(true);
    let basic = (as) ? as : tbl;

    basic = basic.toLowerCase();

    if (pfx.length > 0) {
      let pfxs = pfx.join('.');

      basic = pfxs + '.' + basic;
    }

    for (let col of cols) {
      colList.push(`${tname}."${col}" AS "${basic}.${col}"`);
    }
  }
  
  let doJoin = function(tblA, appA, tblB, appB, jon, fkName) {
    if (!jon) {
      let jona = [];
      let fks = models[appA][tblA].getConstraints().fk;
      let phyA = models[appA][tblA].getTableNamePhysical(true);
      let pgB = models[appB][tblB].getTableNameWithSchema(true, pgschema);
      let phyB = models[appB][tblB].getTableNamePhysical(true);
      
      jon = `LEFT JOIN ${pgB} AS ${phyB} ON `;
      
      fks.forEach(function(fk) {
        if (fk.table.name == tblB && (!fkName || fkName == fk.name)) {  // if specified on Name use that, else do all with same table name
          let colsA = fk.columns;
          let colsB = fk.tableColumns;   
          
          colsA.forEach(function(col, idx) {
            jona.push(`${phyA}."${col}" = ${phyB}."${colsB[idx]}"`);
          })
        }
      })
      
      jon += jona.join(', ');
    }

    return jon;
  }

  let doOrderby = function(tblA, appA, orderBy) {
    if (orderBy.length > 0) {
      let obs = [];
      
      orderBy.forEach(function(tblDef) {

        let tbl = Object.keys(tblDef)[0];
        let cols = Object.values(tblDef)[0];
        var schema = models[appA][tblA].getSchema();

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
       return models[appA][tblA].makeOrderBy();
    }
  }

  let swallow = function(tblA, tblADefn, appA, isMainTable, pfx) {
    let cols = ('columns' in tblADefn) ? tblADefn.columns : ['*'];
    let as = tblADefn.as || null;

    cols = models[appA][tblA].getColumnListBasic(cols);

    (isMainTable) ? makeMainColumns(tblA, appA, cols) : makeJoinColumns(tblA, appA, cols, pfx, as);    

    if (!isMainTable) pfx.push(tblA.toLowerCase());

    (tblADefn.leftJoin || []).forEach(function(ij) {
      let tb = Object.keys(ij)[0];
      let [appB, tblB] = splitTableName(tb);
      let fkName = ij[tb].fkname || '';
      let jon = ij[tb].on || '';

      joins.push(doJoin(tblA, appA, tblB, appB, jon, fkName));
      
      swallow(tblB, ij[tb], appB, false, pfx);
    })   
  }

  let [appA, tblA] = splitTableName(mainTable);

  swallow(tblA, query[mainTable], appA, true, []);    

  sql += `SELECT ${colList.join(',')}\n`;
  sql += `FROM "${pgschema}"."${appA}_${tblA}" AS "${appA}_${tblA}"\n`;   // 
  sql += joins.join('\n');
  sql += (query[mainTable].where) ? '\nWHERE ' + query[mainTable].where : '';    
  sql += '\n' + doOrderby(tblA, appA, query[mainTable].orderBy || []);

console.log(sql)
  return sql;      
};

const objectify = function(flat) {
  // turn flat table.col1.col2 fields into table: {col1: {col2}}
  // works on a {} or [], returning the same
  let isArray = true;
  let data = [];

  if (!Array.isArray(flat)) {
    flat = [flat];    
    isArray = false;
  }

  flat.forEach(function(row) {
    let obj = {};

    Object.keys(row).forEach(function(key) {
      let keyParts = key.split('.');
      let prop = keyParts.pop();
      let mdl = obj;

      for (let k of keyParts) {
        if (! (k in mdl)) mdl[k] = {};

        mdl = mdl[k];
      }

      mdl[prop] = row[key];
    })

    data.push(obj);
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

  makeColumnList(cols) {
    // assumes all tables have been aliased in the FROM or JOINs sections.
    let colList = [];

    for (let col of cols) {
      let parts = col.split('.');
      let pl = parts.length;
      let appTable = parts[pl-2];
      let field = parts[pl-1];
      let table = (appTable.split('_'))[1];

      colList.push(`"${table}"."${field}"`);
    }

    return 'SELECT ' + colList.join(',');
  }

  makeFromList(table) {
    let parts = table.split('_');
  
    return `FROM "${this.pgschema}"."${table}" AS "${parts[1]}"`;
  }

  makeJoinList(modelInfo, cols) {
    // go through columns and deconstruct the levels.  
    // assumes that a full path is present in cols.  ie not this:  table1.col1, table3.col1 without table1.table2.col1, table2.table3.col1
    let self = this;
    let joins = [];
    let doneJoins = [];  // keep track of existing joins so as not to repeat on each field

    const getJoin = function(source, target) {
      let model = modelInfo.get(source);
      let sourceTable = (source.split('_'))[1];
      let targetTable = (target.split('_'))[1];
      let join;

      for (let fk of model.fks) {
        if (fk.ftableName == target) {
          let ons = [];

          for (let link of fk.links) {
            ons.push(`"${sourceTable}"."${link.source}" = "${targetTable}"."${link.target}"`);
          }

          join = `LEFT JOIN "${self.pgschema}"."${target}" AS "${targetTable}" ON ${ons.join(' AND ')}`;
        }
      }

      return join;
    }

    for (let col of cols) {
      let parts = col.split('.');
      let pl = parts.length;
      let table = parts[pl-2];

      if (parts.length > 2) {
        let prevTable = parts[pl-3];

        if (doneJoins.indexOf(prevTable + table) == -1) {
          joins.push(getJoin(prevTable, table));
          doneJoins.push(prevTable + table);
        }        
      }
    }

    return joins.join(',');
  }

  makeOrderBy(cols) {
    // table1.col1, table1.col1
    let ob = [];

    for (let col of cols) {
      let tf = col.split('.');
      let at = tf[0].split('_');
      let table = at[1];
      let ad = (at[0].substr(0,1) == '-') ? 'DESC' : 'ASC';

      ob.push(`"${table}"."${tf[1]}" ${ad}`);
    }

    return (ob.length > 0) ? 'ORDER BY ' + ob.join(', ') : '';
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
      {value: 'JA', text: 'JSON'},
      {value: 'JB', text: 'JSONB'},
    */

    /* NOT IMPLEMENTED
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

      case 'JA':
        sql += this.json(colParams);
        break;                  

      case 'JB':
        sql += this.jsonb(colParams);
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

      case 'JA':
        type = 'JSON';
        break;                  

      case 'JB':
        type = 'JSONB';
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
      if (colParams.defaultDT == 'U') sql+= ` DEFAULT '${colParams.defaultDT2}'`;
    } 

    return sql;
  }

  static datetime(colParams) {
    let sql = this._getType(colParams.type);

    if ('defaultDZ' in colParams && colParams.defaultDZ) {
      if (colParams.defaultDZ == 'U') sql+= ` DEFAULT '${colParams.defaultDZ2}'`;
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

  static json(colParams) {
    let sql = this._getType(colParams.type);

    if ('default' in colParams && colParams.default) sql+= ` DEFAULT '${colParams.default}'`;

    return sql;    
  }

  static jsonb(colParams) {
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