const root = process.cwd();
const fs = require('fs').promises;
const models = require(root + '/apps/items/models.js');
const sqlUtil = require(root + '/lib/server/utils/sqlUtil.js');
const database = 'qnd';
const pgschema = 'gm';
//const pgschema = 'neoc';
console.log(models)
async function test() {
  var arr = [
    {code: 'T4', name: 'Test4', dirlink: 'greg', test: ['17:05:00.000', '18:10:00.000', '19:15:00.000']},
  ]

  //let rec = await models.Area.selectOne({database, pgschema, pks: ['T3']})
  //console.log(rec)

  for (let r of arr) {
    let rec = new models.Area(r);
    let tm = await rec.insertOne({database, pgschema, user: {}});
    console.log(tm)
  }
  
}

/*
var tm = await models.tenant.User.insert({pgschema:'neoc', rows: arr});
console.log(tm)
}
*/

test();