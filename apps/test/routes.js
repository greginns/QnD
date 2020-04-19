const root = process.cwd();

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {Router, RouterMessage} = require(root + '/lib/server/utils/router.js');
const {modelPubsub} = require(root + '/lib/server/utils/pubsub.js');
const services = require(root + '/apps/test/services.js');
const app = 'test';

var rows;
var rowsInit = [
  {_pk: '123', first: 'Alex', last: "Trebek"},
  {_pk: 'ABC', first: 'Pat', last: 'Sajak'},
  {_pk: '456', first: 'Merv', last: 'Griffin'},
  {_pk: 'DEF', first: 'Richard', last: 'Dawson'},
  {_pk: '999', first: 'Bob', last: 'Barker'}
];

for (var i=0; i<30; i++) {
  for (var j=0; j<30; j++) {
    rowsInit.push({_pk: String(i)+'.'+String(j), first: 'First ' +i, last: 'Last '+i});
  }
}

// Pages
// testdata
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/testdata', 
  fn: async function(req) {
    let tm = new TravelMessage({data: rows, type: 'json', status: 200});

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

Router.add(new RouterMessage({
  method: 'get',
  app,
  path: '/testdata/:pk', 
  fn: async function(req) {
    let pk = req.params.pk;
    let row = [];

    for (row of rows) {
      if (pk == row._pk) break;
    }

    let tm = new TravelMessage({data: [row], type: 'json', status: 200});

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

Router.add(new RouterMessage({
  method: 'post',
  app,
  path: '/testdata', 
  fn: async function(req) {
    let row = [{_pk: req.body._pk, first: req.body.first, last: req.body.last}];
    let found = false;

    for (let xRow of rows) {
      if (xRow._pk == req.body._pk) {
        found = true;
        break;
      }
    }

    if (!found) {
      rows.push(row[0]);
      modelPubsub.publish('david./test/testdata', {action: '+', rows: row});    
    }
    else {
      row = [];
    }

    let tm = new TravelMessage({data: row, type: 'json', status: 200});

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

Router.add(new RouterMessage({
  method: 'put',
  app,
  path: '/testdata/:pk', 
  fn: async function(req) {
    let row = {_pk: req.params.pk, first: req.body.first, last: req.body.last};
    let found = -1;

    for (let idx=0; idx<rows.length; idx++) {
      if (rows[idx]._pk == req.body._pk) {
        found = idx;
        break;
      }
    }    

    if (found > -1) {
      rows[found] = row;
    }

    modelPubsub.publish('david./test/testdata', {action: '*', rows: [row]});

    let tm = new TravelMessage({data: [row], type: 'json', status: 200});

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

Router.add(new RouterMessage({
  method: 'delete',
  app,
  path: '/testdata/:pk', 
  fn: async function(req) {
    let pk = req.params.pk;

    for (var idx = 0; idx<rows.length; idx++) {
      if (pk == rows[idx]._pk) {
        rows.splice(idx,1);
        break;
      }
    }  
    
    modelPubsub.publish('david./test/testdata', {action: '-', rows: [{_pk: pk}]});

    let tm = new TravelMessage({data: '', type: 'text', status: 200});

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

// Main/Login
Router.add(new RouterMessage({
  method: 'get',
  app,
  path: ['','/','/:etc'], 
  fn: async function(req) {
    rows = rowsInit.slice(0);

    var tm = await services.output.main(req);

    return tm.toResponse();
  }, 
  security: {
    strategies: []
  }
}));

// info rtns
Router.add(new RouterMessage({
  method: 'strategy',
  app,
  path: '/session', 
  fn: async function(req) {
    return [{code: 'david'}, {id: 'test'}];
  },
}));