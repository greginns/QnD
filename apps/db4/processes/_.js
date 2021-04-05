const root = process.cwd();

const _initial = {
  group: '_',
  name: 'Initial',

  actionList: [
    {value: '_initial', text: 'Handle Incoming Process'},
  ],

  outputName: '_initial',
  outputSuccess: 'Data Object',

  actions: {
  },
  
  actionParams: {
    _initial: {
      _initial: {
        prompt: 'Incoming Data',
        type: 'object',
      },
    },
  },
}

const _final = {
  group: '_',
  name: 'Final',

  actionList: [
    {value: '_final', text: 'Return Process Data'},
  ],

  outputName: '_final',
  outputSuccess: 'Data Object',

  actions: {
  },
  
  actionParams: {
    _final: {
      _final: {
        prompt: 'Outgoing Data',
        type: 'object',
      },
    },
  },
}

module.exports = {_initial, _final};