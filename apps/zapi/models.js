const root = process.cwd();
const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);

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
        event: new Fields.Char({null: true, maxLength: 40, verbose: 'Event Name'}),
        url: new Fields.Char({notNull: true, maxLength: 250, verbose: 'Zapier URL'}),
      },
      
      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['app','subapp'],
      
      dbschema: 'tenant',
      app,
      desc: 'Zap Subscriptions'
    }
  }
};

const Zapq = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({}),
        app: new Fields.Char({notNull: true, maxLength: 40, verbose: 'App Name'}),
        subapp: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Sub App Name'}),
        event: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Event Name'}),
        body: new Fields.Jsonb({null: true, verbose: 'Post Body'}),
        options: new Fields.Jsonb({null: true, verbose: 'Post Options'}),
        added: new Fields.DateTime({notNull: true, verbose: 'Added Timestamp'}),
        runat: new Fields.DateTime({notNull: true, verbose: 'Next Run Time'}),
        retries: new Fields.Integer({notNull: true, default: 0, verbose: 'Retry Attempts'}),
        result: new Fields.Jsonb({null: true, verbose: 'Latest Result'}),
        status: new Fields.Char({null: true, maxLength: 3, verbose: 'HTTP Status'}),
      },
      
      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['app','subapp'],
      
      dbschema: 'tenant',
      app,
      desc: 'Zap Queue'
    }
  }
};

const Zapstat = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({}),
        app: new Fields.Char({notNull: true, maxLength: 40, verbose: 'App Name'}),
        subapp: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Sub App Name'}),
        event: new Fields.Char({notNull: true, maxLength: 40, verbose: 'Event Name'}),
        body: new Fields.Jsonb({null: true, verbose: 'Post Body'}),
        options: new Fields.Jsonb({null: true, verbose: 'Post Options'}),
        added: new Fields.DateTime({notNull: true, verbose: 'Added Timestamp'}),
        success: new Fields.Boolean({notNull: true, default: true, verbose: 'Success or Fail'}),
        retries: new Fields.Integer({notNull: true, default: 0, verbose: 'Retry Attempts'}),
        result: new Fields.Jsonb({null: true, verbose: 'Latest Result'}),
        status: new Fields.Char({null: true, maxLength: 3, verbose: 'HTTP Status'}),
      },
      
      constraints: {
        pk: ['id'],
      },
      
      hidden: [],
      
      orderBy: ['app','subapp'],
      
      dbschema: 'tenant',
      app,
      desc: 'Zap Status'
    }
  }
};

module.exports = {Zapsub, Zapq, Zapstat};