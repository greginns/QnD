/* TO DO
  Clean up all sql
    Use transactions to do DDL then saving/deleting
    More testing on column changes
*/
const root = process.cwd();

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {jsonQueryExecify, SqlBuilder} = require(root + '/lib/server/utils/sqlUtil.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const loginServices = require(root + '/apps/db4admin/services.js');
const {exec} = require(root + '/lib/server/utils/db.js');

const app = getAppName(__dirname);
const services = {};

const models = require(root + `/apps/${app}/models.js`);

const getAWorkspace = async function(database, pgschema, id) {
  return await models.workspace.selectOne({database, pgschema, pks: id});
} 

const getAnApp = async function(database, pgschema, id) {
  return await models.application.selectOne({database, pgschema, pks: id});
} 

const getATable = async function(database, pgschema, id) {
  return await models.table.selectOne({database, pgschema, pks: id});
} 

const updateTable = async function(database, pgschema, rec) {
  let tobj = new models.table(rec);

  return await tobj.updateOne({database, pgschema});
}

services.output = {
  schema: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    let tm = new TravelMessage();
    let token = await loginServices.auth.makeCSRF(req);

    if (!token) {
      tm.status = 500;
      tm.message = 'CSRF Token Generation failed';

      return tm;
    }

    try {
      let ctx = {};
      let tmpl = 'apps/schema/modules/schema/module.html';

      ctx.CSRFToken = token;
      ctx.workspace = models.workspace.getColumnDefns();
      ctx.app = models.application.getColumnDefns();
      ctx.table = models.table.getColumnDefns();

      ctx.USER = JSON.stringify(req.session.data.user);

      try {
        tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
        tm.type = 'html';
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    }
    catch(err) {
      tm.status = 500;
      tm.message = err.toString();
    }

    return tm;
  },

  query: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    let tm = new TravelMessage();
    let token = await loginServices.auth.makeCSRF(req);

    if (!token) {
      tm.status = 500;
      tm.message = 'CSRF Token Generation failed';

      return tm;
    }

    try {
      let ctx = {};
      let tmpl = 'apps/schema/modules/query/module.html';

      ctx.CSRFToken = token;
      ctx.workspace = models.workspace.getColumnDefns();
      ctx.app = models.application.getColumnDefns();
      ctx.table = models.table.getColumnDefns();

      ctx.USER = JSON.stringify(req.session.data.user);

      try {
        tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
        tm.type = 'html';
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    }
    catch(err) {
      tm.status = 500;
      tm.message = err.toString();
    }

    return tm;
  },  
}
/*
services.database = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.database.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.database.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.database.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.database.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.database(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.database(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.database({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};
*/

services.workspace = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.workspace.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.workspace.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.workspace.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.workspace.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.workspace(rec);
    let tm = await tobj.insertOne({database, pgschema});

    let sql = SqlBuilder.createSchema(rec.name, 'postgres');
    let tm1 = await exec(database, sql[0]);

    console.log(tm1)

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.workspace(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.workspace({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    let sql = SqlBuilder.dropSchema(tm.data.name, 'postgres');
    let tm1 = await exec(database, sql[0]);

    console.log(tm1)

    return tm;
  }
};

services.application = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.application.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.application.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.application.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.application.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.application(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.application(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.application({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

services.table = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.table.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.table.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.table.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.table.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let app = await getAnApp(database, pgschema, [rec.app]);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);

    let tobj = new models.table(rec);
    let tm = await tobj.insertOne({database, pgschema});
// *** Reverse this, only create if insert worked.
// Use a transaction for these.
    if (tm.status == 200) {
      let app = await models.application.selectOne({database, pgschema, pks: [rec.app] });

      if (app.status == 200) {
        let sb = new SqlBuilder(workspace.data.name, 'postgres');
        let sql = sb.createTable(app.data.name, rec.name);

        let tm1 = await exec(database, sql[0]);
console.log(tm1)        
        tm.data.sql = sql;
      }
    }
    
    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row, rename table
    let tm;
    rec.id = id;
// *** Reverse this, only update if rename worked.
    let table = await getATable(database, pgschema, [id]);

    if (table.status == 200) {
      tm = await updateTable(database, pgschema, rec)

      if (tm.status == 200) {
        let app = await getAnApp(database, pgschema, [tm.data.app]);
        let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);

        if (app.status == 200) {
          let sb = new SqlBuilder(workspace.data.name, 'postgres');

          tm.data.sql = sb.renameTable(app.data.name, table.data.name, rec.name);
        }
      }
    }
    else {
      tm = new TravelMessage({status: 400})
    }

    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.table({ id });
    let tm = await tobj.deleteOne({database, pgschema});

// *** Reverse this.  Only delete if drop worked.
    if (tm.status == 200) {
      let app = await models.application.selectOne({database, pgschema, pks: [tm.data.app] });
      let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);

      if (app.status == 200) {
        let sb = new SqlBuilder(workspace.data.name, 'postgres');
        tm.data.sql = sb.dropTable(app.data.name, tm.data.name);
      }
    }

    return tm;
  },

  updatePK: async function({database = '', pgschema = '', id = '', rec = {}} = {}) {
    let table = await getATable(database, pgschema, id);
    let app = await getAnApp(database, pgschema, table.data.app);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let res;

    if (table.status == 200 && app.status == 200) {
      rec.id = id;
      res = await updateTable(database, pgschema, rec);

      let sb = new SqlBuilder(workspace.data.name, 'postgres');
      let sql = sb.createPK(app.data.name, table.data.name, rec.pk);
      let tm1 = await exec(database, sql[0]);
console.log(tm1)        
      res.data.sql = sql;      
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;
  },

  insertFK: async function({database = '', pgschema = '', id = '', rec = {}} = {}) {
    let table = await getATable(database, pgschema, [id]);
    let app = await getAnApp(database, pgschema, [table.data.app]);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let res;

    if (table.status == 200 && app.status == 200) {
      let fks = table.fks || [];
      let ok = true;

      for (let fk of fks) {
        if (fk.name == rec.table.fk.name) {
          ok = false;
          break;
        }
      }

      if (ok) {
        let fapp = await getAnApp(database, pgschema, [rec.fk.app]);
        let ftable = await getATable(database, pgschema, [rec.fk.ftable]);

        fks.push(rec.fk);
        res = await updateTable(database, pgschema, {id, fks});

        let sb = new SqlBuilder(workspace.data.name, 'postgres');
        let sql = sb.createFK(app.data.name, table.data.name, fapp.data.name, ftable.data.name, rec.fk);
        let tm1 = await exec(database, sql[0]);
console.log(tm1)        
        res.data.sql = sql;
      }
      else {
        res = new TravelMessage({status: 404});  
      }      
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;    
  },

  deleteFK: async function({database = '', pgschema = '', id = '', name = ''} = {}) {
    let table = await getATable(database, pgschema, [id]);
    let app = await getAnApp(database, pgschema, [table.data.app]);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let res, oldFK;

    if (table.status == 200 && app.status == 200) {
      let fks = table.data.fks || [];
      let ok = false;

      for (let idx=0; idx<fks.length; idx++) {
        if (name == fks[idx].name) {
          oldFK = fks.splice(idx, 1);
          ok = true;
          break;
        }
      }

      if (ok) {
        oldFK = oldFK[0];
        let fapp = await getAnApp(database, pgschema, [oldFK.app]);
        let ftable = await getATable(database, pgschema, [oldFK.ftable]);

        res = await updateTable(database, pgschema, {id, fks});

        let sb = new SqlBuilder(workspace.data.name, 'postgres');

        res.data.sql = sb.dropFK(app.data.name, table.data.name, fapp.data.name, ftable.data.name, oldFK)
      }
      else {
        res = new TravelMessage({status: 404});  
      }            
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;    
  },  

  insertIndex: async function({database = '', pgschema = '', id = '', rec = {}} = {}) {
    let table = await getATable(database, pgschema, id);
    let app = await getAnApp(database, pgschema, table.data.app);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let res;

    if (table.status == 200 && app.status == 200) {
      let indexes = table.indexes || [];
      let ok = true;

      for (let index of indexes) {
        if (index.name == rec.index.name) {
          ok = false;
          break;
        }
      }

      if (ok) {
        indexes.push(rec.index);
        res = await updateTable(database, pgschema, {id, indexes});

        let sb = new SqlBuilder(workspace.data.name, 'postgres');
        let sql = sb.createIndex(app.data.name, table.data.name, rec.index);
        let tm1 = await exec(database, sql[0]);
console.log(tm1)        
        res.data.sql = sql;
      }
      else {
        res = new TravelMessage({status: 404});  
      }      
      
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;    
  },

  deleteIndex: async function({database = '', pgschema = '', id = '', name = ''} = {}) {
    let table = await getATable(database, pgschema, [id]);
    let app = await getAnApp(database, pgschema, [table.data.app]);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let res, oldIdx;

    if (table.status == 200 && app.status == 200) {
      let indexes = table.data.indexes;
      let ok = false;

      for (let idx=0; idx<indexes.length; idx++) {
        if (name == indexes[idx].name) {
          oldIdx = indexes.splice(idx, 1);
          ok = true;
          break;
        }
      }

      if (ok) {
        res = await updateTable(database, pgschema, {id, indexes});

        let sb = new SqlBuilder(workspace.data.name, 'postgres');
  
        res.data.sql = sb.dropIndex(app.data.name, table.data.name, oldIdx[0])

      }
      else {
        res = new TravelMessage({status: 404});  
      }                  
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;    
  },

  updateOrderby: async function({database = '', pgschema = '', id = '', rec = {}} = {}) {
    let table = await getATable(database, pgschema, id);
    let app = await getAnApp(database, pgschema, table.data.app);
    let res;

    if (table.status == 200 && app.status == 200) {
      rec.id = id;
      res = await updateTable(database, pgschema, rec);
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;    
  },
};

services.column = {
  insert: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Insert column into an existing table row
    let table = await getATable(database, pgschema, [id]);
    let app = await getAnApp(database, pgschema, [table.data.app]);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let columns, res;
// *** Clean up

    if (table.status == 200 && app.status == 200) {
      columns = table.data.columns || [];
      columns.push(rec.column);

      res = await updateTable(database, pgschema, {id, columns});

      let sb = new SqlBuilder(workspace.data.name, 'postgres');
      let sql = sb.createColumn(app.data.name, table.data.name, rec.column);

      let tm1 = await exec(database, sql[0]);
      console.log(tm1)        

      res.data.sql = sql;      
      
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;
  },
  
  update: async function({database = '', pgschema = '', id = '', name = '', rec= {}} = {}) {
    // Update column in an existing table row
    let table = await models.table.selectOne({database, pgschema, pks: [id] });

    let app = await models.application.selectOne({database, pgschema, pks: [table.data.app] });
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let columns, res, oldCol;

    if (table.status == 200 && app.status == 200) {
      columns = table.data.columns || [];

      for (let idx=0; idx<columns.length; idx++) {
        if (columns[idx].name == name) {
          oldCol = columns[idx];
          columns[idx] = rec.column;
          break;
        }
      }

      res = await updateTable(database, pgschema, {id, columns});

      let sb = new SqlBuilder(workspace.data.name, 'postgres');
      res.data.sql = sb.alterColumn(app.data.name, table.data.name, rec.column, oldCol);
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;
  },
  
  delete: async function({database = '', pgschema = '', id = '', name = ''} = {}) {
    // Delete column in an existing table row
    let table = await getATable(database, pgschema, id);
    let app = await getAnApp(database, pgschema, table.data.app);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let res, columns, delCol;

    if (table.status == 200 && app.status == 200) {
      columns = table.data.columns || [];

      for (let idx=0; idx<columns.length; idx++) {
        if (columns[idx].name == name) {
          delCol = columns.splice(idx,1);
          break;
        }
      }

      if (delCol.length > 0) {
        res = await updateTable(database, pgschema, {id, columns});

        let sb = new SqlBuilder(workspace.data.name, 'postgres');
        let sql = sb.dropColumn(app.data.name, table.data.name, delCol[0]);
        let tm1 = await exec(database, sql[0]);
console.log(tm1)
        res.data.sql = sql;
      }
    }
    else {
      res = new TravelMessage({status: 404});
    }

    return res;
  },


}

services.query = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.query.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.query.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.query.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.query.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.query(rec);
    let tm = await tobj.insertOne({database, pgschema});

    let sql = SqlBuilder.createSchema(rec.name, 'postgres');
    let tm1 = await exec(database, sql[0]);

    console.log(tm1)

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.query(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.query({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    let sql = SqlBuilder.dropSchema(tm.data.name, 'postgres');
    let tm1 = await exec(database, sql[0]);

    console.log(tm1)

    return tm;
  }
};

// Any other needed services
services.queryExec = function({database = '', pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({query, app, database, pgschema, values});
}

module.exports = services;