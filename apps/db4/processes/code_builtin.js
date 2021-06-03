const root = process.cwd();
const models = require(root + `/apps/schema/models.js`);
const context = {'greg': '60'};

const builtins = {
  '1': {desc: 'Builtin-1', func: async function(database, data) {
    console.log('built-in-1', context)
    return {database};
  }},

  '2': {desc: 'Builtin-2', func: async function(database, data) {
    console.log('built-in-2', data, database)
  }},

};

const code_builtin = {
  group: 'code',
  name: 'Built-in Functions',

  actionList: async function() {
    let ret = [];

    for (let bi in builtins) {
      ret.push({value: bi, text: builtins[bi].desc});
    }

    return ret;
  },

  actions: async function(database, fnid, data) {
    let rc = {status: 200};
    rc.data =  await builtins[fnid].func(database, data);

    return rc;
  },

  actionParams: {
  },
}

module.exports = code_builtin;