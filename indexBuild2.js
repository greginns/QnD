const root = process.cwd();
const migration = require(root + '/lib/server/utils/migration.js');

const tenant = 'gm';
const migApp = 'zapi';

(async function() {
  let res = await migration({tenant, migApp});

  console.log(res)
})();