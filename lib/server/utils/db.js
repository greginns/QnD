const root = process.cwd();
const {Pool} = require('pg');

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const dbs = require(root + '/db.json');

const pools = {};

for (let db of dbs) {
  pools[db.database] = new Pool(db);

  pools[db.database].on('error', function(err, client) {
    console.error('Unexpected error on idle client (db.js)', err)
    process.exit(-1)
  })
}

const getPool = function(database) {
  return pools[database];
}
/* Transaction process from user rtn:

    let tm = new TravelMessage();
    let client;

    let res = await getDBClient(database);
    if (res.status != 200) return res;

    try {
      client = res.client;
      await client.query('BEGIN');

      // ** Do your thang **
      let tobj = new this.model(rec);
      tm = await tobj.insertOne({database, pgschema, user});

      await client.query('COMMIT');
    }
    catch(err) {
      await client.query('ROLLBACK');

      tm.status = 500;
      tm.message = String(err);
      tm.type = 'text';
    }
    finally {
      client.release();
    }

*/

const exec = async function(database, sql) {
  let tm = new TravelMessage();        

  if (!database || !sql) {
    tm.status = 500;
    tm.message = 'No Database specified';
    tm.type = 'text';

    return tm;
  }    

  let pool = getPool(database);

  try {
    let res = await pool.query(sql);

    tm.data = res.rows;
  }
  catch(err) {
    tm.status = 500;
    tm.message = String(err);
    tm.type = 'text';

    console.log(sql)
    console.log(err)
  }

  return tm;
};

const shutdown = async function() {
  for (let pool of pools) {
    await pool.end();  
  }
};

class Transaction {
  constructor(database) {
    this.database = database;
  }

  async begin() {
    let tm = new TravelMessage();        
    let pool;

    if (!this.database) {
      tm.status = 500;
      tm.message = 'No Database specified';
      tm.type = 'text';

      return tm;
    }    

    try {
      pool = getPool(this.database);

      this.client = await pool.connect();
      this.client.query('BEGIN');
    }
    catch(err) {
      tm.status = 500;
      tm.message = String(err);
      tm.type = 'text';

      return tm;
    }
    
    return tm;    
  }

  async exec(sql) {
    let tm = new TravelMessage();        

    if (!sql) {
      tm.status = 500;
      tm.message = 'No SQL Stmt specified';
      tm.type = 'text';

      return tm;
    }        

    try {
      let res = await this.client.query(sql);

      tm.data = res.rows;
    }
    catch(err) {
      tm.status = 500;
      tm.message = String(err);
      tm.type = 'text';

      console.log(sql)
      console.log(err)
    }

    return tm;
  }

  async commit() {
    let tm = new TravelMessage();

    try {
      this.client.query('COMMIT');
    }
    catch(err) {
      tm.status = 500;
      tm.message = String(err);
      tm.type = 'text';
    }
    return tm;
  }

  async rollback() {
    let tm = new TravelMessage();

    try {
      this.client.query('ROLLBACK');
    }
    catch(err) {
      tm.status = 500;
      tm.message = String(err);
      tm.type = 'text';
    }

    return tm;
  }

  release() {
    this.client.release();
  }
}

module.exports = {exec, shutdown, Transaction};