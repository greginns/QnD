// utilities to handle incoming URL

const modelQueryParse = function(query) {
  let cols = ['*'], rec = {}, limit = -1, offset = 0;

  if ('fields' in query) {
    cols = JSON.parse(query.fields).split(',');
  }

  if ('filters' in query) {
    let filterObj = JSON.parse(query.filters);

    for (let filter in filterObj) {
      rec[filter] = filterObj[filter];
    }
  }

  if ('limit' in query) limit = parseFloat(query.limit) || 100;
  if ('offset' in query) query = parseFloat(query.offset) || 0;

  return {rec, cols, limit, offset};
}

module.exports = {modelQueryParse};