const root = process.cwd();
const fs = require('fs').promises;
const sqlUtil = require(root + '/server/utils/sqlUtil.js');
const ModelBuild = require(root + '/server/model/ModelBuild.js');
const migration = require(root + '/server/utils/migration.js');

const readMigFile = async function(file) {
  var data = {};
  
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

var migrate = async function(tenant, app) {
  var ret = await migration(tenant, app);
  console.log(ret);
}

var dropAll = async function(tenant, app) {
  var dt = new Date();
  var pwd = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate();
  var model, sql, mb, res;

  var modelNames = require(root + `/apps/${app}/models/models.js`);
  
  for (model of modelNames) {
    mb = new ModelBuild(models[model]);
    sql = mb.drop(tenant, pwd);
    console.log(sql);
    
    res = await sqlUtil.execQuery(sql);
    console.log(res);
  }
  
  buildJSON(tenant, app);
  
  sqlUtil.shutdown();
  console.log('DONE')
}

var buildJSON = async function(tenant, app) {
  var model, mb, sql, res;
  var migrationFile = root + `/apps/${app}/models/migrations/${tenant}.json`;
  var jsonModels = await readMigFile(migrationFile);
  
  for (model of modelNames) {
    mb = new ModelBuild(models[model]);
    jsonModels[app][model] = mb.toJSON();
  };

  writeMigFile(migrationFile, jsonModels);
}

async function doit() {
  var ret = await migrate('public', 'admin');

  console.log(ret);

  sqlUtil.shutdown();
}

var initUser = async function() {
  var rec = {code: 'greg', name: 'Greg Miller', email: 'greg@reservation-net.com', password: 'herbie', active: true}
  //var rec = {code: 'monica', name: 'Monica Eurich', email: 'monicae@neoc.com', password: 'adriana9', active: true};
  var user = new models.admin_User(rec);
  var tm = await user.insertOne({pgschema, rec});
  console.log(tm)
}

/*
async function test() {
var arr = [
  {code: 'greg', name: 'Greg Miller', email: 'greg@reservation-net.com', password: 'herbie99', active: true},
  {code: 'monica', name: 'Monica Eurich', email: 'monicae@neoc.com', password: 'adriana9', active: true}
]


//for (r of arr) {
//  var tm = await models.tenant.User.delete({pgschema: 'neoc', obj: {code: r.code}});
//  console.log(tm)
//}

var tm = await models.tenant.User.insert({pgschema:'neoc', rows: arr});
console.log(tm)
}

test()
*/