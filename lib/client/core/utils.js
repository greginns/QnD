var utils = {object: {}};

utils.escapeRegExp = function(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

utils.camelCase = function(string) {
  return string.substr(0,1).toUpperCase() + string.substr(1);
};

utils.object.isObject = function(a) {
  if (!a) return false;
  return (a) && (a.constructor === Object);
};
    
utils.object.isFunction = function(a) {
  if (!a) return false;
  return (a) && (typeof a === 'function');
};

utils.object.isArray = function(a) {
  if (!a) return false;
  return (a) && (Array(a).isArray());
};

utils.object.diff = function(obj1, obj2) {
  // old vs new, return diffs
  var diffs = {};
  
  Object.keys(obj1).forEach(function(k) {
    if (! (k in obj2)) {
      diffs[k] = '';
    }
    else if (obj1[k] != obj2[k]) {
      diffs[k] = obj2[k];
    }
  })
  
  Object.keys(obj2).forEach(function(k) {
    if (! (k in obj1)) diffs[k] = obj2[k];
  })
  
  return diffs;
};

export {utils};