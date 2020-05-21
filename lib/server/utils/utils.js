const getAppName = function(path) {
  const fpn = (path.indexOf('/') > 0) ? path.split('/') : path.split('\\');
  const al = fpn.indexOf('apps');
  
  return (al > -1) ? fpn[al+1] : '';
}

const getSubappName = function(path) {
  const fpn = (path.indexOf('/') > 0) ? path.split('/') : path.split('\\');
  const name = fpn[fpn.length-1].split('.');

  return name[0];
}

module.exports = {getAppName, getSubappName};