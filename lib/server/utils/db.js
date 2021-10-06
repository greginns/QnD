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

module.exports = {
  exec: function(database, sql) {
    let tm = new TravelMessage();        

    return new Promise(function(resolve) {
      if (!database) {
        tm.status = 500;
        tm.message = 'No Database specified';
        tm.type = 'text';
  
        resolve(tm);
        return;
      }    

      pools[database]
      .query(sql)
      .then(function(res) {
        tm.data = res.rows;

        resolve(tm);
      })
      .catch(function(err) {
        tm.status = 500;
        tm.message = String(err); // + ' - ' + JSON.stringify(sql);
        tm.type = 'text';
        console.log(sql)
        console.log(err)
        resolve(tm);
      })
    })
  },
  
  trans: async function() {
    let client = null;

    try {
      client = await pool.connect();
    } 
    catch (error) {
      return error;
    }

    try {
      await client.query('BEGIN');
      await client.query('UPDATE foo SET bar = 1');
      await client.query('UPDATE bar SET foo = 2');
      await client.query('COMMIT');
    } 
    catch (error) {
      try {
        await client.query('ROLLBACK');
      } 
      catch (rollbackError) {
        return rollbackError;
      }
      
      return error;
    } 
    finally {
      client.release();
    }

    return 'Success!';    
  },
  
  shutdown: async function() {
    for (let pool of pools) {
      await pool.end();  
    }
  },
}