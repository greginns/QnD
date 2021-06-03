const root = process.cwd();
const services = require(root + `/apps/db4/services.js`);

const io_int = {
  group: 'io',
  name: 'Internal I/O',

  actionList: [
    {value: 'lookup', text: 'Get One Row'},
    {value: 'lookups', text: 'Get Many Rows'},
    {value: 'create', text: 'Create One Row'},
    {value: 'update', text: 'Update One Row'},
    {value: 'delete', text: 'Delete One Row'},
    {value: 'query', text: 'Run a Query'}
  ],

  actions: {
    lookup: async function(database, data) {
      let tm = await services.table.getOne(database, data.table, data.pk, data.filters, data.columns)

      return tm;
    },

    lookups: async function(database, data) {
      let tm = await services.table.getOne(database, data.table, data.filters, data.columns)

      return tm;
    },

    create: async function(database, data) {
      let tm = await services.table.insert(database, data.table, data.data);

      return tm;
    },

    update: async function(database, data) {
      let tm = await services.table.insert(database, data.table, data.data);

      return tm;
    },    

    delete: async function(database, data) {
      let tm = await services.table.insert(database, data.table, data.data);

      return tm;
    },    

    query: async function(database, data) {
      let tm = await services.table.getOne(database, data.qid)

      return tm;
    },    
  },
  
  actionParams: {
    lookup: {
      table: {
        prompt: 'Table ID',
        type: 'string',
      },
      pk: {
        prompt: 'Primary Key ID',
        type: 'string',
      },
      filters: {
        prompt: 'Filter Object',
        type: 'object',
      },
      columns: {
        prompt: 'Column List',
        type: 'array',
      }
    },

    lookups: {
      table: {
        prompt: 'Table ID',
        type: 'string',
      },
      filters: {
        prompt: 'Filter Object',
        type: 'object',
      },
      columns: {
        prompt: 'Column List',
        type: 'array',
      }      
    },

    create: {
      table: {
        prompt: 'Table ID',
        type: 'string',
      },
      data: {
        prompt: 'Data',
        type: 'object',
      }
    },

    update: {
      table: {
        prompt: 'Table ID',
        type: 'string',
      },
      pk: {
        prompt: 'Primary Key ID',
        type: 'string',
      },
      data: {
        prompt: 'Data',
        type: 'object',
      }
    },      

    delete: {
      table: {
        prompt: 'Table ID',
        type: 'string',
      },
      pk: {
        prompt: 'Primary Key ID',
        type: 'string',
      }
    },

    query: {
      table: {
        prompt: 'Query ID',
        type: 'string',
      },
      filters: {
        prompt: 'Filter Object',
        type: 'object',
      },
      columns: {
        prompt: 'Column List',
        type: 'array',
      }      
    },    
  },
}

module.exports = io_int;