const root = process.cwd();
const assert = require('assert').strict;
const db = require(root + '/lib/server/utils/sqlUtil.js');

const dashes = '---------------------------------------------';
const pgschema = 'sqlutil';
const app = 'test';

const contactTable = {
  id: '12345',
  name: 'Contacts',
  desc: 'Contact List',
  workspace: 'sqlutil',
  app,
  columns: [
    {
      type: 'CC',
      name: 'contact',
      maxlength: '8',
      null: false
    },
    {
      type: 'CC',
      name: 'first',
      maxlength: '40',
      default: 'Greg',
      null: false
    },
    {
      type: 'CC',
      name: 'last',
      maxlength: '40',
      null: false
    },
    {
      type: 'CC',
      name: 'email',
      maxlength: '100',
      null: false
    },    
    {
      type: 'CT',
      name: 'notes',
      null: true
    },
    {
      type: 'CP',
      name: 'password',
      null: true
    },
    {
      type: 'DZ',
      name: 'timestamp',
      null: false
    },
    {
      type: 'MB',
      name: 'active',
      default: true,
      null: false
    }
  ],

  pks: ['contact'],
  fks: [],
  
  indexes: [
    {
      name: 'email',
      columns: ['email']
    }
  ],

  orderby: ['last', 'first']
};

const itemTable = {
  id: 'ABCDEF',
  name: 'Items',
  desc: 'Item Master',
  workspace: 'sqlutil',
  app,
  columns: [    
    {
      type: 'CC',
      name: 'itemno',
      maxlength: '40',
      null: false
    },
    {
      type: 'CT',
      name: 'desc',
      null: false
    },
    {
      type: 'MB',
      name: 'active',
      default: 'true',
      null: false
    },
    {
      type: 'NF',
      name: 'price',
      null: false,      
    },
    {
      type: 'MU',
      name: 'uuid',
      null: true,
    }
  ],

  pks: ['itemno'],
  fks: [],
  
  indexes: [
    {
      name: 'desc',
      columns: ['desc']
    }
  ],

  orderby: ['desc']
}

const orderTable = {
  id: '23456',
  name: 'Orders',
  desc: 'Order Header',
  workspace: 'sqlutil',
  app,
  columns: [  
    {
      type: 'NS',
      name: 'orderno',
    },    
    {
      type: 'DD',
      name: 'orderdate',
      null: false
    },
    {
      type: 'DT',
      name: 'ordertime',
      null: false
    },
    {
      type: 'CC',
      name: 'custno',
    }
  ],

  pks: ['orderno'],
  fks: [
    {
      name: 'custno',
      app: 'test',
      ftable: 'Contacts',
      links: [
        {
          source: 'custno',
          target: 'custno'
        }
      ]
    }
  ],
  
  indexes: [],

  orderby: ['orderno']
};

const orderitemTable = {
  id: '34567',
  name: 'Orderitems',
  desc: 'Order Items',
  workspace: 'sqlutil',
  app,
  columns: [  
    {
      type: 'NS',
      name: 'id',
      null: false
    },    
    {
      type: 'NF',
      name: 'orderno',
      null: false
    },
    {
      type: 'CC',
      name: 'itemno',
      null: false
    },
    {
      type: 'NI',
      name: 'qty',
      default: '1',
      null: false
    },
    {
      type: 'NF',
      name: 'price',
      null: false
    },
    {
      type: 'ND',
      name: 'charge',
      digits: '8',
      decimals: '2',
      null: false
    }
  ],

  pks: ['id'],
  fks: [
    {
      name: 'orderno',
      app: 'test',
      ftable: 'Orderhdr',
      links: [
        {
          source: 'orderno',
          target: 'orderno'
        }
      ]
    },
    {
      name: 'itemno',
      app: 'test',
      ftable: 'Items',
      links: [
        {
          source: 'itemno',
          target: 'itemno'
        }
      ]
    }
  ],
  
  indexes: [],

  orderby: ['orderno', 'itemno']    
};

let log = function(res) {
  console.log(res);
}

const handleErrors = function(err) {
  console.error(err)
}

let sqlb = new db.SqlBuilder(pgschema);
let res;

const createTable = function(defn) {
  log('Create Table - ' + defn.name)
  res = sqlb.createTable(app, defn.name)
  
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  log('Columns');

  for (let col of defn.columns) {
    res = sqlb.createColumn(app, defn.name, col) ;
  
    if (res[1]) {
      handleErrors(res[1]);
    }
    else {
      console.log(res[0]);
    }

    console.log('')
  }

  log('Create PK/FK/Index - Contacts')

  res = sqlb.createPK(app, defn.name, defn.pks)
  
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  if (defn.fks) {
    for (let fk of defn.fks) {
      res = sqlb.createFK(app, defn.name, fk)
  
      if (res[1]) {
        handleErrors(res[1]);
      }
      else {
        console.log(res[0]);
      }
    }
  }

  if (defn.indexes) {
    for (let idx of defn.indexes) {
      res = sqlb.createIndex(app, defn.name, idx)
  
      if (res[1]) {
        handleErrors(res[1]);
      }
      else {
        console.log(res[0]);
      }
    }
  }

  log(dashes);
}

//schema
log('Create Schema - ' + pgschema)
res = sqlb.createSchema(pgschema)
  
if (res[1]) {
  handleErrors(res[1]);
}
else {
  console.log(res[0]);
}

log(dashes)

//Contacts
//createTable(contactTable);
createTable(itemTable);
//createTable(orderTable);
//createTable(orderitemTable);