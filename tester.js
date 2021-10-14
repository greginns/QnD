const root = process.cwd();
const models = require(root + '/apps/items/models.js');

console.log(models.Actrates.definition().constraints)