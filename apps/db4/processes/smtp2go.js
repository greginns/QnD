const root = process.cwd();
const {send} = require(root + '/lib/server/utils/send.js')
const {TravelMessage, SendMessage} = require(root + '/lib/server/utils/messages.js');
const {addSecurity} = require(root + '/lib/server/utils/processes.js');

const config = {
  hostname: 'api.smtp2go.com',
  port: 443,
  path: '/v3/email/send',
  method: 'POST',
  type: 'json',
  chunked: false,
  security: 'body',
  securityName: 'api_key'
};

const smtp2go = {
  group: 'email',
  name: 'SMTP2Go',

  actionList: [
    {value: 'sendOne', text: 'Send One Transactional Email'}
  ],

  outputName: 'smtp2go',
  outputSuccess: `{
    "request_id": "aa253464-0bd0-467a-b24b-6159dcd7be60",
    "data": {
      "succeeded": 1,
      "failed": 0,
      "failures": [],
      "email_id": "1er8bV-6Tw0Mi-7h"
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
      sender: {
        type: 'string',
        template: '${this.fromname} <${this.from}>',
        visible: false,
      },
      from: {
        prompt: 'From Email Address',
        type: 'string',
        virtual: true
      },
      fromname: {
        prompt: 'From Name',
        type: 'string',
        virtual: true
      },
      to: {
        prompt: 'To Address(es)',
        type: 'array',
      },
      cc: {
        prompt: 'CC Address(es)',
        type: 'array',
      },
      bcc: {
        prompt: 'BCC Address(es)',
        type: 'array',
      },
      subject: {
        prompt: 'Subject',
        type: 'string',
      },
      'html_body': {
        prompt: 'HTML Body',
        type: 'string'
      },
      'text_body': {
        prompt: 'Text Body',
        type: 'string'
      }
    },
  },

  actionMatch: {     // built by user
    sendOne: {
      from: 'data.user.email',
      fromname: 'data.user.first',
      to: 'data.initial.email',
      subject: '"Sweet Ass Translator"',
      html_body: 'data.mailmerge'
    },
  }
}

module.exports = smtp2go;