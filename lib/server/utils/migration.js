const root = process.cwd();
const fs = require('fs').promises;
const fsx = require('fs');
const nunjucks = require('nunjucks');

const sqlUtil = require(root + '/lib/server/utils/sqlUtil.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const modelBuild = require(root + '/lib/server/model/modelBuild.js');
const config = require(root + '/config.json');
const templates = {};

templates.servelet = fsx.readFileSync(root + '/lib/server/model/templates/servelet.js', {encoding: 'utf-8'});
templates.routelet = fsx.readFileSync(root + '/lib/server/model/templates/routelet.js', {encoding: 'utf-8'});
templates.zaplet = fsx.readFileSync(root + '/lib/server/model/templates/zaplet.js', {encoding: 'utf-8'});

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

const createServelet = async function(app, appLC, modelName, modelNameLC, pk) {
  var folder = `${root}/apps/${app}/servelets`;
  var file = `${folder}/${modelNameLC}.js`;
  var err, opts = {flag: 'wx'}, js;

  try {
    await fs.mkdir(folder);
  }
  catch(e) {
    // already exists
  }

  try {
    let ctx = {name: modelName, subapp: modelNameLC, pk: pk, app, appLC};
    let nj = nunjucks.configure([root], {autoescape: true});

    js = nj.renderString(templates.servelet, ctx);
  }
  catch(e) {
      err = e;
  }

  try {
    await fs.writeFile(file, js, opts);
  }
  catch(e) {
    // don't care of this generates an error
  }

  return err;
};

const createRoutelet = async function(app, modelName, modelNameLC, pk) {
  var folder = `${root}/apps/${app}/routelets`;
  var file = `${folder}/${modelNameLC}.js`;  
  var err, opts = {flag: 'wx'}, js;

  try {
    await fs.mkdir(folder);
  }
  catch(e) {
    // already exists
  }

  try {
    let ctx = {name: modelName, subapp: modelNameLC, pk: pk, app};
    let nj = nunjucks.configure([root], {autoescape: true});

    js = nj.renderString(templates.routelet, ctx);
  }
  catch(e) {
    err = e;
  }

  try {
    await fs.writeFile(file, js, opts);
  }
  catch(e) {
    // don't care of this generates an error
  }

  return err;
};

const createZaplet = async function(app, modelName, modelNameLC, pk) {
  var folder = `${root}/apps/${app}/zaplets`;
  var file = `${folder}/${modelNameLC}.js`;
  var err, opts = {flag: 'wx'}, js;

  try {
    await fs.mkdir(folder);
  }
  catch(e) {
    // already exists
  }
        
  try {
    let ctx = {name: modelName, nameLC: modelNameLC, pk: pk[0], app};
    let nj = nunjucks.configure([root], {autoescape: true});

    js = nj.renderString(templates.zaplet, ctx);
  }
  catch(e) {
    err = e;
  }

  try {
    await fs.writeFile(file, js, opts);
  }
  catch(e) {
    // don't care of this generates an error
  }

  return err;
};

const migration = async function({tenant = 'public', migApp = null} = {}) {
  // run migration for one tenant
  var model, sql, sqlFK, fks = [], res, tableName, tm;
  var jsonModels, errs = [], verrs = [];
  var modelsList = {}, appNames = [];

  tm = new TravelMessage();

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

  // go through each app
  for (let app of appNames) {
    let folder = root + `/apps/${app}/migrations`;
    let migrationFile = folder + `/${tenant}.json`;
    let appLC = app.toLowerCase();

    try {
      await fs.mkdir(folder);
    }
    catch(e) {
      // already exists
    }

    jsonModels = await migFile.read(migrationFile);
    if (!jsonModels) return new TravelMessage({status: 500, message: 'Missing JSON file'});

    // go through each model and add, alter, remove
    for (let model of Object.keys(modelsList[app])) {
      let mb = new modelBuild(modelsList[app][model]);
      let modelName = mb.model.name;
      let modelNameLC = mb.model.name.toLowerCase();
      let pk = mb.model.getConstraints().pk;

      // create or alter
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

      if (res.status == 200) {
        // save fk sql for after all tables are created
        if (sqlFK) fks.push(sqlFK);

        // save updated json
        jsonModels[model] = mb.toJSON();
        await migFile.write(migrationFile, jsonModels);
      }
      else {
        errs.push({model, verrs: res.message});
      }

      // build servelet, routelet, zaplet, if not already existing
      let err;

      // servelet
      err = await createServelet(app, appLC, modelName, modelNameLC, pk[0]);
      if (err) errs.push({model, verrs: err});

      // routelet
      err = await createRoutelet(app, modelName, modelNameLC, pk[0]);
      if (err) errs.push({model, verrs: err});
      
      // zaplet
      //err = await createZaplet(app, modelName, modelNameLC, pk[0]);
      //if (err) errs.push({model, verrs: err});
    }

    // now create all FKs
    for (var fk of fks) {
      res = await sqlUtil.execQuery(fk);

      if (res.status != 200) {
        errs.push({model, verrs: res.message});
      }
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