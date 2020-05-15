const getAppName = function(path) {
  const fpn = (path.indexOf('/') > 0) ? path.split('/') : path.split('\\');
  const al = fpn.indexOf('apps');
  
  return (al > -1) ? fpn[al+1] : '';
}

module.exports = {getAppName};