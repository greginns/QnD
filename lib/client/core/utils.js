const utils = {object: {}, datetime: {}};

utils.datetime.makeMomentDate = function(dt) {
  return (dt) ? dayjs(dt) : dayjs();
}

utils.datetime.JSONToStringDate = function(value, format) {
  let dt, dtx='';
  let haveMoment = window.moment || null;

  if (value) {
    if (haveMoment) {
      dt = window.dayjs(value);
      dtx = dt.format(format);
    }
    else {
      dt = new Date(value);
      dtx = dt.toLocaleDateString();
    }
  }

  return dtx;
}

utils.datetime.JSONToStringTime = function(value, format) {
  let tm, tmx='';
  let haveMoment = window.moment || null;

  if (value) {
    if (haveMoment) {
      tm = window.dayjs(value);
      tmx = tm.format(format);
    }
    else {
      tm = new Date(value);
      tmx = tm.toLocaleTimeString();
    }
  }

  return tmx;
}

utils.datetime.stringDateToJSON = function(value, oldVal, format) {
  let dt, dtx='';
  let haveMoment = window.moment || null;
  
  if (value) {
    if (haveMoment) {
      dt = window.dayjs(value, format);
      dtx = (dt.isValid()) ? dt.toJSON() : oldVal;
    }
    else {
      dt = new Date(value);
      dtx = (isNaN(dt.getTime())) ? oldVal : dt.toJSON();
    }
  }
  
  return dtx;
}

utils.datetime.stringTimeToJSON = function(value, oldVal, format) {
  let tm, tmx='';
  let haveMoment = window.moment || null;

  if (value) {
    if (haveMoment) {
      tm = window.dayjs(value, format);
      tmx = (tm.isValid()) ? tm.toJSON() : oldVal;
    }
    else {
      // use localeTimeString HH:MM:SS AP
      let [p1, ap] = value.split(' ')  ;
      let [h ,m, s] = p1.split(':');

      if (ap && ap.toUpperCase().substr(0) == 'P') h += 12;

      tm = new Date();
      tm.setHours(h);
      tm.setMinutes(m);
      tm.setSeconds(s);

      tmx = (isNaN(tm.getTime())) ? oldVal : tm.toJSON();
    }
  }

  return tmx;  
}

utils.findYPosition = function(el) {
  let curtop = 0;

  if (el.offsetParent) {
    do {
      curtop += el.offsetTop;
    } while (el = el.offsetParent);
  }

  return curtop;
}

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