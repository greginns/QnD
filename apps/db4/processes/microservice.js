const micro_services = {
  group: 'io',
  name: 'Micro Services',

  actionList: [
    {value: 'service-1', text: 'Service #1'},
    {value: 'service-2', text: 'Service #2'},
  ],

  outputName: 'microservice',

  actions: {
    'service-1': async function() {
    },

    'service-2': async function() {
    },
  },
  
  actionParams: {
    'service-1': {
      arguments: {
        prompt: 'Argument List',
        type: 'string',
      },
      return: {
        prompt: 'Return value',
        type: 'string',
      },
    },

    'service-2': {
      arguments: {
        prompt: 'Argument List',
        type: 'string',
      },
      return: {
        prompt: 'Return value',
        type: 'string',
      },
    },
  },

  actionMatch: {     // built by user
    lookup: {
      table: '"eKVExJHhzJCpvxRC7Fsn8W"',
      pk: 'data.initial.id',
      columns: '"*"'
    },
  }
}

module.exports = micro_services;