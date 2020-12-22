const root = process.cwd();
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {CSRF} = require(root + '/apps/login/models.js');

const app = getAppName(__dirname);
const services = {};

const models = require(root + `/apps/${app}/models.js`);

const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'h:mm A';

const makeCSRF = async function(tenant, user) {
  // tenant and user are their codes
  var CSRFToken = uuidv1();
      
  // create CSRF record
  var rec = new CSRF({token: CSRFToken, user: user});
  await rec.insertOne({pgschema: tenant});

  return CSRFToken;
}

services.db4workspace = {
  getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.Db4workspace.where({pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.Db4workspace.select({pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.Db4workspace.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.Db4workspace.selectOne({pgschema, pks: [rec.id] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.Db4workspace(rec);
    let tm = await tobj.insertOne({pgschema});

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.Db4workspace(rec);
    let tm = await tobj.updateOne({pgschema});
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.Db4workspace({ id });
    let tm = await tobj.deleteOne({pgschema});

    return tm;
  }
};

services.db4app = {
  getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.Db4app.where({pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.Db4app.select({pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.Db4app.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.Db4app.selectOne({pgschema, pks: [rec.id] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.Db4app(rec);
    let tm = await tobj.insertOne({pgschema});

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.Db4app(rec);
    let tm = await tobj.updateOne({pgschema});
    
    return tm;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.Db4app({ id });
    let tm = await tobj.deleteOne({pgschema});

    return tm;
  }
};

services.db4table = {
  getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    // Get one or more rows
    return (where) 
      ? await models.Db4table.where({pgschema, where, values, cols, limit, offset, orderby}) 
      : await models.Db4table.select({pgschema, rec, cols, limit, offset, orderby});
  },
  
  getOne: async function({pgschema = '', rec = {}} = {}) {
    // Get specific row
    if ('id' in rec && rec.id == '_default') {
      let tm = new TravelMessage();

      tm.data = models.Db4table.getColumnDefaults();
      tm.type = 'json';

      return tm;
    }
    
    return await models.Db4table.selectOne({pgschema, pks: [rec.id] });
  },
    
  create: async function({pgschema = '', rec = {}} = {}) {
    // Insert row
    let tobj = new models.Db4table(rec);
    let tm = await tobj.insertOne({pgschema});

    return tm;    
  },
  
  update: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    rec.id = id;

    let tobj = new models.Db4table(rec);
    let tm = await tobj.updateOne({pgschema});
    
    return tm;
  },
  
  updateColumns: async function({pgschema = '', id = '', rec= {}} = {}) {
    // Update row
    let res = await models.Db4table.selectOne({pgschema, pks: [id] });
    let columns;

    if (res.status == 200) {
      columns = res.data.columns;
      columns.push(rec.column);

      res = await services.db4table.update({pgschema, id, rec: {columns}});
    }

    return res;
  },
  
  delete: async function({pgschema = '', id = ''} = {}) {
    // Delete row
    let tobj = new models.Db4table({ id });
    let tm = await tobj.deleteOne({pgschema});

    return tm;
  }
};

// Any other needed services
services.query = function({pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({query, app, pgschema, values});
}

services.output = {
  main: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/schema/modules/main/module.html';

      ctx.CSRFToken = await makeCSRF(req.TID, req.user.code);
      ctx.db4workspace = models.Db4workspace.getColumnDefns();
      ctx.db4app = models.Db4app.getColumnDefns();
      ctx.db4table = models.Db4table.getColumnDefns();

      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.TID = req.TID;    
      ctx.USER = JSON.stringify(req.user);

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

module.exports = services;