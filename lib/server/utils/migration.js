const root = process.cwd();
const fs = require('fs').promises;
const fsx = require('fs');
const nunjucks = require('nunjucks');

const sqlUtil = require(root + '/lib/server/utils/sqlUtil.js');
const {SystemError} = require(root + '/lib/server/utils/errors.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const modelBuild = require(root + '/lib/server/model/modelBuild.js');
const config = require(root + '/config.json');
const templates = {};

templates.servelet = fsx.readFileSync(root + '/lib/server/model/templates/servelet.js', {encoding: 'utf-8'});
templates.routelet = fsx.readFileSync(root + '/lib/server/model/templates/routelet.js', {encoding: 'utf-8'});

const ifFileExists = function(file) {
  try {
    if (fsx.existsSync(file)) {
      return true;
    }
  } catch(err) {
    return false;
  }  
};

const migFile = {
  read: async function(file) {
    var data = {};
    
    try {
      data = JSON.parse(await fs.readFile(file));
    }
    catch(err) {
      //console.log(err);
    }
    
    return data;
  },

  write: async function(file, json) {
    var data = false
    
    try {
      await fs.writeFile(file, JSON.stringify(json));
      
      data = true;
    }
    catch(err) {
      //console.log(err)
    }
    
    return data;
  },

  delete: async function(file) {
    var rc = false
    
    try {
      await fs.unlink(file);
      
      rc = true;    
    }
    catch(err) {
      //console.log(err);
    }
    
    return rc;
  }
}

const migration = async function({tenant = 'public', migApp = null} = {}) {
  // run migration for one tenant
  var model, sql, sqlFK, fks = [], res, tableName, tm;
  var jsonModels, errs = [], verrs = [];
  var modelsList = {}, appNames = [];

  if (tenant == 'public' && !migApp) migApp = 'admin';

  if (tenant == 'public' && migApp && migApp != 'admin') {
    tm.data = {message: 'public schema can only be for admin app'};
    tm.status = 400;
    return tm;
  }

  if (migApp) {
    modelsList[migApp] = require(root + `/apps/${migApp}/models.js`);
    appNames.push(migApp);
  }
  else {
    config.apps.forEach(function(app) {
      if (app != 'admin') {
        modelsList[app] = require(root + `/apps/${app}/models.js`);
        appNames.push(app);
      }
    })
  }

  // verify tables
  for (let app of appNames) {
    for (let model of Object.keys(modelsList[app])) {
      let mb = new modelBuild(modelsList[app][model]);
      verrs = mb.verify();
      
      if (verrs.length > 0) {
        errs.push({model, verrs: verrs.join(',')});
      }
    }
  }

  if (errs.length > 0) {
    tm.data = {errors: {'_verify': errs}};
    tm.status = 400;
    return tm;
  }

  // go through current models and add, alter
  for (let app of appNames) {
    let migrationFile = root + `/apps/${app}/migrations/${tenant}.json`;

    jsonModels = await migFile.read(migrationFile);
    if (!jsonModels) return new TravelMessage({err: new SystemError('Missing JSON file')});

    for (let model of Object.keys(modelsList[app])) {
      let mb = new modelBuild(modelsList[app][model]);
      let modelName = mb.model.name;
      let modelNameLC = mb.model.name.toLowerCase();
      let pk = mb.model.getConstraints().pk;

      if (! (model in jsonModels)) {
        var [verrs, sql, sqlFK] = mb.create(tenant);
      }
      else {
        var [verrs, sql] =  mb.alter(tenant, jsonModels[model]);
        sqlFK = '';
      }
      
      if (verrs.length > 0) {
        errs.push({model, verrs: verrs.join(',')});
        continue;
      }
      
      res = await sqlUtil.execQuery(sql);

      if (!res.err) {
        // save fk sql for after all tables are created
        if (sqlFK) fks.push(sqlFK);

        // save updated json
        jsonModels[model] = mb.toJSON();

        await migFile.write(migrationFile, jsonModels);
      }
      else {
        errs.push({model, verrs: res.err.message});
      }

      // build servelet, routelet
      let file;
      
      file = `${root}/apps/${app}/servelets/${modelNameLC}.js`

      if (!ifFileExists(file)) {
        try {
          let ctx = {name: modelName, nameLC: modelNameLC, pk: pk[0], app};
          let nj = nunjucks.configure([root], {autoescape: true});
          let js = nj.renderString(templates.servelet, ctx);

          fsx.writeFileSync(file, js);
        }
        catch(e) {
          errs.push({model, verrs: e});
        }
      }

      file = `${root}/apps/${app}/routelets/${modelNameLC}.js`
      
      if (!ifFileExists(file)) {
        try {
          let ctx = {name: modelName, nameLC: modelNameLC, pk: pk[0], app};
          let nj = nunjucks.configure([root], {autoescape: true});
          let js = nj.renderString(templates.routelet, ctx);

          fsx.writeFileSync(file, js);
        }
        catch(e) {
          errs.push({model, verrs: e});
        }
      }
    }

    for (var fk of fks) {
      res = await sqlUtil.execQuery(fk);
    }
  }
  
  // go through old models, drop any not current
  for (let app of appNames) {
    let migrationFile = root + `/apps/${app}/migrations/${tenant}.json`;
    let jsonModels = await migFile.read(migrationFile);
    let modelNames = Object.keys(modelsList[app]);
    let jsonNames = Object.keys(jsonModels);

    for (model of jsonNames) {
      if (modelNames.indexOf(model) == -1) {
        // can't use Model.drop as model doesn't exist anymore!     
        tableName = `"${tenant}"."${app}_${model}"`
        sql = `DROP TABLE IF EXISTS ${tableName} CASCADE`;    
      
        res = await sqlUtil.execQuery(sql);
        
        if (!res.err) {
          delete jsonModels[model];
          
          await migFile.write(migrationFile, jsonModels);
        }
        else {
          errs.push({model, verrs: res.err.message});
        }
      }
    }
  }
  
  tm = new TravelMessage();
  
  if (errs.length > 0) {
    tm.data = {errors: {'_verify': errs}};
    tm.status = 400;
  }

  return tm;
};

module.exports = migration;