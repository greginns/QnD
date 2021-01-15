const root = process.cwd();
const uuidv4 = require('uuid/v4');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const loginServices = require(root + '/apps/db4admin/services.js');

const app = getAppName(__dirname);
const services = {};

const models = require(root + `/apps/${app}/models.js`);

services.output = {
  main: async function(req) {
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
      let tmpl = 'apps/schema/modules/main/module.html';

      ctx.CSRFToken = token;
      ctx.workspace = models.workspace.getColumnDefns();
      ctx.app = models.application.getColumnDefns();
      ctx.table = models.table.getColumnDefns();

      ctx.USER = JSON.stringify(req.session.admin);

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
    let tobj = new models.table(rec);
    let tm = await tobj.insertOne({database, pgschema});

    return tm;    
  },
  
  update: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.table(rec);
    let tm = await tobj.updateOne({database, pgschema});
    
    return tm;
  },
  
  insertColumn: async function({database = '', pgschema = '', id = '', rec= {}} = {}) {
    // Insert column in an existing table row
    let res = await models.table.selectOne({database, pgschema, pks: [id] });
    let columns;

    if (res.status == 200) {
      columns = res.data.columns;
      columns.push(rec.column);

      res = await services.table.update({database, pgschema, id, rec: {columns}});
    }

    return res;
  },
  
  updateColumn: async function({database = '', pgschema = '', id = '', name = '', rec= {}} = {}) {
    // Update column in an existing table row
    let res = await models.table.selectOne({database, pgschema, pks: [id] });
    let columns;

    if (res.status == 200) {
      columns = res.data.columns || [];

      for (let idx=0; idx<columns.length; idx++) {
        if (columns[idx].name == name) {
          columns[idx] = rec.column;
          break;
        }
      }

      res = await services.table.update({database, pgschema, id, rec: {columns}});
    }

    return res;
  },
  
  deleteColumn: async function({database = '', pgschema = '', id = '', name = ''} = {}) {
    // Delete column in an existing table row
    let res = await models.table.selectOne({database, pgschema, pks: [id] });
    let columns;

    if (res.status == 200) {
      columns = res.data.columns || [];

      for (let idx=0; idx<columns.length; idx++) {
        if (columns[idx].name == name) {
          columns.splice(idx,1);
          break;
        }
      }

      res = await services.table.update({database, pgschema, id, rec: {columns}});
    }

    return res;
  },
  
  delete: async function({database = '', pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.table({ id });
    let tm = await tobj.deleteOne({database, pgschema});

    return tm;
  }
};

// Any other needed services
services.query = function({database = '', pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({query, app, database, pgschema, values});
}

module.exports = services;