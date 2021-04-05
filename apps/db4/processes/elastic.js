const root = process.cwd();
const {send} = require(root + '/lib/server/utils/send.js')
const {TravelMessage, SendMessage} = require(root + '/lib/server/utils/messages.js');
const {addSecurity} = require(root + '/lib/server/utils/processes.js');

const config = {
  hostname: 'api.elasticemail.com',
  port: 443,
  path: '/v2/email/send',
  method: 'POST',
  type: 'form',
  chunked: true,
  security: 'body',
  securityName: 'apikey'
};

const elastic = {
  group: 'email',
  name: 'Elastic',

  actionList: [
    {value: 'sendOne', text: 'Send One Transactional Email'}
  ],

  outputName: 'elastic',
  outputSuccess: `{
    "success": true, 
    "data": { 
      messageID: "-HHGPM_9RPhSMiaJq_ab4g3",
      transactionID: "aa253464-0bd0-467a-b24b-6159dcd7be60"
    } 
  }`,

  actions: {
    sendOne: async function(body, secVal) {
      let tm = new TravelMessage();
      let headers = {};

      let options = {
        hostname: config.hostname,
        path: config.path,
        port: config.port,
        method: config.method,
      };

      addSecurity(headers, body, config, secVal);

      let sm = new SendMessage({headers, body, options, type: config.type, chunked: config.chunked})
      let rm = await send(sm);

      tm.status = rm.status;
      tm.data = rm.data;
      tm.err = rm.err;

      return tm;
    },
  },

  actionParams: {
    sendOne: {
      from: {
        prompt: 'From Email Address',
        type: 'string',
      },
      sender: {
        prompt: 'From Name',
        type: 'string',
      },
      msgTo: {
        prompt: 'To Address(es)',
        type: 'string',
      },
      msgCC: {
        prompt: 'CC Address(es)',
        type: 'string',
      },
      msgBCC: {
        prompt: 'BCC Address(es)',
        type: 'string',
      },
      subject: {
        prompt: 'Subject',
        type: 'string',
      },
      'bodyHtml': {
        prompt: 'HTML Body',
        type: 'string'
      },
      'bodyText': {
        prompt: 'Text Body',
        type: 'string'
      }
    },
  },
  
  actionMatch: {     // built by user
    sendOne: {
      from: 'data.user.email',
      sender: 'data.user.first',
      msgTo: 'data.initial.email',
      subject: '"Sweet Ass Translator"',
      bodyHtml: 'data.mailmerge'
    },
  }

}

module.exports = elastic;