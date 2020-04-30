const root = process.cwd();
const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const app = 'zapi';

const Zapsub = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({}),
        app: new Fields.Char({notNull: true, maxLength: 40, verbose: 'App Name'}),
        subapp: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Sub App Name'}),
        url: new Fields.Char({notNull: true, maxLength: 250, verbose: 'Zapier URL'}),
        events: new Fields.Jsonb({null: true, verbose: 'Events'}),
      },
      
      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['app'],
      
      dbschema: 'tenant',
      app,
      desc: 'Zap Subscriptions'
    }
  }
};

module.exports = {Zapsub};