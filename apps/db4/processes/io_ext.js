const root = process.cwd();
const {TravelMessage, SendMessage} = require(root + '/lib/server/utils/messages.js')
const {send} = require(root + '/lib/server/utils/send.js')
// *** NEED SECURITY

const serialize = function(obj) {
  let str = [];

  for (let p in obj)
    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));

  return str.join("&");
}

const nonGetCommon = async function(data, secVal, method) {
  let headers = {}, body = {}, options = {}, type, chunked=false;
  let tm = new TravelMessage();

  options.method = method;

  // replace : URL parameters with values, ie  /:table/:id = /contacts/2
  let parts = data.url.split('/');
  let newURL = [];

  for (let part in parts) {
    if (part.substr(0,1) == ':') {
      let fld = part.substr(1);
      newURL.push(data.params[fld]);
    }
    else {
      newURL.push(part);
    }
  }

  options.url = newURL.join('/');

  body = data.body;
  type = data.type;

  let sm = new SendMessage({headers, body, options, type, chunked})
  let rm = await send(sm);

  tm.status = rm.status;
  tm.data = rm.data;
  tm.err = rm.err;

  return tm;  
}

const io_ext = {
  discover: [
    {'get': 'Get Data'},
    {'post': 'Send Data'},
    {'put': 'Replace Data'},
    {'patch': 'Update Data'},
    {'delete': 'Delete Data'},
  ],

  outputName: 'ioext',

  actions: {
    get: async function(data, secVal) {
      let headers = {}, body = {}, options = {}, type, chunked=false;
      let tm = new TravelMessage();

      options.url = data.url;
      options.method = 'GET';
      options.search = serialize(data.params);

      let sm = new SendMessage({headers, body, options, type, chunked})
      let rm = await send(sm);

      tm.status = rm.status;
      tm.data = rm.data;
      tm.err = rm.err;

      return tm;      
    },

    post: async function(data, secVal) {
      return nonGetCommon(data, secVal, 'POST');

    },

    put: async function(data, secVal) {
      return nonGetCommon(data, secVal, 'PUT');
    },    

    patch: async function(data, secVal) {
      return nonGetCommon(data, secVal, 'PATCH');
    },    

    delete: async function(data, secVal) {
      return nonGetCommon(data, secVal, 'DELETE');
    },    
 },
  
  actionParams: {
    get: {
      url: {
        prompt: 'URL string',
        type: 'string',
      },
      params: {
        prompt: 'Search parameters',
        type: 'object',
      },
      security: {
        prompt: 'Security Location',
        type: 'string',
        choices: ['url', 'header']
      },
      securityName: {
        prompt: 'Security Field',
        type: 'string'
      },
      securityValue: {
        prompt: 'Security Value',
        type: 'string'
      }
    },

    post: {
      url: {
        prompt: 'URL string',
        type: 'string',
      },
      params: {
        prompt: 'URL parameters',
        type: 'object',
      },
      body: {
        prompt: 'Post Body',
        type: 'object',
      },
      type: {
        prompt: 'Body encoding',
        type: 'string',
        choices: ['json', 'form']
      },
      security: {
        prompt: 'Security location',
        type: 'string',
        choices: ['header', 'body']
      },
      securityName: {
        prompt: 'Security Field',
        type: 'string'
      },
      securityValue: {
        prompt: 'Security Value',
        type: 'string'
      }      
    },

    put: {
      url: {
        prompt: 'URL string',
        type: 'string',
      },
      params: {
        prompt: 'URL parameters',
        type: 'object',
      },      
      body: {
        prompt: 'Put Body',
        type: 'object',
      },
      type: {
        prompt: 'Body encoding',
        type: 'string',
        choices: ['json', 'form']
      },
      security: {
        prompt: 'Security location',
        type: 'string',
        choices: ['header', 'body']
      },
      securityName: {
        prompt: 'Security Field',
        type: 'string'
      },
      securityValue: {
        prompt: 'Security Value',
        type: 'string'
      }      
    },

    patch: {
      url: {
        prompt: 'URL string',
        type: 'string',
      },
      params: {
        prompt: 'URL parameters',
        type: 'object',
      },      
      body: {
        prompt: 'Patch Body',
        type: 'object',
      },
      type: {
        prompt: 'Body encoding',
        type: 'string',
        choices: ['json', 'form']
      },
      security: {
        prompt: 'Security location',
        type: 'string',
        choices: ['header', 'body']
      },
      securityName: {
        prompt: 'Security Field',
        type: 'string'
      },
      securityValue: {
        prompt: 'Security Value',
        type: 'string'
      }      
    },

    delete: {
      url: {
        prompt: 'URL string',
        type: 'string',
      },
      params: {
        prompt: 'URL parameters',
        type: 'object',
      },      
      body: {
        prompt: 'Delete Body',
        type: 'object',
      },
      type: {
        prompt: 'Body encoding',
        type: 'string',
        choices: ['json', 'form']
      }      
    },
    security: {
      prompt: 'Security location',
      type: 'string',
      choices: ['header', 'body']
    },
    securityName: {
      prompt: 'Security Field',
      type: 'string'
    },
    securityValue: {
      prompt: 'Security Value',
      type: 'string'
    }
  },

  actionMatch: {     // built by user
    get: {
      url: '"https://static.roam3.opalstacked.com/js/idb.js"',
      params: '',
    },
  }
}

module.exports = io_ext;