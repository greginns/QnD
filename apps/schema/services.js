const root = process.cwd();
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {modelService} = require(root + '/lib/server/utils/services.js');
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

class Db4workspaceModelService {
  constructor({model=''} = {}) {
    this.model = model;
    this.pgschema = 'public';
    this.admin = 'b9455c80-757d-4cc8-831f-b7ec4d9c9b01';

    return this.build();
  }

  build() {
    const services = {
      getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
        // Get one or more rows
        return (where) 
          ? await this.model.where({pgschema: this.pgschema, where, values, cols, limit, offset, orderby}) 
          : await this.model.select({pgschema: this.pgschema, rec, cols, limit, offset, orderby});
      }.bind(this),
      
      getOne: async function({pgschema = '', rec = {}} = {}) {
        // Get specific row
        if ('id' in rec && rec.id == '_default') {
          let tm = new TravelMessage();
    
          tm.data = this.model.getColumnDefaults();
          tm.type = 'json';
    
          return tm;
        }
        
        return await this.model.selectOne({pgschema: this.pgschema, pks: [rec.id] });
      }.bind(this),
        
      create: async function({pgschema = '', rec = {}} = {}) {
        // Insert row
        rec.admin = this.admin;

        let tobj = new this.model(rec);
        let tm = await tobj.insertOne({pgschema: this.pgschema});
    
        return tm;    
      }.bind(this),
      
      update: async function({pgschema = '', id = '', rec= {}} = {}) {
        // Update row
        rec.id = id;
    
        let tobj = new this.model(rec);
        let tm = await tobj.updateOne({pgschema: this.pgschema});
        
        return tm;
      }.bind(this),
      
      delete: async function({pgschema = '', id = ''} = {}) {
        // Delete row
        let tobj = new this.model({ id });
        let tm = await tobj.deleteOne({pgschema: this.pgschema});
    
        return tm;
      }.bind(this)
    }

    return services;
  }
}


class Db4appModelService {
  constructor({model=''} = {}) {
    this.model = model;
    this.pgschema = 'public';
    this.admin = 'b9455c80-757d-4cc8-831f-b7ec4d9c9b01';

    return this.build();
  }

  build() {
    const services = {
      getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
        // Get one or more rows
        return (where) 
          ? await this.model.where({pgschema: this.pgschema, where, values, cols, limit, offset, orderby}) 
          : await this.model.select({pgschema: this.pgschema, rec, cols, limit, offset, orderby});
      }.bind(this),
      
      getOne: async function({pgschema = '', rec = {}} = {}) {
        // Get specific row
        if ('id' in rec && rec.id == '_default') {
          let tm = new TravelMessage();
    
          tm.data = this.model.getColumnDefaults();
          tm.type = 'json';
    
          return tm;
        }
        
        return await this.model.selectOne({pgschema: this.pgschema, pks: [rec.id] });
      }.bind(this),
        
      create: async function({pgschema = '', rec = {}} = {}) {
        // Insert row
        rec.admin = this.admin;

        let tobj = new this.model(rec);
        let tm = await tobj.insertOne({pgschema: this.pgschema});
    
        return tm;    
      }.bind(this),
      
      update: async function({pgschema = '', id = '', rec= {}} = {}) {
        // Update row
        rec.id = id;
    
        let tobj = new this.model(rec);
        let tm = await tobj.updateOne({pgschema: this.pgschema});
        
        return tm;
      }.bind(this),
      
      delete: async function({pgschema = '', id = ''} = {}) {
        // Delete row
        let tobj = new this.model({ id });
        let tm = await tobj.deleteOne({pgschema: this.pgschema});
    
        return tm;
      }.bind(this)
    }

    return services;
  }
}

class Db4tableModelService {
  constructor({model=''} = {}) {
    this.model = model;
    this.pgschema = 'public';
    this.admin = 'b9455c80-757d-4cc8-831f-b7ec4d9c9b01';

    return this.build();
  }

  build() {
    const services = {
      getMany: async function({pgschema = '', rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
        // Get one or more rows
        return (where) 
          ? await this.model.where({pgschema: this.pgschema, where, values, cols, limit, offset, orderby}) 
          : await this.model.select({pgschema: this.pgschema, rec, cols, limit, offset, orderby});
      }.bind(this),
      
      getOne: async function({pgschema = '', rec = {}} = {}) {
        // Get specific row
        if ('id' in rec && rec.id == '_default') {
          let tm = new TravelMessage();
    
          tm.data = this.model.getColumnDefaults();
          tm.type = 'json';
    
          return tm;
        }
        
        return await this.model.selectOne({pgschema: this.pgschema, pks: [rec.id] });
      }.bind(this),
        
      create: async function({pgschema = '', rec = {}} = {}) {
        // Insert row
        rec.admin = this.admin;

        let tobj = new this.model(rec);
        let tm = await tobj.insertOne({pgschema: this.pgschema});
    
        return tm;    
      }.bind(this),
      
      update: async function({pgschema = '', id = '', rec= {}} = {}) {
        // Update row
        rec.id = id;
    
        let tobj = new this.model(rec);
        let tm = await tobj.updateOne({pgschema: this.pgschema});
        
        return tm;
      }.bind(this),
      
      delete: async function({pgschema = '', id = ''} = {}) {
        // Delete row
        let tobj = new this.model({ id });
        let tm = await tobj.deleteOne({pgschema: this.pgschema});
    
        return tm;
      }.bind(this)
    }

    return services;
  }
}

// Model services
services.db4workspace = new Db4workspaceModelService({model: models.Db4workspace});
services.db4app = new Db4appModelService({model: models.Db4app});
services.db4table = new Db4tableModelService({model: models.Db4table});

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