const root = process.cwd();
const {exec} = require(root + '/lib/server/utils/db.js');

(async function() {
  let sql = "SELECT * FROM information_schema.columns WHERE table_schema = 'gm' AND table_name = 'documents_Docsetup'";

  let res = await exec('qnd',sql)

  console.log(res)
})()
