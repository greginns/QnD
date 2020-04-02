/*
  A way to know if an existing record, ie update was read first.  Maybe have a getPK() method, or hasPK()
  Change deleteOne to do a select first to ensure only one being deleted
*/
const root = process.cwd();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const ModelBase = require('./modelBase.js')
const {exec} = require(root + '/server/utils/db.js');
const verify = require(root + '/server/utils/verify.js');
const {TravelMessage} = require(root + '/server/utils/messages.js');
const {DataValidationError, RowNotInsertedError, RowNotUpdatedError, SQLSelectError, SQLDeleteError, SQLSchemaError, UserError} = require(root + '/server/utils/errors.js');
const {modelPubsub} = require(root + '/server/utils/pubsub.js');

var validationFailed = function(tcon, errs) {
  var errors = {}, name = tcon.name.toLowerCase();
  errors[name] = errs;

  return new TravelMessage({data: {errors}, err: new DataValidationError()});
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
            self[col] = (obj[col]) ? obj[col] : ('default' in schema[col].defn) ? schema[col].defn.default : obj[col];
          }
        })
      }
      else {
        // no keys, create default record
        Object.keys(cols).forEach(function(col) {
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
  verifyOneFull({schema = {}, oneOnly = false} = {}) {    
    return verify.testFullRecord(schema, this, oneOnly);
  }

  verifyOnePartial({schema = {}, oneOnly = false} = {}) {
    return verify.testPartialRecord(schema, this, oneOnly);
  }

  async insertOne({pgschema = ''} = {}) {
    // insert model object
    const tcon = this.constructor;
    var tm, errs, scerr, schema, table, text;
    
    // make sure a valid pgschema
    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});        
    
    // preInsert
    await this.setSaveDefaults('i');

    // validate record
    schema = tcon.getSchema();
    errs = this.verifyOneFull({schema, oneOnly: false});

    if (Object.keys(errs).length > 0) return validationFailed(tcon, errs);

    // build SQL
    table = tcon.getTableName({pgschema});
    let [cols, params, values] = tcon.makeInsertValues(this);

    text = `INSERT INTO ${table} (${cols.join(',')}) VALUES(${params.join(',')}) RETURNING *;`;
    tm = await tcon.sql({text, values});

    if (!tm.err) {
      if (tm.data.length == 0) {
        tm.err = new RowNotInsertedError();
      }
      else {
        tm.data = tm.data[0];
        modelPubsub.publish(`${pgschema.toLowerCase()}.${tcon.name.toLowerCase()}`);
      }
    }

    return tm;    
  }
  
  async updateOne({pgschema = ''} = {}) {
    // update model object, based on pks
    const tcon = this.constructor;
    var tm, errs, scerr, schema, table, text;
    
    // make sure a valid pgschema
    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});        
    
    // preUpdate
    await this.setSaveDefaults('u');

    // validate record
    schema = tcon.getSchema();
    errs = this.verifyOnePartial({schema, oneOnly: false});

    if (Object.keys(errs).length > 0) return validationFailed(tcon, errs);
        
    table = tcon.getTableName({pgschema});
    let [set, where, values] = tcon.makeUpdateValues(this);
    
    text = `UPDATE ${table} SET ${set.join(',')} WHERE ${where.join(',')} RETURNING *;`;
    tm = await tcon.sql({text, values});    

    if (!tm.err) {
      if (tm.data.length == 0) {
        tm.err = new RowNotUpdatedError();
      }
      else {
        //tm.data = tcon.construct(tm.data)[0];
        tm.data = tm.data[0];
        modelPubsub.publish(`${pgschema.toLowerCase()}.${tcon.name.toLowerCase()}`);
      }
    }
    
    return tm;
  }
  
  async upsertOne({pgschema = ''} = {}) {
    // upsert model object - NOT COMPLETE
    //https://hashrocket.com/blog/posts/upsert-records-with-postgresql-9-5
    const tcon = this.constructor;
    var tm, scerr, table, text, pks;    
    
    // make sure a valid pgschema
    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});    
        
    table = tcon.getTableName({pgschema});
    pks = tcon.getConstraints().pk;
    let [cols, params, values] = tcon.makeInsertValues(this);
    let [set, where] = tcon.makeUpdateValues(this);
    
    text = `INSERT INTO ${table} (${cols.join(',')}) VALUES(${params.join(',')})`;
    text += ` ON CONFLICT (${pks.join(',')})`;
    text += ` UPDATE ${table} SET ${set.join(',')} WHERE ${where.join(',')} RETURNING *;`;
    tm = await tcon.sql({text, values});    

    if (!tm.err) {
      if (tm.data.length == 0) {
        tm.err = new RowNotUpdatedError();
      }
      else {
        //tm.data = tcon.construct(tm.data)[0];
        tm.data = tm.data[0];
        modelPubsub.publish(`${pgschema.toLowerCase()}.${tcon.name.toLowerCase()}`);
      }
    }
    
    return tm;   
  }
    
  async deleteOne({pgschema = ''} = {}) {
    // delete a model object
    var tm, rec, scerr, table, text;
    const tcon = this.constructor;
    
    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});        

    rec = this.extractPrimaryKey();
    if (rec == false) return new TravelMessage({err: new UserError('Missing PK field')});        

    // Do the deleting
    table = tcon.getTableName({pgschema});
    let [, where, values] = tcon.makeUpdateValues(rec);
    text = `DELETE FROM ${table} WHERE ${where.join(',')} RETURNING *;`;
    tm = await tcon.sql({text, values});  

    if (!tm.err) {
      if (tm.data.length == 0) {
        tm.err = new SQLDeleteError();
      }
      else {
        //tm.data = tcon.construct(tm.data)[0];  // return back model instance
        tm.data = tm.data[0];
        modelPubsub.publish(`${pgschema.toLowerCase()}.${tcon.name.toLowerCase()}`);
      }
    }
    
    return tm;  
  }    
  
/* Model actions */  
  static async selectOne({pgschema = '', cols = '*', showHidden = false, pks = []} = {}) {
    // select one record by pk.
    const tcon = this;
    var tm, scerr, rec;
    var colNames, table, text;

    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});        

    rec = tcon.makePrimaryKey(pks);
    if (Object.values(rec).indexOf(null) > -1) return new TravelMessage({err: new UserError('Missing PK field')});        
    
    colNames = tcon.getColumnList({cols, isMainTable: true, showHidden});
    table = tcon.getTableName({pgschema});

    let [where, values] = tcon.makeSelectValues(rec);
    text = `SELECT ${colNames} FROM ${table} WHERE ${where.join(',')}`;
    tm = await tcon.sql({text, values});

    if (!tm.err) {
      if (tm.data.length != 1) {
        tm.err = new SQLSelectError('Non-One row returned');
      }
      else {
        //tm.data = tcon.construct(tm.data, cols)[0];  // return back model instance
        tm.data = tm.data[0];
      }
    }

    return tm;
  }

  static async select({pgschema = '', rec = {}, cols = '*', showHidden = false} = {}) {
    // select zero+ records based on model fields. No joins, etc.
    // use query if more features needed
    const tcon = this;
    var tm, scerr;
    var colNames, table, text;
    var orderBy;

    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});        

    colNames = tcon.getColumnList({cols, isMainTable: true, showHidden});
    table = tcon.getTableName({pgschema});
    orderBy = tcon.makeOrderBy();
    let [where, values] = tcon.makeSelectValues(rec);
    text = `SELECT ${colNames} FROM ${table}` + ((where.length > 0) ? ` WHERE ${where.join(',')}` : '');
    text += ' ' + orderBy;
    tm = await tcon.sql({text, values});

    //if (!tm.err) tm.data = objectify(tm.data);

    return tm;
  }
    
  static async insert({pgschema='', rows=[]} = {}) {
    // insert objects
    // iterate over rows inserting each
    // response is in data[], {isError: T|F, error: msg, data: rec}
    const tcon = this;
    var tm, tobj, errs, scerr, schema, table, text, row;
    var tmx = new TravelMessage();
    
    tmx.data = [];
    schema = tcon.getSchema();
    table = tcon.getTableName({pgschema});
    
    // make sure a valid pgschema
    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});        
    
    for (row of rows) {
      tobj = new this(row);
      
      await tobj.setSaveDefaults('i');
      
      errs = this.verifyOneFull({schema, oneOnly: false});
    
      if (Object.keys(errs).length > 0) {
        tmx.data.push({isError: true, error: validationFailed(tcon, errs).data});
        continue;
      }
      
      let [cols, params, values] = tcon.makeInsertValues(tobj);
      text = `INSERT INTO ${table} (${cols.join(',')}) VALUES(${params.join(',')}) RETURNING *;`;
      tm = await tcon.sql({text, values});
    
      if (tm.err) {
        tmx.data.push({isError: true, error: tm.err.message});
      }
      else {
        if (tm.data.length == 0) {
          tmx.data.push({isError: true, error: (new RowNotInsertedError()).message});
        }
        else {
          //tmx.data.push({isError: false, data: tcon.construct(tm.data)[0]});
          tmx.data.push({isError: false, data: tm.data[0]});
        }
      }
    }
    
    modelPubsub.publish(`${pgschema.toLowerCase()}.${tcon.name.toLowerCase()}`);    

    return tmx;
  }
  
  static async update({pgschema, rows=[]} = {}) {
    // update objects
    // iterate over rows updating each
    // response is in data[], {isError: T|F, error: msg, data: rec}
    const tcon = this;
    var tm, tobj, errs, scerr, schema, table, text, row;
    var tmx = new TravelMessage();
    
    tmx.data = [];
    schema = tcon.getSchema();
    table = tcon.getTableName({pgschema});
    
    // make sure a valid pgschema
    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});        
    
    for (row of rows) {
      tobj = new this(row);
      
      await tobj.setSaveDefaults('u');
      
      errs = this.verifyOnePartial({schema, oneOnly: false});
    
      if (Object.keys(errs).length > 0) {
        tmx.data.push({isError: true, error: validationFailed(tcon, errs).data});
        continue;
      }
      
      let [set, where, values] = tcon.makeUpdateValues(tobj);
      text = `UPDATE ${table} SET ${set.join(',')} WHERE ${where.join(',')} RETURNING *;`;
      tm = await tcon.sql({text, values});    
    
      if (tm.err) {
        tmx.data.push({isError: true, error: tm.err.message});
      }
      else {
        if (tm.data.length == 0) {
          tmx.data.push({isError: true, error: (new RowNotInsertedError()).message});
        }
        else {
          //tmx.data.push({isError: false, data: tcon.construct(tm.data)[0]});
          tmx.data.push({isError: false, data: tm.data[0]});
        }
      }
    }
    
    modelPubsub.publish(`${pgschema.toLowerCase()}.${tcon.name.toLowerCase()}`);    

    return tmx;    
  }
  
  //static async upsert(pgschema, rows) {
    // upsert model objects
  //}
  
  static async delete({pgschema = '', obj = {}}) {
    // delete one or more records
    const tcon = this;
    var tm, scerr, table, text;

    if (Object.keys(obj).length == 0) return new TravelMessage({err: new UserError('No fields valued')});    
    
    scerr = tcon.testPGSchema(pgschema);
    if (scerr) return new TravelMessage({err: new SQLSchemaError(scerr)});    
    
    // Do the deleting
    table = tcon.getTableName({pgschema});
    let [, where, values] = tcon.makeUpdateValues(obj);
    text = `DELETE FROM ${table} WHERE ${where.join(',')} RETURNING *;`;
    tm = await tcon.sql({text, values});

    if (!tm.err) {
      if (tm.data.length == 0) {
        tm.err = new SQLDeleteError();
      }
      else {
        //tm.data = tcon.construct(tm.data);
        modelPubsub.publish(`${pgschema.toLowerCase()}.${tcon.name.toLowerCase()}`);
      }
    }
    
    return tm;
  }
  
  static async sql(stmt) {
    // where the action happens, or at least calls the action-happenner
    return await exec(stmt);
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