/*
  https://www.postgresql.org/docs/9.1/functions-string.html
*/

class ModelBase {
  constructor() {
  }  

/* new static method
Object.assign(Employee, {
  subtract(a, b) {
    return a - b
  }
});
*/
  extractPrimaryKey() {
    // pull out cols that are part of pk.  Return as an obj, or false if none found
    var pkCols = this.constructor.getConstraints().pk;
    var pkRec = {};

    pkCols.forEach(function(col) {
      if (col in this) pkRec[col] = this[col];
    }, this);
    
    return (Object.keys(pkRec).length != pkCols.length) ? false : pkRec;
  }

  static getSchema() {
    return this.definition().schema || {};
  }
  
  static getConstraints() {
    return this.definition().constraints || {};
  }

  static getOrderBy() {
    return this.definition().orderBy || [];
  }

  static getHidden() {
    return this.definition().hidden || [];
  }
  
  static getDBschema() {
    return this.definition().dbschema || '';
  }
  
  static getApp() {
    return this.definition().app || '';
  }
  
  static getColumnDefns(rando) {
    // return back defn of table columns, plus 'column' (name), and id (for html id)
    // rando is in case a form is used multiple times, ie a component, and inputs need unique ids.
    const defns = {};
    const tn = this.getTableName({pgschema: null, naked: true}).toLowerCase();
    const pks = this.getConstraints().pk;
    const schema = this.getSchema();
    let idx = -1;
    
    for (let col in schema) {
      idx++;
      defns[col] = schema[col].defn; 
      if (typeof defns[col].default === 'function') defns[col].default = defns[col].default();
      defns[col].column = col;
      defns[col].id = (rando) ? `${rando}_${idx}`: `${tn}_${col}`;
      defns[col].type = schema[col]._getColumnType();
      defns[col].pk = false;
    }

    for (let col of pks) {
      defns[col].pk = true;
    }
    
    return defns;
  }

  static getColumnDefaults() {
    // return back defaults for each column
    var defaults = {};
    var schema = this.getSchema();
    
    for (let col in schema) {
      defaults[col] = (schema[col].defn.default) ? typeof schema[col].defn.default === 'function' ? schema[col].defn.default() : schema[col].defn.default : '';
    }
    
    return defaults;
  }
 
  static getColumnList({cols = '*', isMainTable=false, joinName=false, showHidden = false, includeDerived = true} = {}) {
    // list of fully qualified, quoted, column names, ie "Department"."code"
    // Main Table name is "code" vs joinName/Derived "Department.code"
    // isMainTable: whether or not to include table name as part of the column
    var tnx = this.getTableName({pgschema: null, naked: true});   // without quotes
    var schema = this.getSchema();
    var as, colx, fl = [], colNames = [], goodCols = [];
    var pks = this.getConstraints().pk;

    // select columns, either all or specific
    if (!cols || cols == '*') {
      cols = this.getColumnNames({showHidden, includeDerived});
    }
    else {
      if (!Array.isArray(cols)) cols = [cols];

      colNames = this.getColumnNames({showHidden: true, includeDerived}); // All columns - as reference.  Specifying a col overrules showHidden
      
      cols.forEach(function(col) {
        if (colNames.indexOf(col) > -1) goodCols.push(col);
      })
      
      cols = goodCols;
    }

    // build list of columns
    cols.forEach(function(col) {
      if (schema[col].constructor.name == 'Derived') {
        colx = (isMainTable) ? `"${col}"` : `"${tnx}.${col}"`;

        fl.push(`${schema[col].defn.defn} AS ${colx}`);
      }
      else {
        as = (joinName) ? ` AS "${tnx}.${col}"` : '';
        colx = (isMainTable) ? `"${col}"` : `"${tnx}"."${col}"`;

        fl.push(`${colx}${as}`);  
      }
    })

    // add in _pk
    if (isMainTable) {
      (pks.length > 1) ? fl.push(`concat(${pks.join(',')}) AS "_pk"`) : fl.push(`"${pks[0]}" AS "_pk"`);
    }

    return fl.join(',');   
  }

  static getColumnNames({showHidden = false, includeDerived = true} = {}) {
    // list of actual column names
    var hidden = this.getHidden() || [];
    var schema = this.getSchema()
    var cols = Object.keys(schema);
    var colNames = [], isHidden, isDerived;
    
    cols.forEach(function(col) {
      isHidden = hidden.indexOf(col) > -1;
      isDerived = schema[col].constructor.name == 'Derived';
      
      if ((isHidden && showHidden) || !isHidden) {
        if ((isDerived && includeDerived) || !isDerived) {
          colNames.push(col);
        }
      }
    })

    return colNames;
  }
  
  static getTableName({pgschema = '', naked = false} = {}) {
    // pgschema = optional dbschema name
    // naked = just the name, no quotes no schema
    var app = this.getApp();
    return (naked) ? this.name : (pgschema) ? `"${pgschema}"."${app}_${this.name}"` : `"${app}_${this.name}"`;
  }
  
  static makePrimaryKey(pks) {
    // object of pk values
    var pkCols = this.getConstraints().pk;
    var rec = {};
    
    if (!Array.isArray(pks)) pks = [pks];

    pkCols.forEach(function(col, idx) {
      rec[col] = pks[idx] || null;
    })
    
    return rec;
  }
  
  static makeFkeyName(tbl, fkey) {
    // used in creating table constraints
    return `${tbl}_${fkey}_fkey`; 
  }
  
  static makeIndexName(tbl, index) {
    // used in creating table constraints
    return `${tbl}_${index}_index`; 
  }
  
  static makeOrderBy(qorderby) {
    // default order by from schema
    let orderBy = (qorderby) ? qorderby.split(',') : this.getOrderBy();
    let table = this.getTableName({});
    let ret = [];
      
    for (let col of orderBy) {
      ret.push((col.substr(0,1) == '-') ? `${table}."${col.substr(1)}" DESC` : `${table}."${col}" ASC`);
    }
    
    return (ret.length > 0) ? `ORDER BY ${ret.join(',')}` : '';
  }

  static makeInsertValues(obj) {
    // return cols, params, values
    let cols = [], params = [], values = [];
    let schema = this.getSchema();    

    Object.keys(obj).forEach(function(col, idx) {
      if (obj[col] !== undefined) {
        cols.push(`"${col}"`);    // column name
        params.push(`$${idx+1}`); // $x

        values.push(schema[col].constructor.name == 'Json' ? JSON.stringify(obj[col]): obj[col]);
      }
    });

    return [cols, params, values];
  }
  
  static makeUpdateValues(obj) {
    // returns set, where, values
    let set = [], where = [], values = [];
    const pks = this.getConstraints().pk;
    const schema = this.getSchema()

    Object.keys(obj).forEach(function(col, idx) {
      if (obj[col] !== undefined) {
        if (pks.indexOf(col) == -1) {
          // non pk cols
          set.push(`"${col}"=$${idx+1}`);
        } 
        else {
          // pk cols
          where.push(`"${col}"=$${idx+1}`);
        }

        

        values.push(schema[col].constructor.name == 'Json' ? JSON.stringify(obj[col]): obj[col]);
      }
    });

    return [set, where, values];
  }

  static makeSelectValues(obj) {
    // returns where, values
    var where = [], values = [];
    
    Object.keys(obj).forEach(function(col, idx) {
      if (obj[col] !== undefined) {
        where.push(`"${col}"=$${idx+1}`);
        values.push(obj[col]);
      }
    });

    return [where, values];
  }
  
  static testPGSchema(pgSchema) {
    // compare the home schema in defn vs what was provided
    // check to make sure not using incorrect schema
    // true - good
    // false - bad
    // returns [t|f, reason]
    // valid:
    //    if dbSchema has a value, then pgschema must match
    //    if dbSchema is blank, then whatever is supplied is used.
    let dbSchema = this.getDBschema();  // value from model

    if (dbSchema && dbSchema != pgSchema) return [false, `Mismatched pgschema in ${this.name} [${dbSchema} vs ${pgSchema}]`];
    if (!pgSchema) return [false, `No pgschema specified for ${this.name}`];
    
    return [true, ''];
  }

  static construct(rows) {
    // NOT USED
    // make multiple records from an array of 0+ rows
    var mrows = [];

    rows.forEach(function(row) {
      mrows.push(new this(row, {overRideColumns: true}));
    }, this)
    
    return mrows;
  }
}

module.exports = ModelBase;
