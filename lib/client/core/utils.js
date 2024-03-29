import {Datetime, datetimer} from '/~static/lib/client/core/datetime.js';

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

// datetime
utils.datetime.getCurrentDatetime = function() {
  let dt = new Date();
  let dtx = dt.toJSON().split('T');
  let tm = dt.toTimeString().substring(0,8);

  return dtx[0]+'T'+tm+'.000';
}

utils.datetime.make = function(val, fmt, lang) {
  return new Datetime(val, fmt, lang);
}

utils.datetime.pgDateToDatetime = function(dt) {
  // PG Date to datetime
  return (dt) ? new Datetime(dt, 'YYYY-MM-DD') : '';
}

utils.datetime.pgTimeToDatetime = function(tm) {
  // PG Time to datetime
  return (tm) ? new Datetime(tm, 'HH:mm:ss') : '';
}

utils.datetime.pgDateTimeToDatetime = function(tm) {
  // PG DateTime to datetime
  return (tm) ? new Datetime(tm, 'YYYY-MM-DDTHH:mm:ss.SSS') : '';
}

utils.datetime.datetimeToPGDate = function(dt) {
  // datetime to PG date
  return (dt) ? dt.format('YYYY-MM-DD') : '';
}

utils.datetime.datetimeToPGTime = function(tm) {
  // datetime to PG time
  return (tm) ? tm.format('HH:mm:ss') : '';
}

utils.datetime.datetimeToPGDateTime = function(tm) {
  // datetime to PG time
  return (tm) ? tm.format('YYYY-MM-DD HH:mm:ss') : '';
}

utils.datetime.datetimePGDateFormatted = function(dt, fmt) {
  // PG date to any format
  return (dt) ? utils.datetime.pgDateToDatetime(dt).format(fmt) : '';
}

utils.datetime.datetimePGTimeFormatted = function(tm, fmt) {
  // PG time to any format
  return (tm) ? utils.datetime.pgTimeToDatetime(tm).format(fmt) : '';
}

utils.datetime.datetimePGDateTimeFormatted = function(tm, fmt) {
  // PG datetime to any format
  return (tm) ? utils.datetime.pgDateTimeToDatetime(tm).format(fmt) : '';
}

utils.datetime.formattedDateToPGDate = function(value, oldVal, fmt) {
  // any format to PG date
  if (!value) return '';

  let ret = new Datetime(value, fmt);

  if (ret.isInvalid) return oldVal;

  return utils.datetime.datetimeToPGDate(ret);
}

utils.datetime.formattedTimeToPGTime = function(value, oldVal, fmt) {
  // any format to PG time
  if (!value) return '';

  let ret = new Datetime(value, fmt);

  if (ret.isInvalid) return oldVal;
  
  return utils.datetime.datetimeToPGTime(ret);
}

utils.datetime.formattedTimeToPGDateTime = function(value, oldVal, fmt) {
  // any format to PG time
  if (!value) return '';

  let ret = new Datetime(value, fmt);

  if (ret.isInvalid) return oldVal;
  
  return utils.datetime.datetimeToPGDateTime(ret);
};

utils.datetime.dateParse = function(val, fmt) {
  /*
    letter [ +/- days]
    T - Today
    W - Tomorrow
    M - First of the month
    H - End of the month
    Y - First of the year
    R - End of the year
  */

  val = val.toUpperCase();

  let c1 = val.substr(0,1);
  let c2 = val.substr(1,1);
  let c3 = val.substr(2);
  let today = datetimer();
  let yf = fmt.substr(0,1) == 'Y';  // year first?

  if (isNaN(c1)) {
    switch (c1) {
      case 'T':
        break;

      case 'W':
        today.add(1, 'day');
        break;

      case 'M':
        today.date(1);
        break;

      case 'H':
        today.date(today.getDaysInMonth());
        break;

      case 'Y':
        today.month(1).date(1);
        break;

      case 'R':
        today.month(12).date(31);
        break;
    }

    if (c2 && (c2 == '+' || c2 == '-') && !isNaN(c3)) {
      if (c2 == '+') {
        today.add(c3, 'days');
      }
      else {
        today.subtract(c3, 'days');
      }
    }

    val = today.format(fmt);
  }
  else if (!isNaN(val)) {
    /*
      All numbers
      1 - D
      2 - MD
      3 - MDD
      4 - MMDD
      5 - YYMDD or MDDYY
      6 - YYMMDD or MMDDYY
    */

    switch (val.length) {
      case 1:
        today.date(val);
        break;

      case 2:
      case 3:
        today.month(val.substr(0,1)).date(val.substr(1));
        break;

      case 4:
        today.month(val.substr(0,2)).date(val.substr(2));
        break;

      case 5:
        if (yf) {
          today.year(val.substr(0,2)).month(val.substr(2,1)).date(val.substr(3));
        }
        else {
          today.month(val.substr(0,1)).date(val.substr(1,2)).year(val.substr(3));
        }
        break;

      case 6:
        if (yf) {
          today.year(val.substr(0,2)).month(val.substr(2,2)).date(val.substr(4));
        }
        else {
          today.month(val.substr(0,2)).date(val.substr(2,2)).year(val.substr(4));
        }

        break;
    }
    
    val = today.format(fmt);
  }

  return val;
}

// modals
/*  Don't Seem to work anymore.  Use widgets/modals
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
*/
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
      return;
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
    <button type="button" class="btn btn-primary" id="liveToastBtn">Show live toast</button>

    <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <img src="..." class="rounded me-2" alt="...">
        <strong class="me-auto">Bootstrap</strong>
        <small>11 mins ago</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        Hello, world! This is a toast message.
      </div>
    </div>

    var toastTrigger = document.getElementById('liveToastBtn')
    var toastLiveExample = document.getElementById('liveToast')

    if (toastTrigger) {
      toastTrigger.addEventListener('click', function () {
      var toast = new bootstrap.Toast(toastLiveExample)

      toast.show()
    })
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
  toast.classList.add('toast', 'mr-2', 'show');
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  //toast.setAttribute('data-bs-delay', delay);
  toast.style['min-width'] = '200px';
  
  toastHeader.classList.add('toast-header');
  toastHeader.style['background-color'] = 'rgba(0,0,0,.03)';

  toastBody.classList.add('toast-body');

  strong.classList.add('me-auto');

  btn.classList.add('btn-close');
  btn.setAttribute('data-bs-dismiss', 'toast');
  btn.setAttribute('aria-label', 'Close');

  span.setAttribute('aria-hidden', 'true');

  // build toast element
  strong.innerHTML = hdr;
  toastHeader.append(strong, btn);
  toastBody.innerHTML = body;

  toast.append(toastHeader, toastBody);

  toaster.prepend(toast);

  // show, hide
  let inst = new bootstrap.Toast(toast);

  setTimeout(function() {
    inst.dispose();
  }, delay);
};

export {utils};