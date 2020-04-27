const root = process.cwd();
const {Pubsub} = require(root + '/lib/server/utils/pubsub.js');

const modelPubsub = new Pubsub();
const zapPubsub = new Pubsub();

module.exports = {
  modelPubsub,
  zapPubsub
}