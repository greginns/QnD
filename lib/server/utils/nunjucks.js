const nunjucks = require('nunjucks');

const filterList = {
  'dollars': function(amt) {
    return parseFloat(amt).toFixed(2);
  },
};

const render = function({path='', opts={}, filters=[], template='', context={}} = {}) {
  return new Promise(function(resolve, reject) {
    let nj = nunjucks.configure(path, opts);

    for (let filter of filters) {
      if (filter in filterList) nj.addFilter(filter, filterList[filter]);
    }

    nj.render(template, context, function(err, res) {
      if (err) {
        reject(err);
      }
      else {
        resolve(res)
      }
    });
  })
};

const renderString = function({opts={}, filters=[], template='', context={}} = {}) {
  return new Promise(function(resolve, reject) {
    let nj = nunjucks.configure(opts);

    for (let filter of filters) {
      if (filter in filterList) nj.addFilter(filter, filterList[filter]);
    }

    nj.renderString(template, context, function(err, res) {
      if (err) {
        reject(err);
      }
      else {
        resolve(res)
      }
    });
  })
};

module.exports = {render, renderString};