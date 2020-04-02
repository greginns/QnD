const root = process.cwd();
const fs = require('fs').promises;

const sqlUtil = require(root + '/server/utils/sqlUtil.js');
const {SystemError} = require(root + '/server/utils/errors.js');
const {TravelMessage} = require(root + '/server/utils/messages.js');
const modelBuild = require(root + '/server/model/modelBuild.js');
const config = require(root + '/config.json');

const migFile = {
  read: async function(file) {
    var data = {};
    
    try {
      data = JSON.parse(await fs.readFile(file));
    }
    catch(err) {
      console.log(err);
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
      console.log(err)
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
      console.log(err);
    }
    
    return rc;
  }
}

const migration = async function({tenant = 'public', migApp = null} = {}) {
  var model, sql, sqlFK, fks = [], res, tableName;
  var jsonModels, errs = [], verrs = [];
  var modelsList = {}, appNames = [];

  if (tenant == 'public' && !migApp) migApp = 'admin';

  if (tenant == 'public' && migApp && migApp != 'admin') {
    tm.data = {message: 'public schema can only be admin app'};
    tm.status = 400;
    return tm;
  }

  if (migApp) {
    modelsList[migApp] = require(root + `/apps/${migApp}/models.js`);
    appNames.push[migApp];
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
  for (var app of appNames) {
    for (var model of Object.keys(modelsList[app])) {
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
  for (var app of appNames) {
    let migrationFile = root + `/apps/${app}/migrations/${tenant}.json`;
    
    jsonModels = await migFile.read(migrationFile);
    if (!jsonModels) return new TravelMessage({err: new SystemError('Missing JSON file')});

    for (var model of Object.keys(modelsList[app])) {
      let mb = new modelBuild(modelsList[app][model]);

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
    }

    for (var fk of fks) {
      res = await sqlUtil.execQuery(fk);
    }
  };  
  
  // go through old models, drop any not current
  for (app of appNames) {
    var migrationFile = root + `/apps/${app}/migrations/${tenant}.json`;
    var jsonModels = await migFile.read(migrationFile);
    var modelNames = Object.keys(modelsList[app]);
    var jsonNames = Object.keys(jsonModels);

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