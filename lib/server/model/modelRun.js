/*
  A way to know if an existing record, ie update was read first.  Maybe have a getPK() method, or hasPK()
  Change deleteOne to do a select first to ensure only one being deleted
  Use transaction for Insert and Update
  Institute managers
*/
const root = process.cwd();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const ModelBase = require('./modelBase.js')
const {exec} = require(root + '/lib/server/utils/db.js');
const verify = require(root + '/lib/server/utils/verify.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {modelEvents} = require(root + '/lib/server/utils/events.js');

const validationFailed = function(tcon, errs) {
  let errors = {}, name = tcon.name.toLowerCase();
  errors[name] = errs;    // errors['Contact'] = {first: 'required', ...}

  return new TravelMessage({status: 400, data: {errors}});
}

const invalidSchema = function() {
  return new TravelMessage({status: 400, data: {message: 'Invalid PG Schema'}});
}

const userError = function(msg) {
  return new TravelMessage({status: 400, data: {message: msg}});
}

const getCommonValues = function(tcon, pgschema) {
  const tableName = tcon.name.toLowerCase();
  const appName = tcon.getApp().toLowerCase();
  const schema = tcon.getSchema();
  const SQLTableName = tcon.getTableName({pgschema});  
  const pks = tcon.getConstraints().pk;  

  return {tableName, appName, schema, SQLTableName, pks};
}

class Model extends ModelBase {
  constructor(obj, {overRideColumns = false} = {}) {
    // Two ways to init:
    //  if obj is an object:
    //    if no keys, build complete row of defaults
    //    if keys, build row based on keys
    // anything other than an object is an empty record
    // overrRideColumns comes from construct() so that derived columns are kept
    super();

    var self = this;
    var schema = this.constructor.getSchema();
    var cols = this.constructor.getColumnNames({showHidden: true, includeDerived: false});

    // init row          
    if (obj && typeof obj == 'object') {
      if (Object.keys(obj).length > 0) {
        // data passed in, create record based on it
        Object.keys(obj).forEach(function(col) {
          if (cols.indexOf(col) != -1 || overRideColumns) {
            self[col] = (obj[col] || obj[col] === false || obj[col] === null) ? obj[col] : ('default' in schema[col].defn) ? schema[col].defn.default : obj[col];
          }
        })
      }
      else {
        // no keys, create default record
        cols.forEach(function(col) {
          self[col] = schema[col].defn.default || null;
        })
      }
    }
  }
    
  async setSaveDefaults(iu) {
    // bcrypt password fields
    // set column values with onBeforeInsert/onBeforeUpdate
    var cols = this.constructor.getSchema();
    var colNames = Object.keys(cols)
      
    for (var i=0,col,sviu; i<colNames.length; i++) {
      col = colNames[i];
      sviu = (iu == 'i') ? cols[col].defn.onBeforeInsert || null : cols[col].defn.onBeforeUpdate || null;

      // Bcrypt passwords
      if (cols[col].constructor.name == 'Password') {
        if (this[col]) this[col] = await bcrypt.hash(this[col], saltRounds);
      }
      
      // Set any onBeforeInsert/Update values
      if (sviu) {
        this[col] = (typeof sviu === 'function') ? sviu(this) : sviu;
      }
    }
  }    
  
/* Instance actions */  
  verifyInsert({schema = {}, oneOnly = false} = {}) {    
    return verify.testFullRecord(schema, this, oneOnly);
  }

  verifyUpdate({schema = {}, oneOnly = false} = {}) {
    return verify.testPartialRecord(schema, this, oneOnly);
  }

  async insertOne({database = '', pgschema = ''} = {}) {
    // insert model object
    const tcon = this.constructor;
    const {tableName, appName, schema, SQLTableName} = getCommonValues(tcon, pgschema);
    const retcols = tcon.getColumnList({cols: '*', isMainTable: true, joinName: false, showHidden: true, includeDerived: true});  // get all columns

    let tm, errs, text;
    
    // make sure a valid pgschema
    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();
    
    // preInsert
    await this.setSaveDefaults('i');

    // validate record
    errs = this.verifyInsert({schema, oneOnly: false});

    if (Object.keys(errs).length > 0) return validationFailed(tcon, errs);

    // build SQL
    let [cols, params, values] = tcon.makeInsertValues(this);

    text = `INSERT INTO ${SQLTableName} (${cols.join(',')}) VALUES(${params.join(',')}) RETURNING ${retcols};`;
    tm = await tcon.sql(database, {text, values});

    if (tm.status == 200) {
      if (tm.data.length == 0) {
        tm.status = 400;
        tm.data = {message: text};
      }
      else {
        modelEvents.emit(`${database}.${pgschema}./${appName}/${tableName}`, {action: '+', rows: tm.data});

        tm.data = tm.data[0];
      }
    }

    return tm;    
  }
  
  async updateOne({database = '', pgschema = ''} = {}) {
    // update model object, based on pks
    const tcon = this.constructor;
    const {tableName, appName, schema, SQLTableName} = getCommonValues(tcon, pgschema);
    const retcols = tcon.getColumnList({cols: '*', isMainTable: true, joinName: false, showHidden: true, includeDerived: true});  // get all columns

    let tm, errs, text;
    
    // make sure a valid pgschema
    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();
    
    // preUpdate
    await this.setSaveDefaults('u');

    // validate record
    errs = this.verifyUpdate({schema, oneOnly: false});
    if (Object.keys(errs).length > 0) return validationFailed(tcon, errs);
        
    // build SQL
    let [set, where, values] = tcon.makeUpdateValues(this);
    
    text = `UPDATE ${SQLTableName} SET ${set.join(',')} WHERE ${where.join(' AND ')} RETURNING ${retcols};`;
    tm = await tcon.sql(database, {text, values});    

    if (tm.status == 200) {
      if (tm.data.length == 0) {
        tm.status = 400;
        tm.data = {message: text};
      }
      else {
        modelEvents.emit(`${database}.${pgschema}./${appName}/${tableName}`, {action: '*', rows: tm.data});

        tm.data = tm.data[0];
      }
    }
    
    return tm;
  }
  
  async upsertOne({database = '', pgschema = ''} = {}) {
    // upsert model object - NOT COMPLETE
    //https://hashrocket.com/blog/posts/upsert-records-with-postgresql-9-5
    const tcon = this.constructor;
    const {tableName, appName, SQLTableName, pks} = getCommonValues(tcon, pgschema);
    const retcols = tcon.getColumnList({cols: '*', isMainTable: true, joinName: false, showHidden: true, includeDerived: true});  // get all columns

    let tm, text;
    
    // make sure a valid pgschema
    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();
        
    // build SQL    
    let [cols, params, values] = tcon.makeInsertValues(this);
    let [set, where] = tcon.makeUpdateValues(this);
    
    text = `INSERT INTO ${SQLTableName} (${cols.join(',')}) VALUES(${params.join(',')})`;
    text += ` ON CONFLICT (${pks.join(',')})`;
    text += ` UPDATE ${SQLTableName} SET ${set.join(',')} WHERE ${where.join(' AND ')} RETURNING ${retcols};`;
    tm = await tcon.sql(database, {text, values});    

    if (tm.status == 200) {
      if (tm.data.length == 0) {
        tm.status = 400;
        tm.data = {message: text};
      }
      else {
        modelEvents.emit(`${database}.${pgschema}./${appName}/${tableName}`, {action: '*', rows: tm.data});

        tm.data = tm.data[0];
      }
    }
    
    return tm;   
  }
    
  async deleteOne({database = '', pgschema = ''} = {}) {
    // delete a model object
    const tcon = this.constructor;
    const {tableName, appName, SQLTableName} = getCommonValues(tcon, pgschema);
    const retcols = tcon.getColumnList({cols: '*', isMainTable: true, joinName: false, showHidden: true, includeDerived: true});  // get all columns
    const rec = this.extractPrimaryKey();

    let tm, text;
    
    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();
    
    if (rec == false) return userError('Missing PK field');

    // Do the deleting
    let [, where, values] = tcon.makeUpdateValues(rec);
    text = `DELETE FROM ${SQLTableName} WHERE ${where.join(' AND ')} RETURNING ${retcols};`;
    tm = await tcon.sql(database, {text, values});  

    if (tm.status == 200) {
      if (tm.data.length == 0) {
        tm.status = 400;
        tm.data = {message: text};
      }
      else {
        modelEvents.emit(`${database}.${pgschema}./${appName}/${tableName}`, {action: '-', rows: tm.data});

        tm.data = tm.data[0];
      }
    }
    
    return tm;  
  }    
  
/* Model actions */  
  static async selectOne({database = '', pgschema = '', cols = '*', showHidden = false, pks = []} = {}) {
    // select one record by pk.
    const tcon = this;
    const colNames = tcon.getColumnList({cols, isMainTable: true, showHidden});
    const {SQLTableName} = getCommonValues(tcon, pgschema);
    const rec = tcon.makePrimaryKey(pks);

    let tm, text;

    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();

    if (Object.values(rec).indexOf(null) > -1) return userError('Missing PK field');

    let [where, values] = tcon.makeSelectValues(rec);
    text = `SELECT ${colNames} FROM ${SQLTableName} WHERE ${where.join(' AND ')}`;
    tm = await tcon.sql(database, {text, values});

    if (tm.status == 200) {
      if (tm.data.length != 1) {
        tm.status = 400;
        tm.data = {message: 'More/less than one row returned'};
      }
      else {
        tm.data = tm.data[0];
      }
    }

    return tm;
  }

  static async select({database = '', pgschema = '', rec = {}, cols = '*', limit=100, offset=0, orderby='', showHidden = false} = {}) {
    // select zero+ records based on model fields. No joins, etc.
    // use a query if more features needed
    const tcon = this;
        
    let [where, values] = tcon.makeSelectValues(rec);
    where = where.join(' AND ');
    
    return tcon.where({database, pgschema, where, values, cols, limit, offset, orderby, showHidden});
  }
  
  static async where({database = '', pgschema = '', where = '', values = [], cols = '*', limit=100, offset=0, orderby='', showHidden = false} = {}) {
    // select zero+ records based on where stmt and values
    // use a query if more features needed
    const tcon = this;
    const {SQLTableName} = getCommonValues(tcon, pgschema);
    const colNames = tcon.getColumnList({cols, isMainTable: true, showHidden});
    const orderBy = tcon.makeOrderBy(orderby);  // csv list with direction, ie -last,first (orderby=col1,-col2, etc)

    let tm, text;

    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();

    text = `SELECT ${colNames} FROM ${SQLTableName}`;

    if (where) text += ` WHERE ${where}`;
    if (orderBy) text += ' ' + orderBy;
    if (limit != -1) text += ' LIMIT ' + limit;
    if (offset != 0) text += ' OFFSET ' + offset;

    tm = await tcon.sql(database, {text, values});

    return tm;
  }

  static async insert({database = '', pgschema='', rows=[]} = {}) {
    // insert objects
    // iterate over rows inserting each
    // response is in data[], {isError: T|F, error: msg, data: rec}
    const tcon = this;
    const {tableName, appName, schema, SQLTableName} = getCommonValues(tcon, pgschema);
    const retcols = tcon.getColumnList({cols: '*', isMainTable: true, joinName: false, showHidden: true, includeDerived: true});  // get all columns

    let tm, tobj, errs, text, row;
    let tmx = new TravelMessage();
    
    tmx.data = [];
    
    // make sure a valid pgschema
    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();

    for (row of rows) {
      tobj = new this(row);
      
      await tobj.setSaveDefaults('i');
      
      errs = this.verifyInsert({schema, oneOnly: false});
    
      if (Object.keys(errs).length > 0) {
        tmx.data.push({isError: true, error: validationFailed(tcon, errs).data});
        continue;
      }
      
      let [cols, params, values] = tcon.makeInsertValues(tobj);
      text = `INSERT INTO ${SQLTableName} (${cols.join(',')}) VALUES(${params.join(',')}) RETURNING ${retcols};`;
      tm = await tcon.sql(database, {text, values});
    
      if (tm.err) {
        tmx.status = 400;
        tmx.data.push({isError: true, error: tm.err.message});
      }
      else {
        if (tm.data.length == 0) {
          tmx.status = 400;
          tmx.data.push({isError: true, error: 'Insert Error'});
        }
        else {
          tmx.data.push({isError: false, data: tm.data[0]});
        }
      }
    }
    
    modelEvents.emit(`${database}.${pgschema}./${appName}/${tableName}`, {action: '+', rows: tmx.data});

    return tmx;
  }
  
  static async update({database = '', pgschema, rows=[]} = {}) {
    // update objects
    // iterate over rows updating each
    // response is in data[], {isError: T|F, error: msg, data: rec}
    const tcon = this;
    const {tableName, appName, schema, SQLTableName} = getCommonValues(tcon, pgschema);
    const retcols = tcon.getColumnList({cols: '*', isMainTable: true, joinName: false, showHidden: true, includeDerived: true});  // get all columns

    let tm, tobj, errs, text, row;
    let tmx = new TravelMessage();
    
    tmx.data = [];
    
    // make sure a valid pgschema
    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();

    for (row of rows) {
      tobj = new this(row);
      
      await tobj.setSaveDefaults('u');
      
      errs = this.verifyUpdate({schema, oneOnly: false});
    
      if (Object.keys(errs).length > 0) {
        tmx.data.push({isError: true, error: validationFailed(tcon, errs).data});
        continue;
      }
      
      let [set, where, values] = tcon.makeUpdateValues(tobj);
      text = `UPDATE ${SQLTableName} SET ${set.join(',')} WHERE ${where.join(' AND ')} RETURNING ${retcols};`;
      tm = await tcon.sql(database, {text, values});    
    
      if (tm.err) {
        tmx.status = 400;
        tmx.data.push({isError: true, error: tm.err.message});
      }
      else {
        if (tm.data.length == 0) {
          tmx.status = 400;
          tmx.data.push({isError: true, error: 'Update Error'});
        }
        else {
          tmx.data.push({isError: false, data: tm.data[0]});
        }
      }
    }

    modelEvents.emit(`${database}.${pgschema}./${appName}/${tableName}`, {action: '*', rows: tmx.data});        

    return tmx;    
  }
  
  //static async upsert(pgschema, rows) {
    // upsert model objects
  //}
  
  static async delete({database = '', pgschema = '', obj = {}} = {}) {
    // delete one or more records
    const tcon = this;
    const {tableName, appName, SQLTableName} = getCommonValues(tcon, pgschema);
    const retcols = tcon.getColumnList({cols: '*', isMainTable: true, joinName: false, showHidden: true, includeDerived: true});  // get all columns

    let tm, text;

    if (Object.keys(obj).length == 0) return userError('No Fields Valued');
    
    if (!tcon.testPGSchema(pgschema)[0]) return invalidSchema();
    
    // Do the deleting
    let [where, values] = tcon.makeSelectValues(obj);

    text = `DELETE FROM ${SQLTableName} WHERE ${where.join(' AND ')} RETURNING ${retcols};`;
    tm = await tcon.sql(database, {text, values});

    if (tm.status == 200) {
      if (tm.data.length > 0) {
        modelEvents.emit(`${database}.${pgschema}./${appName}/${tableName}`, {action: '-', rows: tm.data});
      }
    }
    
    return tm;
  }
  
  static async sql(database, stmt) {
    // where the action happens, or at least calls the action-happener
    return await exec(database, stmt);
  }

  static doManagers() {
    // go through schema and add ourself to other schemas
    const tcon = this.constructor;
    
    var fks = this.getConstraints().fk || null;
    var name = `get${this.name}s`;
    var self = this;
    
    if (!fks) return;

    fks.forEach(function(fk) {
      var tbl = fk.table;
      var cols = fk.columns;
      var where = [];
      
      cols.forEach(function(col, idx) {
        where.push(`"${col}"=$${(idx+1)}`);
      })      
      
      tbl.prototype[name] = function(pgschema) {  
        var schTbl = self.getTableName({pgschema});
        var pks = tcon.getConstraints().pk;
        var orderBy = tcon.makeOrderBy();
        var values = [];
        
        pks.forEach(function(pk) {
          values.push(this[pk])
        }, this)

        var sql = `SELECT * FROM ${schTbl} WHERE ${where.join(' AND ')}`;
        sql += (orderBy) ? ` ORDER BY ${orderBy}` : '';
        sql += ';';
        var stmt = {text: sql, values: values};
        
        tcon.sql(stmt);        
      }
    })
  }
}

module.exports = Model;