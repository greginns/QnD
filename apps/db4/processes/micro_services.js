const micro_services = {
  /*
    When setting up:
    Get parameters as name/default pairs.
    Build arguments as ({a='', b='', c=0, etc} = {})
    Return name

    let params = {a='xx', b='xy', x=43}
    data['return_name'] = func(params) {
      blah blah blah
      return x
    }

    let fn = `function({a='', b='', c=0}={}) {
        console.log(a,b,c);
      }`;
      
      let func2 = new Function('return ' + fn)();
      func2({a: 'greg', b: 'miller', c: 99})

      func2.toString();
  */
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
}

module.exports = micro_services;