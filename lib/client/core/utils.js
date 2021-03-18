const utils = {object: {}, datetime: {}, modals: {}};
// requires element ids overlay and toaster

// object
utils.object.objectType = function(a) {
  if (utils.object.isObject(a)) return 'object';
  if (utils.object.isFunction(a)) return 'function';
  if (utils.object.isArray(a)) return 'array';
  if (utils.object.isString(a)) return 'string';
  if (utils.object.isNumber(a)) return 'number';

  return 'string';
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
  return (a) && (Array.isArray(a));
};

utils.object.isString = function(a) {
  if (!a) return false;
  return (typeof a === 'string' || a instanceof String);
}

utils.object.isNumber = function(a) {
  if (!a) return false;
  return (!isNaN(a));
}

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

// datetime
utils.datetime.makeDayjsDate = function(dt) {
  return (dt) ? dayjs(dt) : dayjs();
}

utils.datetime.JSONToStringDate = function(value, format) {
  let dt, dtx='';
  let haveDayjs = window.dayjs || null;

  if (value) {
    if (haveDayjs) {
      dt = window.dayjs(value);
      dtx = dt.format(format);
    }
    else {
      dt = new Date(value);
      dtx = dt.toLocaleDateString();
    }
  }

  return dtx;
};

utils.datetime.JSONToStringTime = function(value, format) {
  let tm, tmx='';
  let haveDayjs = window.dayjs || null;

  if (value) {
    if (haveDayjs) {
      tm = window.dayjs(value);
      tmx = tm.format(format);
    }
    else {
      tm = new Date(value);
      tmx = tm.toLocaleTimeString();
    }
  }

  return tmx;
};

utils.datetime.stringDateToJSON = function(value, oldVal, format) {
  let dt, dtx='';
  let haveDayjs = window.dayjs || null;
  
  if (value) {
    if (haveDayjs) {
      dt = window.dayjs(value, format);
      dtx = (dt.isValid()) ? dt.toJSON() : oldVal;
    }
    else {
      dt = new Date(value);
      dtx = (isNaN(dt.getTime())) ? oldVal : dt.toJSON();
    }
  }
  
  return dtx;
};

utils.datetime.stringTimeToJSON = function(value, oldVal, format) {
  let tm, tmx='';
  let haveDayjs = window.dayjs || null;

  if (value) {
    if (haveDayjs) {
      tm = window.dayjs(value, format);
      tmx = (tm.isValid()) ? tm.toJSON() : oldVal;
    }
    else {
      // use localeTimeString HH:MM:SS AP
      let [p1, ap] = value.split(' ')  ;
      let [h ,m, s] = p1.split(':');

      if (ap && ap.toUpperCase().substr(0) == 'P' && h < 12) h += 12;

      tm = new Date();
      tm.setHours(h);
      tm.setMinutes(m);
      tm.setSeconds(s);

      tmx = (isNaN(tm.getTime())) ? oldVal : tm.toJSON();
    }
  }

  return tmx;  
};

// modals
utils.modals.alert = async function(msg) {
  return new Promise(function(resolve) {
    bootbox.alert(msg);
    resolve();
  });
};

utils.modals.confirm = async function(msg) {
  return new Promise(function(resolve) {
    bootbox.confirm(msg, function(res) {
      resolve(res);
    })
  })
};

utils.modals.prompt = async function(msg) {
  return new Promise(function(resolve) {
    bootbox.prompt(msg, function(res) {
      resolve(res);
    })
  })
};

utils.modals.reConfirm = async function(btn, msg) {
  var newBtn = document.createElement('button');
  
  newBtn.classList.add('btn', 'btn-dark');   // 'mb-2'
  newBtn.innerHTML = msg;

  btn.style.display = 'none';
  btn.insertAdjacentElement('afterend', newBtn);

  const restore = function() {
    newBtn.remove();
    btn.style.display = 'initial';
  }

  return new Promise(function(resolve) {
    newBtn.addEventListener('click', function() {
      restore();
      resolve(true);
    }, {once: true});

    setTimeout(function() {
      restore();
      resolve(false);
    }, 2500)
  })
};

utils.modals.overlay = function(state) {
  document.getElementById('overlay').style.display = (state) ? 'block' : 'none';
};

utils.modals.buttonSpinner = function(el, state, span) {
  if (state) {
    let span = document.createElement('span');
    span.classList.add('spinner-border', 'spinner-border-sm'); 

    el.prepend(span);
    return span;
  }
  else {
    el.removeChild(span);
  }
};

utils.modals.toast = function(hdr, body, delay) {
  /*
    <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <!--img src="..." class="rounded mr-2" alt="..."-->
        ${hdr}
        <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="toast-body">
        ${body}
      </div>
    </div>
  */

  let toaster = document.getElementById('toaster');

  // create Elements
  let toast = document.createElement('div');
  let toastHeader = document.createElement('div');
  let toastBody = document.createElement('div');
  let strong = document.createElement('strong');
  let btn = document.createElement('button');
  let span = document.createElement('span');

  // Add classes and attributes
  toast.classList.add('toast', 'mr-2');
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.setAttribute('data-delay', delay);
  toast.style['min-width'] = '200px';
  
  toastHeader.classList.add('toast-header');
  toastHeader.style['background-color'] = 'rgba(0,0,0,.03)';

  toastBody.classList.add('toast-body');

  strong.classList.add('mr-auto');

  btn.classList.add('ml-2', 'mb-2', 'close');
  btn.setAttribute('data-dismiss', 'toast');
  btn.setAttribute('aria-label', 'Close');

  span.setAttribute('aria-hidden', 'true');

  // build toast element
  span.innerHTML = '&times;';
  btn.append(span);
  strong.innerHTML = hdr;
  toastHeader.append(strong, btn);
  toastBody.innerHTML = body;

  toast.append(toastHeader, toastBody);

  toaster.prepend(toast);

  // show, hide
  new bootstrap.Toast(toast);

  toast.addEventListener('hidden.bs.toast', function () {
    toast.remove();
  }, {once: true});
};

// misc
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

export {utils};