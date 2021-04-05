const root = process.cwd();
const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const mailmerge = {
  group: 'doc',
  name: 'Mail Merge',

  actionList: [
    {value: 'render', text: 'Render document from a template file'},
    {value: 'renderString', text: 'Render document from a template string'}
  ],

  outputName: 'mailmerge',
  outputSuccess: 'Document string',

  actions: {
    render: async function(data) {
      const tm = new TravelMessage();
    
      try {
        try {
          tm.data = await nunjucks.render({path: root, opts: {autoescape: true}, filters: [], template: data.file, context: data.context});
          tm.type = 'text';
        }
        catch(err) {
          tm.status = 500;
          tm.message = err.toString();
        }
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    
      return tm;       
    },

    renderString: async function(data) {
      const tm = new TravelMessage();
    
      try {
        try {
          tm.data = await nunjucks.renderString({opts: {autoescape: true}, filters: [], template: data.template, context: data.context});
          tm.type = 'text';
        }
        catch(err) {
          tm.status = 500;
          tm.message = err.toString();
        }
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    
      return tm;       
     }
  },
  
  actionParams: {
    render: {
      file: {
        prompt: 'Template File',
        type: 'file',
      },
      context: {
        prompt: 'Data Context',
        type: 'string',
      }
    },

    renderString: {
      template: {
        prompt: 'Template Text',
        type: 'text',
      },
      context: {
        prompt: 'Data Context',
        type: 'object',
      }
    }
  },
  
  actionMatch: {     // built by user
    render: {
      file: '',
      context: '',
    },
    renderString: {
      template: '"<p>Hello {{first}},</p><p>Email me at {{email}}</p>"',
      context: 'data.initial'
    }
  }
}

module.exports = mailmerge;