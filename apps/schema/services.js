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
//const loginServices = require(root + '/apps/db4admin/services.js');
const {exec} = require(root + '/lib/server/utils/db.js');
const {makeQuerySQL} = require(root + '/apps/db4/services.js');

const {actionGroups} = require(root + '/apps/db4/processes/index.js');

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

const updateZaptable = async function(database, pgschema, rec) {
  let table = rec.id;
  let zrec = {};

  await models.zaptable.delete({database, pgschema, obj:{table}});

  for (let event of ['create', 'update', 'delete']) {
    if (rec.zap[event]) {
      zrec = {zapsub: rec.zap[event], table, event};

      let tobj = new models.zaptable(zrec);
      await tobj.insertOne({database, pgschema});
    }
  }
}

services.output = {
  schema: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    let tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/schema/modules/schema/module.html';

      ctx.workspace = models.workspace.getColumnDefns();
      ctx.app = models.application.getColumnDefns();
      ctx.table = models.table.getColumnDefns();
      ctx.query = models.query.getColumnDefns();

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

  process: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    let tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/schema/modules/process/module.html';

      ctx.workspace = models.workspace.getColumnDefns();
      ctx.app = models.application.getColumnDefns();
      ctx.table = models.table.getColumnDefns();
      ctx.query = models.query.getColumnDefns();
      ctx.bizprocess = models.bizprocess.getColumnDefns();

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

  code: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    let tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/schema/modules/code/module.html';

      ctx.code = models.code.getColumnDefns();
      ctx.codebundle = models.codebundle.getColumnDefns();

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

  getAssociated: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    let tblRec = await getATable(database, pgschema, [rec.id]);
    let assoc = [];
    let tm = new TravelMessage();

    if (tblRec.status != 200) return tblRec;

    for (let fk of tblRec.data.fks || []) {
      let tblF = await getATable(database, pgschema, [fk.ftable]);
      let cols = tblF.data.columns.map(function(col) {
        return {name: col.name};
      })

      assoc.push({id: fk.ftable, name: tblF.data.name, relname: fk.name, cols});
    }

    tm.data = assoc;

    return tm;
  },

  getSets: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    let tblRec = await getATable(database, pgschema, [rec.id]);
    let assoc = [];
    let tm = new TravelMessage();

    if (tblRec.status != 200) return tblRec;
    
    for (let rfk of tblRec.data.rfks || []) {
      let tblF = await getATable(database, pgschema, [rfk.ftable]);
      let cols = tblF.data.columns.map(function(col) {
        return {name: col.name};
      })

      assoc.push({id: rfk.ftable, name: tblF.data.name, relname: rfk.name, cols});
    }

    tm.data = assoc;
  
    return tm;
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
      tm = await updateTable(database, pgschema, rec);
      await updateZaptable(database, pgschema, rec);
/*
      if (tm.status == 200) {
        let app = await getAnApp(database, pgschema, [tm.data.app]);
        let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);

        if (app.status == 200) {
          let sb = new SqlBuilder(workspace.data.name, 'postgres');

          tm.data.sql = sb.renameTable(app.data.name, table.data.name, rec.name);
        }
      }
*/      
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
    // id = table pk
/*
FK
[
  {
    "name":"contact",                         
    "app":"idTZPGDvGsw6CoScdUjL63",         foreign table's app
    "ftable":"eKVExJHhzJCpvxRC7Fsn8W",      foreign table
    "links":[
      {"source":"contact","target":"id"}    source field ---> target field
    ]
  }
]

RFK
[
  {
    "name":"contact",
    "app":"jpn23uLqGHnVVjGx8CeMCQ",         source table's app
    "ftable":"tXSsfRco6GDhRXiB4tL1Dt",      source table
    "links":[
      {"source":"id","target":"contact"}    reverse of source
    ]
  }
]
*/    
    let table = await getATable(database, pgschema, [id]);
    let app = await getAnApp(database, pgschema, [table.data.app]);
    let workspace = await getAWorkspace(database, pgschema, [app.data.workspace]);
    let res;

    if (table.status == 200 && app.status == 200) {
      let fks = table.fks || [];              // existing fks
      let ok = true;

      for (let fk of fks) {
        if (fk.name == rec.fk.name) {   // existing name, skip
          ok = false;
          break;
        }
      }

      if (ok) {
        // Update source table fks
        let fapp = await getAnApp(database, pgschema, [rec.fk.app]);        // fk app
        let ftable = await getATable(database, pgschema, [rec.fk.ftable]);  // fk table

        fks.push(rec.fk);       // add new fk
        res = await updateTable(database, pgschema, {id, fks});   // update table with all fks

        // Create rfk on foreign table
        let rfks = ftable.rfks || [];
        let links = rec.fk.links.map(function(link) {
          return {source: link.target, target: link.source};  // basically reverse source and target
        })

        rfks.push({name: rec.fk.name, app: table.data.app, ftable: id, links});
        res = await updateTable(database, pgschema, {id: rec.fk.ftable, rfks});   // update table with all rfks

        // Physically create FK   *** CREATE INDEX for backward relation
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
          oldFK = oldFK[0];
          ok = true;
          break;
        }
      }

      if (ok) {
        // Update source table fks
        let fapp = await getAnApp(database, pgschema, [oldFK.app]);
        let ftable = await getATable(database, pgschema, [oldFK.ftable]);

        res = await updateTable(database, pgschema, {id, fks});

        // Update rfk on foreign table
        let rfks = ftable.data.rfks || [];

        for (let idx = 0; idx<rfks.length; idx++) {
          let rfk = rfks[idx];

          if (rfk.name == name && rfk.app == table.data.app && rfk.ftable == id) {
            rfks.splice(idx, 1);

            res = await updateTable(database, pgschema, {id: oldFK.ftable, rfks});
            break;
          }
        }

        // Physically remove fk  *** DELETE INDEX
        let sb = new SqlBuilder(workspace.data.name, 'postgres');

        res.data.sql = sb.dropFK(app.data.name, table.data.name, fapp.data.name, ftable.data.name, oldFK)
      }
      else {
        res = new TravelMessage({status: 400});  
      }            
    }
    else {
      res = new TravelMessage({status: 400});
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
    
    let tm = await models.query.selectOne({database, pgschema, pks: [rec.id] });
console.log(tm, rec)    
    return tm;
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let [sql, valueobj] = await makeQuerySQL(database, rec);

    rec.sql = sql;
    rec.valueobj = valueobj;    

    let tobj = new models.query(rec);
    let tm = await tobj.insertOne({database, pgschema});

    console.log(tm)

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let [sql, valueobj] = await makeQuerySQL(database, rec);

    rec.sql = sql;
    rec.valueobj = valueobj;        

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
  },
};

services.bizprocess = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.bizprocess.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.bizprocess.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.bizprocess.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.bizprocess.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
console.log(rec)    
    let tobj = new models.bizprocess(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.bizprocess(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.bizprocess({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    let sql = SqlBuilder.dropSchema(tm.data.name, 'postgres');
    let tm1 = await exec(database, sql[0]);

    console.log(tm1)

    return tm;
  },
  
  getGroups: function() {
    let tm = new TravelMessage();
    let data = [];

    data.push({value: '_', text: 'Process Handler'});
    data.push({value: 'io', text: 'I/O'});
    data.push({value: 'email', text: 'Email'});
    data.push({value: 'doc', text: 'Document Process'});
    data.push({value: 'code', text: 'Server Side Functions'});

    tm.data = data;

    return tm;
  },

  getActions: function() {
    let tm = new TravelMessage();
    let data = [];

    for (let group in actionGroups) {
      let v = actionGroups[group];

      data.push({group: v.group, text: v.name, value: group});
    }

    tm.data = data;

    return tm;
  },

  getSubActions: async function(action, database) {
    let tm = new TravelMessage();
    let group = actionGroups[action];

    if (group.group == 'code') {
      tm.data = await group.actionList(database);
    }
    else {
      tm.data = group.actionList;
    }

    return tm;
  },

  getSubActionInputs: function(action, subaction) {
    let tm = new TravelMessage();
    let data = actionGroups[action].actionParams[subaction];

    tm.data = data;

    return tm;
  }

};

services.code = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.code.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.code.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.code.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.code.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.code(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.code(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.code({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

services.codebundle = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.codebundle.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.codebundle.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.codebundle.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.codebundle.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.codebundle(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.codebundle(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.codebundle({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

services.zapsub = {
  getMany: async function({database = '', pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.zapsub.where({database, pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.zapsub.select({database, pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.zapsub.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.zapsub.selectOne({database, pgschema, pks: [rec.id] });
  },
    
  create: async function({database = '', pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.zapsub(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.zapsub(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.zapsub({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

// Any other needed services
services.queryExec = function({database = '', pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({query, app, database, pgschema, values});
}

module.exports = services;