const root = process.cwd();
const models = require(root + `/apps/schema/models.js`);
const context = {'greg': '60'};

function requireFromString(src, filename) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
}

const code_process = {
  group: 'code',
  name: 'Process Handlers',

  actionList: async function(database) {
    let ret = [];
    let codes = await models.code.select({database, pgschema: 'public', rec: {type: 'SR'}});

    if (codes.status == 200) {
      for (let code of codes.data) {
        ret.push({text: code.desc, value: code.id});
      }
    }

    return ret;
  },

  actions: async function(database, fnid, data) {
    let tm = await models.code.select({database, pgschema: 'public', rec: {id: fnid}});
    let code = tm.data[0].code;

    let src = `module.exports = {temp: async function(dataObj) {${code}}};`;
    let func = requireFromString(src, '');
    let rc = {status: 200};

    rc.data = func.temp.call(context, data);

    return rc;
  },
  
  actionParams: {
  },
}

module.exports = code_process;