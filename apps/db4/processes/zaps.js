const root = process.cwd();

const models = require(root + `/apps/schema/models.js`);

const zaps = {
  group: 'io',
  name: 'Zapier',

  actionList: [
    {value: 'createContact', text: 'Send New Contact info to Sheets'},
    {value: 'updateContact', text: 'Send Updated Contact info to Sheets'}
  ],

  actions: {
    updateContact: async function(data, secval, database, pid) {
      let runat = new Date();
      let zapsubRec = await models.zapsub.selectOne({database, pgschema: 'public', pks: [data.zapId]});
      let options = {method: 'POST', url: zapsubRec.data.url};
      let source = {source: 'process', 'process': pid};

      let zrec = {zapsub: data.zapId, source, body: data.body, options, added: runat, runat, retries: 0};
      let zapq = new models.zapq(zrec);

      return await zapq.insertOne({database, pgschema: 'public'});
    }
  },

  actionParams: {
    updateContact: {
      zapId: {
        prompt: 'Zap ID',
        type: 'string'
      },
      body: {
        prompt: 'Zap Data',
        type: 'string'
      }
    }
  },
}

module.exports = zaps;