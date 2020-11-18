// utilities to handle incoming URL

const urlQueryParse = function(urlQuery) {
  let cols = ['*'], rec = {}, limit = -1, offset = 0, where, query, values, orderby = '';

  if ('query' in urlQuery) query = JSON.parse(urlQuery.query);
  if ('fields' in urlQuery) cols = JSON.parse(urlQuery.fields);
  if ('where' in urlQuery) where = urlQuery.where || '';
  if ('values' in urlQuery) values = JSON.parse(urlQuery.values);
  if ('limit' in urlQuery) limit = parseFloat(urlQuery.limit) || 100;
  if ('offset' in urlQuery) offset = parseFloat(urlQuery.offset) || 0;
  if ('orderby' in urlQuery) orderby = urlQuery.orderby || '';

  if ('filters' in urlQuery) {
    let filterObj = JSON.parse(urlQuery.filters);

    for (let filter in filterObj) {
      rec[filter] = filterObj[filter];
    }
  }

  return {rec, cols, limit, offset, where, query, values, orderby};
}

module.exports = {urlQueryParse};