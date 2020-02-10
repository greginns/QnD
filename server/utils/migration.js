const root = process.cwd();
const fs = require('fs').promises;

const sqlUtil = require(root + '/server/utils/sqlUtil.js');
const {SystemError} = require(root + '/server/utils/errors.js');
const {TravelMessage} = require(root + '/server/utils/messages.js');
const config = require(root + '/config.json');

const readMigFile = async function(file) {
  var data = false
  
  try {
    data = JSON.parse(await fs.readFile(file));
  }
  catch(err) {
    console.log(err);
  }
  
  return data;
}

const writeMigFile = async function(file, json) {
  var data = false
  
  try {
    await fs.writeFile(file, JSON.stringify(json));
    
    data = true;
  }
  catch(err) {
    console.log(err)
  }
  
  return data;
}

const deleteMigFile = async function(file) {
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

const migration = async function(tenant, migApp) {
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
      let mb = new modelBuild(model);
      verrs = mb.verify(tenant);
      
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
    
    jsonModels = await readMigFile(migrationFile);
    if (!jsonModels) return new TravelMessage({err: new SystemError('Missing JSON file')});

    for (var model of Object.keys(modelsList[app])) {
      let mb = new modelBuild(model);

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
        if (sqlFK) fks.push(sqlFK);

        jsonModels[model] = mb.toJSON();

        await writeMigFile(migrationFile, jsonModels);
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

    for (model of Object.keys(modelsList[app])) {
      if (! (model in modelsList[app])) {
        // can't use Model.drop as model doesn't exist anymore!     
        tableName = `"${tenant}"."${model}"`
        sql = `DROP TABLE IF EXISTS ${tableName}`;    
      
        res = await sqlUtil.execQuery(sql);
        
        if (!res.err) {
          delete jsonModels[model];
          
          await writeMigFile(migrationFile, jsonModels);
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