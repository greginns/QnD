const root = process.cwd();

const Fields = require(root + '/lib/server/model/modelFields');
const Model = require(root + '/lib/server/model/modelRun.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const app = getAppName(__dirname);

const Docsetup = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({verbose: 'ID'}),
        company: new Fields.Char({notNull: true, maxLength: 1, verbose: 'Company'}),
        doctype: new Fields.Char({notNull: true, maxLength: 20, verbose: 'Doc Type'}),
        fromaddr: new Fields.Char({maxLength: 100, verbose: 'From'}),
        toaddr: new Fields.Char({maxLength: 500, verbose: 'To'}),
        ccaddr: new Fields.Char({maxLength: 500, verbose: 'CC'}),
        bccaddr: new Fields.Char({maxLength: 500, verbose: 'BCC'}),
        subjlist: new Fields.Char({maxLength: 500, verbose: 'Subject List'}),
        subject: new Fields.Char({maxLength: 100, verbose: 'Subject'}),
        ltrplace: new Fields.Char({notNull: true, default: 'B', maxLength: 1, verbose: 'Ltr Place'}),
        head: new Fields.Text({verbose: 'HTML <head>'}),
      },
      
      constraints: {
        pk: ['id'],
        fk: [],
      },
      
      hidden: [],
      
      orderBy: ['company', 'doctype'],
      
      dbschema: '',
      app,
      desc: 'Document Setup'
    }
  }
}

const Document = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({verbose: 'ID'}),
        name: new Fields.Char({maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        default: new Fields.Boolean({default: false, verbose: 'Default'}),
        body: new Fields.Text({verbose: 'Document Body'}),
        docsetup: new Fields.Integer({verbose: 'Docsetup ID'}),
      },
      
      constraints: {
        pk: ['id'],
        fk: [
          {name: 'docsetup', columns: ['docsetup'], app, table: Docsetup, tableColumns: ['id'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: '',
      app,
      desc: 'Document'
    }
  }
}

const Docletter = class extends Model {
  constructor(obj, opts) {
    super(obj, opts);
  }
  
  static definition() {
    return {
      schema: {
        id: new Fields.Serial({verbose: 'ID'}),
        name: new Fields.Char({maxLength: 50, verbose: 'Name'}),
        active: new Fields.Boolean({default: true, verbose: 'Active'}),
        default: new Fields.Boolean({default: false, verbose: 'Default'}),
        body: new Fields.Text({verbose: 'Document Body'}),
        docsetup: new Fields.Integer({verbose: 'Docsetup ID'}),
      },
      
      constraints: {
        pk: ['id'],
        fk: [
          {name: 'docsetup', columns: ['docsetup'], app, table: Docsetup, tableColumns: ['id'], onDelete: 'NO ACTION'},
        ],
      },
      
      hidden: [],
      
      orderBy: ['name'],
      
      dbschema: '',
      app,
      desc: 'Document Letters'
    }
  }
}

module.exports = {Docsetup, Document, Docletter};