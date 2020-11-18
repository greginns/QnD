const root = process.cwd();
const {exec, shutdown} = require(root + '/lib/server/utils/db.js');
const config = require(root + '/config.json');
const models = {}

config.apps.forEach(function(app) {
  models[app] = require(root + `/apps/${app}/models.js`);
})

module.exports = {
  jsonQueryExecify: async function({query={}, app='', pgschema = '', values=[]} = {}) {
    let text = module.exports.jsonToQuery(query, app, pgschema);
    let tm = await module.exports.execQuery({text, values});

    if (tm.status == 200) tm.data = module.exports.objectify(tm.data);
    return tm;
  },

  jsonToQuery: function(query, app, pgschema) {
    // [S]ingle quote for [S]trings, [D]ouble quote for things(in the [D]atabase)
    var sql = '';
    var colList = [];
    var joins = [];
    var keys = Object.keys(query);
    var mainTable = keys[0];
    
    var doJoin = function(tblA, tblB, jon) {
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

    var doOrderby = function(orderBy) {
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

    var swallow = function(tblA, tblADefn, isMainTable, joinName) {
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
  },

  objectify: function(data) {
    // turn flat table.col fields into table: {cols}
    // works on a {} or [], returning the same
    var isArray = true;
    var kx = [];

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
  },
  
  execQuery: async function(stmt) {
    return await exec(stmt);
  },
  
  shutdown: async function() {
    return await shutdown();
  },
  
  createSchema: function(pgschema) {
    return `CREATE SCHEMA IF NOT EXISTS ${pgschema}`;
  },
  
  dropSchema: function(pgschema) {
    return `DROP SCHEMA IF EXISTS ${pgschema} CASCADE`;
  },
  
  createTable: function(app, pgschema, table) {
    return models[app][table]['build'](pgschema);
  },
  
  dropTable: function(schema, table) {
    return `DROP TABLE IF EXISTS "${schema}"."${table}"`;
  }
  
}