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
      type: 'NI',
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
      ftable: 'Orders',
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

const createSchema = function(pg) {
  //schema
  res = sqlb.createSchema(pg)
    
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  console.log('');
}

const dropSchema = function(pg) {
  //schema
  res = sqlb.dropSchema(pg)
    
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  console.log('');
}

const createTable = function(defn) {
  res = sqlb.createTable(app, defn.name)
  
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  console.log('');  

// Columns
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

// PKs  
  res = sqlb.createPK(app, defn.name, defn.pks)
  
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  console.log('')  

// FKs
  if (defn.fks) {
    for (let fk of defn.fks) {
      res = sqlb.createFK(app, defn.name, fk)
  
      if (res[1]) {
        handleErrors(res[1]);
      }
      else {
        console.log(res[0]);
      }

      console.log('');
    }
  }

// Indexes  
  if (defn.indexes) {
    for (let idx of defn.indexes) {
      res = sqlb.createIndex(app, defn.name, idx)
  
      if (res[1]) {
        handleErrors(res[1]);
      }
      else {
        console.log(res[0]);
      }

      console.log('');
    }
  }
}

const dropTable = function(defn) {
  // Indexes  
  if (defn.indexes) {
    for (let idx of defn.indexes) {
      res = sqlb.dropIndex(app, defn.name, idx)

      if (res[1]) {
        handleErrors(res[1]);
      }
      else {
        console.log(res[0]);
      }

      console.log('');
    }
  }

  // FKs
  if (defn.fks) {
    for (let fk of defn.fks) {
      res = sqlb.dropFK(app, defn.name, fk)

      if (res[1]) {
        handleErrors(res[1]);
      }
      else {
        console.log(res[0]);
      }

      console.log('');
    }
  }

  // PKs  
  res = sqlb.dropPK(app, defn.name, defn.pks)
    
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  console.log('')  

  // Columns
  for (let col of defn.columns) {
    res = sqlb.dropColumn(app, defn.name, col) ;

    if (res[1]) {
      handleErrors(res[1]);
    }
    else {
      console.log(res[0]);
    }

    console.log('')
  }

  // Table
  res = sqlb.dropTable(app, defn.name)
  
  if (res[1]) {
    handleErrors(res[1]);
  }
  else {
    console.log(res[0]);
  }

  console.log('');  
}

//createSchema(pgschema);
//createTable(contactTable);
//createTable(itemTable);
//createTable(orderTable);
//createTable(orderitemTable);
//dropTable(orderitemTable);
//dropTable(orderTable);
//dropTable(itemTable);
dropTable(contactTable);
//dropSchema(pgschema);