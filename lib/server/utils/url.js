// utilities to handle incoming URL

const modelQueryParse = function(query) {
  let cols = ['*'], rec = {}, limit = -1, offset = 0, where, values;

  if ('fields' in query) {
    cols = JSON.parse(query.fields);
  }

  if ('filters' in query) {
    let filterObj = JSON.parse(query.filters);

    for (let filter in filterObj) {
      rec[filter] = filterObj[filter];
    }
  }

  if ('where' in query && values in query) {
    where = query.where;
    values = JSON.parse(query.values);
  }

  if ('limit' in query) limit = parseFloat(query.limit) || 100;
  if ('offset' in query) query = parseFloat(query.offset) || 0;

  return {rec, cols, limit, offset, where, values};
}

module.exports = {modelQueryParse};