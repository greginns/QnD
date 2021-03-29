import {utils} from '/~static/lib/client/core/utils.js';
import {db4ExpressionParser} from '/~static/lib/client/core/db4ExpressionParser.js';

/* ====================================== MVC ==================================== */
class MVC {
  // _methods are private
  // $methods are public.  $ used to not conflict with user method names
  constructor(element, options) {
    //this._element = element;
    this._section = (typeof element == 'string') ? document.querySelector(`#${element}`) : element;
    this._options = options || {};

    this._init();
  }

  // lifecycle methods - to be over-ridden in user code.  
  createModel() {
    return new Promise(function(resolve) {
      resolve();
    })
  }

  // Used by Router or called manually in MVC instance
  ready() {   
    return new Promise(function(resolve) {
      resolve();
    })
  }
    
  inView() {}
  
  outView() {
    return true;
  }

  // private instance methods
  async _init() {
    // setup proxy handler
    let proxy = Object.assign({}, proxyHandler);
    proxy._eventEl = this._section;

    // setup model base
    this.model = new Proxy({}, proxy);
    await this.createModel();

    // find all initial section elements and process
    for (let el of this._section.querySelectorAll('*')) {
      this._processElement(el);
    };
  }

  _processElement(el) {
    // for one element find all of it's mvc attributes and run approrpriate role and binding
    let pfx = MVC.prefix;
    let pfxLen = pfx.length;

    if (el.hasAttributes()) {
      // role
      if (el.hasAttribute(pfx+'-role')) {
        let attr = el.getAttribute(pfx+'-role');

        if (MVC._roles.indexOf(attr) > -1) {
          let role = '_role' + utils.camelCase(attr);

          this[role](el);
        }
      }

      // binding (all different names: mvc-value, mvc-checked, etc) so go through all attributes which is shorter than through all bindings
      // macro fields generate lots of unused attrs, each attr must guard against that.
      let attrs = el.attributes;

      for (let idx=0; idx<attrs.length; idx++) {
        let attr = attrs[idx].name;

        if (attr.substr(0,pfxLen) == pfx) {   // mvc-something
          attr = attr.substr(pfxLen+1);       // something
          if (attr.substr(0,6) == 'event-') attr = 'event';   // if event-something ---> event

          if (MVC._bindings.indexOf(attr) > -1) {
            let binding = '_bind' + utils.camelCase(attr);

            this[binding](el);
          }
          else {
            if (attr.indexOf('_') == -1) {
              console.log('No binding for ',attr, el)
            }
          }
        }
      }
    }
  }

  _setInitialValue(path) {
    // emit initial value of a model path - when elements are first processed
    this._dispatch(`${path}-FM`, this.$readModel(path));
  }

  _dispatch(path, value) {
    // emit a path value
    this._section.dispatchEvent(new CustomEvent(path, {bubbles: false, detail: value}));
  }

  _evaluate(str, msg, dflt) {
    // evaluate an expression string with 'this' as the context.  'this' being the MVC class instance
    let res, self = this;
    let ev2 = function(expr) {
      return Function('return (' + arguments[0] + ')').bind(self, expr)();
    }

    try {
      res = ev2(str);
    }
    catch(e) {
      console.log(msg + ' ' + str);
      console.log(e);
      res = dflt;
    }

    return res;
  }

  _addExpression(expr, fn) {
    // extract 'this.model.' substrings out of an expression, then setup an event listener for each
    var reg = /this\.model\.([A-Za-z0-9\.]+)[^A-Za-z0-9\.]*/g;

    for (let match of expr.matchAll(reg)) {
      let path = match[1];

      this._section.addEventListener(`${path}-FM`, function(ev) {
        fn(this._evaluate(expr, '', true));

      }.bind(this))
    }
  }

  _processFilters(el, value) {
    // Process each filter for an element.  Filters are comma separated
    // Filters are to display model data, and are run when data is output (value, text, html bindings)
    let pfx = MVC.prefix;
    let attr = pfx + '-filter';

    if (el.hasAttribute(attr)) {
      let filters = el.getAttribute(attr).toLowerCase().split(',');

      for (let idx=0; idx<filters.length; idx++) {
        let filter = filters[idx];

        if (MVC._filters.indexOf(filter) > -1) {
          filter = '_filter' + utils.camelCase(filter);

          value = this[filter](el, value);
        }
      }
    }

    return value;
  }

  _processEdits(el, value) {
    // Process each edit for an element.  Edits are comma separated
    // Edits are done on input and are run when data is input (value binding)
    let pfx = MVC.prefix;
    let attr = pfx + '-edit';

    if (el.hasAttribute(attr)) {
      let edits = el.getAttribute(attr).toLowerCase().split(',');

      for (let idx=0; idx<edits.length; idx++) {
        let edit = edits[idx];

        if (MVC._edits.indexOf(edit) > -1) {
          edit = '_edit' + utils.camelCase(edit);

          value = this[edit](el, value);
        }
      }
    }

    return value;
  }

  // public instance methods
  $updateModel(path, value) {
    // Update model value with given path
    // path = dotted path
    let kp = path.split('.');
    let prop = kp.pop();
    let mdl = this.model;

    for (let k of kp) {
      mdl = mdl[k];
    }

    if (!mdl) {
      console.error(path, 'has not been defined in the model');
    }
    else {
      mdl[prop] = value;
    }    
  }

  $readModel(path) {
    // Return back model value of given path
    if (!path) return null;

    let kp = path.split('.');
    let prop = kp.pop();
    let mdl = this.model;

    for (let k of kp) {
      if (mdl && k in mdl) {		// in case of invalid path or path doesn't exist yet
        mdl = mdl[k];
      }
      else {
        return null;
      }
    }

    return (!prop) ? mdl : mdl[prop];  // empty value/text fields on select.  Used to be just mdl[prop]
  }
  
  $addCalculated(name, expr) {
    var reg = /this\.model\.([A-Za-z0-9\.]+)[^A-Za-z0-9\.]*/g;

    for (let match of expr.matchAll(reg)) {
      let path = match[1];

      this._section.addEventListener(`${path}-FM`, function(ev) {
        this.$updateModel(name, this._evaluate(expr, '', ''));

      }.bind(this))
    }

    this.$updateModel(name, this._evaluate(expr, '', ''));
  }

  $addWatched(path, fn) {
    // need a function in order to encapsulate the oldValue value
    (function() {
      let oldValue = this.$readModel(path);   // initialize oldValue

      this._section.addEventListener(`${path}-FM`, function(ev) {
        let oo = oldValue;      
        oldValue = ev.detail;   // update oldValue, capture old value before running fn() to avoid recursion

        if (ev.detail !== oo) fn(ev.detail, oo);
      }.bind(this))
    }.bind(this))();
  }
  
  $focus(path) {
    // focus on field with mvc-value=path
    let pfx = MVC.prefix;

    this._section.querySelector(`[${pfx}-value="${path}"]`).focus();
  }

  $setValue(path, val) {
    // focus on field with mvc-value=path
    let pfx = MVC.prefix;

    setTimeout(function() {
      this._section.querySelector(`[${pfx}-value="${path}"]`).value = val;
    }.bind(this),1)    
  }
  
  $display(model) {
    // Proxy data looks weird.
    // This un-weirds it.
    console.log(JSON.parse(JSON.stringify(model)))
  }

  $copy(model) {
    return JSON.parse(JSON.stringify(model));
  }

  static $setPrefix(prefix) {
    MVC.prefix = prefix || 'mvc';
  }

  // private class methods
  static _addBinding(binding, method) {
    // Add binding, which creates a new class method named _bindMethod
    binding = binding.toLowerCase();
    MVC._bindings.push(binding);

    binding = '_bind' + utils.camelCase(binding);
    this.prototype[binding] = method;
  }

  static _addFilter(filter, method) {
    // Add filter, which creates a new class method named _filterMethod
    filter = filter.toLowerCase();
    MVC._filters.push(filter);

    filter = '_filter' + utils.camelCase(filter);
    this.prototype[filter] = method;
  }

  static _addEdit(edit, method) {
    // Add edit, which creates a new class method named _editMethod
    edit = edit.toLowerCase();
    MVC._edits.push(edit);

    edit = '_edit' + utils.camelCase(edit);
    this.prototype[edit] = method;
  }

  static _addRole(role, method) {
    // Add role, which creates a new class method named _roleMethod
    role = role.toLowerCase();
    MVC._roles.push(role);

    role = '_role' + utils.camelCase(role);
    this.prototype[role] = method;
  }

  static _addInterface(intfc, method) {
    // Add interface, which creates a new class method named _interfaceMethod
    intfc = intfc.toLowerCase();
    let colon = intfc.indexOf(':');
    
    if (colon > -1) intfc = intfc.substring(0, colon) + intfc.substring(colon+1, intfc.length);
    
    MVC._interfaces.push(intfc);

    intfc = '_interface' + utils.camelCase(intfc);
    this.prototype[intfc] = method;
  }

  static _addMethod(name, method) {
    // Add method to class
    this.prototype[name] = method;
  }

  async _eqFuncEval(expr) {
    let ex = new db4ExpressionParser();
    let res = await ex.evaluate(expr, this, {});
  }
}

MVC._bindings = [];
MVC._filters = [];
MVC._edits = [];
MVC._roles = [];
MVC._interfaces = [];
MVC.prefix = 'mvc';

/* ===================================== PROXY HANDLER ================================= */
var proxyHandler = {
  set(target, key, value, rcv) {
    // to bypass _triggerEvent, set key to '*key';
    // keep in mind if setting an object (or array): this.model.contact = {*key1, *key2, etc} - one event on setting contact, 
    // or this.model['*contact'] = {*key1, *key2, etc} - no events
    let bypassEvent = (key.substr(0) == '*');

    key = (bypassEvent) ? key.substr(1) : key;
    //console.log('SET',target, 'KEY', key, 'VALUE', value, 'RCVR', rcv)
    if (utils.object.isObject(value)) {
      if (Object.keys(value).length == 0) {
        if (! (key in target)) target[key] = this._makeProxyFor({}, key);

        for (let k in target[key]) {
          target[key][k] = '';
        }
      }
      else {
        target[key] = this._makeProxyFor({}, key);

        for (let k in value) {
          target[key][k] = value[k];
        }
      }
    }

    else if (Array.isArray(value)) {
      //if (!(key in target))
      target[key] = this._makeProxyFor([], key);

      for (let v of value) {
        target[key].push(v);
      }

      if (value.length == 0) {
        // force triggers to recognize zero length array
        // needed for when an array has entries, then gets set to []
        target[key].push('');
        target[key].pop();
      }
    }

    else { //if (target[key] != value) {
      target[key] = value;
    }

    if (!bypassEvent) this._triggerEvent(this._makeEventTopic(key), value);
    return true;
  },

  get(target, key) {
    //console.log('get',target, key)
    let self = this;

    if (key == 'toJSON') {
      return function() {
        return JSON.parse(JSON.stringify(target));
      }
    }

    if (key == 'shift') {
      return function() {
        target.shift();

        target.forEach(function(row, idx) {
          self._traverse(row, self._makeEventTopic('') + '.' + idx, self._eventEl)
        })

        self._triggerEvent(self._makeEventTopic('length'), target.length);
      }
    }

    if (key == 'unshift') {
      return function(data) {
        target.unshift(data);

        self._triggerEvent(self._makeEventTopic('length'), target.length);

        target.forEach(function(row, idx) {
          self._traverse(row, self._makeEventTopic('') + '.' + idx, self._eventEl)
        })
      }
    }

    if (key == 'splice') {
      return function(start, delCount, ...data) {
        target.splice(start, delCount, ...data);

        self._triggerEvent(self._makeEventTopic('length'), target.length);

        target.forEach(function(row, idx) {
          if (idx >= start) {
            self._traverse(row, self._makeEventTopic('') + '.' + idx, self._eventEl)
          }
        })
      }
    }

    return key in target ? target[key] : null;
  },

  deleteProperty(target, key) {
    if (key in target) {
      delete target[key];
    }

    return true;
  },

  has(target, key) {
    return key in target;
  },

  _proxyFor: '',
  _eventEl: '',

  _makeProxyFor: function(root, key) {
    // root is {} or []
    let hndlr = Object.assign({}, this);

    hndlr._proxyFor = (this._proxyFor) ? this._proxyFor + '.' + key : key;
    hndlr._eventEl = this._eventEl;

    return new Proxy(root, hndlr);
  },

  _makeEventTopic: function(key) {
    let topic = '';

    if (this._proxyFor) topic += `${this._proxyFor}`;
    if (key) topic += ((topic) ? `.${key}` : `${key}`);

    return topic;
  },

  _triggerEvent: function(topic, value) {
    // trigger change event
    try {
      this._eventEl.dispatchEvent(new CustomEvent(`${topic}-FM`, {bubbles: false, detail: value}));
    }
    catch(err) {
      console.error(this, topic, value);
    }    
  },

  _traverse: function(x, base) {
    if (Array.isArray(x)) {
      x.forEach(function(y, idx) {
        this._traverse(y, base + '.' + idx)
      }, this)
    }
    else if (utils.object.isObject(x)) {
      for (var k in x) {
        if (x.hasOwnProperty(k)) {
          this._traverse(x[k], base + '.' + k)
        }
      }
    }
    else {
      this._triggerEvent(`${base}`, x);
    }
  }
};

/* =================================== BINDINGS, FILTERS, ROLES, ETC ================================ */
/* === FILTERS ===  Appearance */
MVC._addFilter('upper', function(el, value) {
  return (value) ? String(value).toUpperCase() : '';
});

MVC._addFilter('lower', function(el, value) {
  return (value) ? String(value).toLowerCase() : '';
});

MVC._addFilter('integer', function(el, value) {
  value = parseInt(value, 10) || 0;
  
  return value;    
});

MVC._addFilter('floatpos', function(el, value) {
  value = parseFloat(value) || 0;
  
  if (value < 0) value = 0;
  
  return value;    
});

MVC._addFilter('float', function(el, value) {
  return parseFloat(value) || 0;
});

MVC._addFilter('dollar', function(el, value) {
  value = parseFloat(value) || 0;
  var [dollars, cents, ...extras] = String(value).split('.');

  if (extras.length > 0 || (isNaN(value) && value != '-')) value = 0;
  
  return value.toFixed(2);
})  

MVC._addFilter('date', function(el, value) {
  // value is a JS date.toJSON() format
  let fmt = MVC.dateFormat || this._options.dateFormat || 'YYYY-MM-DD';
  
  return utils.datetime.JSONToStringDate(value, fmt);
});

MVC._addFilter('time', function(el, value) {
  // value is a JS date.toJSON() format
  let fmt = MVC.timeFormat || this._options.timeFormat || 'h:mm A';

  return utils.datetime.JSONToStringTime(value, fmt);
});

MVC._addFilter('datetime', function(el, value) {
  // value is a JS date.toJSON() format
  let fmt = MVC.dateFormat + ' ' + MVC.timeFormat || this._options.dateFormat + ' ' + this._options.timeFormat || 'YYYY-MM-DD h:mm A';
  
  return utils.datetime.JSONToStringDate(value, fmt);
});

MVC._addFilter('stepper', function(el, value) {
  var max = parseFloat(el.getAttribute('max')) || null;
  var min = parseFloat(el.getAttribute('min')) || null;

  value = parseFloat(value) || 0;

  if (max && value > max) value = max;
  if (min && value < min) value = min;

  return value;
});

MVC._addFilter('phone', function(el, value) {
  let ctrycode = el.getAttribute('ctrycode') || 'US';
  let ayt = new libphonenumber.AsYouType(ctrycode);
  let fmtOut;

  if (!value) return '';

  ayt.input(value);  

  fmtOut = ayt.formattedOutput;
  ayt = undefined;

  return fmtOut;
});

/* === EDITS === Value testing */
MVC._addEdit('upper', function(el, value) {
  return (value) ? String(value).toUpperCase() : '';
});

MVC._addEdit('lower', function(el, value) {
  return (value) ? String(value).toLowerCase() : '';
});

MVC._addEdit('integer', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-value');
  let oldVal = this.$readModel(path);

  if (isNaN(value) || value.indexOf('.') > -1) {
    // invalid value
    let posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })
  }

  return value;
});

MVC._addEdit('floatpos', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-value');
  let oldVal = this.$readModel(path);
  let neg = value.indexOf('-');

  if (neg > -1) {
    value = value.substring(0,neg) + value.substring(neg+1);
    setTimeout(function() {
      el.setSelectionRange(neg, neg);  
    })
  }

  if (isNaN(value)) {
    // invalid value
    let posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })
  }

  return value;
});

MVC._addEdit('float', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-value');
  let oldVal = this.$readModel(path);

  if (isNaN(value)) {
    // invalid value
    let posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })      
  }

  return value;
});

MVC._addEdit('dollar', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-value');
  let oldVal = this.$readModel(path);
  let [dollars, cents, ...extras] = value.split('.');

  if (extras.length > 0 || (isNaN(value) && value != '-') || cents.length >2) {
    // invalid value
    let posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })
  }

  return value;
});

MVC._addEdit('date', function(el, value) {
  // value is string date
  // if an invalid value, reset to saved value
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-value');
  let oldVal = this.$readModel(path);
  let fmt = this._options.dateFormat || 'YYYY-MM-DD';

  return utils.datetime.stringDateToJSON(value, oldVal, fmt);
});

MVC._addEdit('time', function(el, value) {
  // value is a string time
  // if an invalid value, reset to saved value
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-value');
  let oldVal = this.$readModel(path);
  let fmt = this._options.dateFormat || 'h:mm A';

  return utils.datetime.stringTimeToJSON(value, oldVal, fmt);
});

MVC._addEdit('stepper', function(el, value) {
  var max = parseFloat(el.getAttribute('max')) || null;
  var min = parseFloat(el.getAttribute('min')) || null;

  value = parseFloat(value) || 0;

  if (max && value > max) value = max;
  if (min && value < min) value = min;

  return value;
});

/* === ROLES ===  filter & edit */
MVC._addRole('date', function(el) {
  let pfx = MVC.prefix;

  el.setAttribute(pfx + '-filter', 'date');
  el.setAttribute(pfx + '-edit', 'date');
  el.setAttribute(pfx + '-event-type', 'blur');
});

MVC._addRole('time', function(el) {
  let pfx = MVC.prefix;

  el.setAttribute(pfx + '-filter', 'time');
  el.setAttribute(pfx + '-edit', 'time');
  el.setAttribute(pfx + '-event-type', 'blur');
});

MVC._addRole('stepper', function(el) {
  let pfx = MVC.prefix;

  el.setAttribute(pfx + '-filter', 'stepper');
  el.setAttribute(pfx + '-edit', 'stepper');
});

MVC._addRole('integer', function(el) {
  let pfx = MVC.prefix;

  el.setAttribute(pfx + '-filter', 'integer');
  el.setAttribute(pfx + '-edit', 'integer');
});

MVC._addRole('floatpos', function(el) {
  el.setAttribute(pfx + '-filter', 'floatpos');
  el.setAttribute(pfx + '-edit', 'floatpos');
});

MVC._addRole('float', function(el) {
  let pfx = MVC.prefix;

  el.setAttribute(pfx + '-filter', 'float');
  el.setAttribute(pfx + '-edit', 'float');
});

MVC._addRole('dollar', function(el) {
  let pfx = MVC.prefix;

  el.setAttribute(pfx + '-filter', 'dollar');
  el.setAttribute(pfx + '-edit', 'dollar');
});

MVC._addRole('stepperadj', function(el) {
  let pfx = MVC.prefix;
  let stepper = el.closest('div.input-group').querySelector('input');
  let step = parseFloat(stepper.getAttribute('step') || '1');
  let min = parseFloat(stepper.getAttribute('min') || '1');
  let max = parseFloat(stepper.getAttribute('max') || '999');
  let dir = el.getAttribute('dir') || '+';
  let p = String(step).split('.');
  let tens = '10000000000000000';
  let decs = (p.length < 2) ? 1 : p[1].length+1;  // any decimals?
  let path = stepper.getAttribute(pfx + '-value');
  let mult = tens.substr(0,decs);
  
  if (!stepper || !path) return;

  el.addEventListener('click', function(ev) {
    let value = parseFloat(this.$readModel(path)) || 0;

    value = (dir == '+') ? value + step : value - step;
    value = Math.round(value*mult)/mult;

    if (max && value > max) value = max;
    if (min && value < min) value = min;

    this.$updateModel(path, String(value));
  }.bind(this))
});

MVC._addRole('passwordtoggle', function(el) {
  let eye = el.querySelector('span.eye');
  let eyeslash = el.querySelector('span.eye-slash');
  let password = el.closest('div.input-group').querySelector('input');
  let strike = function() {
    if (password.type == 'password') {
      eye.style.display = 'none';
      eyeslash.style.display = 'inline';
    }
    else {
      eyeslash.style.display = 'none';
      eye.style.display = 'inline';
    }
  }

  el.addEventListener('click', function(ev) {
    password.type = (password.type == 'password') ? 'text': 'password';
    strike();
  });

  strike();
});

/* === BINDINGS === Connect model to DOM */
MVC._addBinding('value', function(el) {
  let pfx = MVC.prefix;
  let eventType = el.getAttribute(pfx + '-event-type') || 'change';
  let path = el.getAttribute(pfx + '-value');
  let tagName = el.tagName, isMultiple = el.hasAttribute('multiple');

  if (!path) return;

  // from Model
  this._section.addEventListener(`${path}-FM`, function(ev) {
    if (tagName === 'SELECT' && isMultiple) {
      for (let opt of el.options) {
        opt.selected = (ev.detail && ev.detail.indexOf(opt.value) > -1);
      }
    }
    else {
      el.value = this._processFilters(el, ev.detail);
    }
  }.bind(this));

  // to Model
  el.addEventListener(eventType, function(ev) {
    let val;

    if (tagName === 'SELECT' && isMultiple) {
      // preserve order in which options were selected
      // get all selected and compare to existing from model
      let existing = this.$readModel(path) || [];
      let opts = el.querySelectorAll('option:checked');
      let selected = Array.from(opts, function(opt) {
        return opt.value;
      })      

      val = [];

      for (let exist of existing) {
        // existing go first, in order, if still selected
        if (selected.indexOf(exist) > -1) val.push(exist);
      }

      for (let sel of selected) {
        // any new selections get added
        if (val.indexOf(sel) == -1) val.push(sel);
      }
    }
    else {
      val = el.value;
    }

    this.$updateModel(path, this._processEdits(el, val));
  }.bind(this));

  this._setInitialValue(path);
});

MVC._addBinding('checked', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-checked');
  let checkbox = el.getAttribute('type') == 'checkbox';
  
  if (!path) return;

  if (checkbox) {
    // from Model
    this._section.addEventListener(`${path}-FM`, function(ev) {
      if (el.checked != ev.detail) el.checked = ev.detail;
    });

    // to Model
    el.addEventListener('click', function(ev) {
      this.$updateModel(path, el.checked);
    }.bind(this));
  }
  else {  // radio
    // from Model
    this._section.addEventListener(`${path}-FM`, function(ev) {
      el.checked = (ev.detail == el.value);
    });

    // to Model
    el.addEventListener('click', function(ev) {
      if (el.checked) {
        this.$updateModel(path, el.value);
      }
    }.bind(this));
  }

  this._setInitialValue(path);
});

MVC._addBinding('text', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-text');

  if (!path) return;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.innerText = this._processFilters(el, ev.detail);
  }.bind(this));

  this._setInitialValue(path);
});

MVC._addBinding('html', function(el) {
  // insert html 'text'
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-html');

  if (!path) return;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.innerHTML = this._processFilters(el, ev.detail);
  }.bind(this));

  this._setInitialValue(path);
});

MVC._addBinding('dhtml', function(el) {
  // insert dynamic html, ie element
  // hard to chain filters if an element is being returned from first filter.
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-dhtml');
  let span = document.createElement('span');

  if (!path) return;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    if (el.firstChild) el.firstChild.remove();

    el.appendChild(this._processFilters(el, ev.detail) || span);
  }.bind(this));

  this._setInitialValue(path);
});

MVC._addBinding('class', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-class');

  if (!path) return;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    let classes = ev.detail;
    let exClasses = el.getAttribute('exclass');

    // remove previous bound classes
    if (exClasses) {
      exClasses = exClasses.split(',');
      el.classList.remove(...exClasses);
    }

    // add new classes
    if (classes) {
      if (!Array.isArray(classes)) classes = [classes];

      el.classList.add(...classes);
      el.setAttribute('exclass', classes.join(','));
    }
  });

  this._setInitialValue(path);
});

MVC._addBinding('attr', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-attr');
  let obj = this._evaluate(expr, 'Invalid attr Expression', {});
  let keys = Object.keys(obj);

  for (let key of keys) {
    let path = obj[key];

    this._section.addEventListener(`${path}-FM`, function(ev) {
      el.setAttribute(key, ev.detail);
    })

    this._setInitialValue(path);
  }
});

MVC._addBinding('href', function(el) {
  // works by replacing fragments with data
  // <a mvc-href='mailto:${contact.emailadd}?subject=Reservation ${reshdr.rsvno} on ${reshdr.arrdate}'>
  let pfx = MVC.prefix;
  let href = el.getAttribute(pfx + '-href');
  let reText = /\$\{(.*?)\}/gi;
  let fragments = href.match(reText);	// build list of what to watch

  // setup watchers
  for (let path of fragments) {
    // for each fragment we have to replace all fragments
    path = path.substring(2, path.length-1);  // extract the goods

    this._section.addEventListener(`${path}-FM`, function(ev) {
      let hrefx = el.getAttribute(pfx + '-href');

      hrefx = hrefx.replace(reText, function(match) {
        return this.$readModel(match.substring(2, match.length-1));
      }.bind(this));

      el.setAttribute('href', hrefx);
    }.bind(this));

    this._setInitialValue(path);
  }
});

MVC._addBinding('option', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-option');
  let exprObj = this._evaluate(expr, 'Invalid Option Expression', {});
  let valPath = exprObj.value || '';
  let textPath = exprObj.text || '';

  // future changes
  if (valPath) {
    this._section.addEventListener(`${valPath}-FM`, function(ev) {
      el.value = ev.detail;
    });

    this._setInitialValue(valPath);
  }

  if (textPath) {
    this._section.addEventListener(`${textPath}-FM`, function(ev) {
      el.text = ev.detail;
    });

    this._setInitialValue(textPath);
  }

  // set select value - repeats a lot, but where else can we set/reset as options change?
  let parent = el.parentNode;
  if (parent && parent.tagName != 'SELECT') parent = parent.parentNode;   // could be an optgroup

  if (parent && parent.tagName == 'SELECT') {
    let path = parent.getAttribute(pfx + '-value');
    let val = this.$readModel(path);

    parent.value = val;
  }
});

MVC._addBinding('optgroup', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-optgroup');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.setAttribute('label', ev.detail);
  });

  this._setInitialValue(path);
});

MVC._addBinding('each', function(el) {
  /*
  Basically: extract element contents
  Build a parent element to place raw HTML
  Extract first node and append to real parent
  */

  let pfx = MVC.prefix;
  let tagName = el.tagName;
  let path = el.getAttribute(pfx + '-each');
  let maxArrayLength = 0;

  if (!path) return;

  // build regexp from index variable.
  let indexVar = el.getAttribute(pfx + '-index') || '$index';
  let expr = utils.escapeRegExp(indexVar);
  let reText = new RegExp(expr, 'g');  // /(\$index)/g

  // get contents of target element, then empty it
  let contents = el.innerHTML;
  el.innerHTML = '';

  // make a temporary parent container to house template.  Table stuff needs table stuff, li needs ul, etc.
  // this is done to convert html text to a node in the dupe container, then the node is moved to the real container
  // dupe is the cloned version of the original container, ie a <tbody mvc-each='cust.array'>
  // parent.appendChild(dupe) appends the dupe to a fake parent container.  You can't create a <tr> outside of a table.
  let container, parent, grandparent;
  let dupe = el.cloneNode(true);

  switch (tagName) {
    case 'TD':
    case 'TH':
    parent = document.createElement('tr');
    grandparent = document.createElement('tbody');
    container = document.createElement('table');

    parent.appendChild(dupe);
    grandparent.appendChild(parent);
    container.appendChild(grandparent);

    break;

    case 'TR':
    parent = document.createElement('tbody');
    container = document.createElement('table');

    parent.appendChild(dupe);
    container.appendChild(parent);

    break;

    case 'THEAD':
    case 'TBODY':
    case 'TFOOT':
    parent = document.createElement('table');
    parent.appendChild(dupe);

    break;

    case 'OPTION':
    case 'OPTGROUP':
    parent = document.createElement('select');
    parent.appendChild(dupe);

    break;

    case 'LI':
    parent = document.createElement('ul');
    parent.appendChild(dupe);

    break;

    default:
    parent = document.createElement('div');
    parent.appendChild(dupe);

    break;
  }

  this._section.addEventListener(path + '.length-FM', function(ev) {
    let arrayLength = ev.detail;

    if (arrayLength > maxArrayLength) {
      // new array item(s)
      for (let idx=maxArrayLength, sIdx, child, pathlet, val; idx<arrayLength; idx++) {
        sIdx = String(idx);

        // add raw html to duplicate element so that it gets rendered properly
        dupe.innerHTML = contents.replace(reText, sIdx);

        // append the first child of the dupe to the original container, returning that node and removing from dupe.
        child = el.appendChild(dupe.firstElementChild);

        // add tracker to locate it later for possible removal.
        child.setAttribute(pfx + '-_tracker', sIdx)

        // process the new node
        this._processElement(child);

        // process the node's children
        for (let elx of child.querySelectorAll('*')) {
          this._processElement(elx);
        };

        // array length gets sent first from proxy so this all happens before the new array item exists
        // so we need to get that array item and fire off a one-time event with it.
        // frow then on the proxy event will suffice
        pathlet = `${path + '.' + sIdx}`;
        val = this.$readModel(pathlet);

        this._dispatch(pathlet + '-FM', val);
      }
    }

    if (arrayLength < maxArrayLength) {
      // shortened array
      for (var dIdx=arrayLength; dIdx<maxArrayLength; dIdx++) {
        for (var del of el.childNodes) {
          if (del.getAttribute(pfx + '-_tracker') == dIdx) {
            //console.log('delete', del);
            del.remove();
            break;
          }
        }
      }
    }

    maxArrayLength = arrayLength;
  }.bind(this));

  this._dispatch(`${path}.length-FM`, this.$readModel(path+'.length') || 0);
});

// 3 style of setting event handlers:
// mvc-on = '{event: func, ...}'
// mvc-event-xxxxx = 'func'
// mvc-click = 'func'
var eventBinder = function(event, fn, el) {
  let colon = fn.indexOf(':'), desc, eqFunc, isEqFunc = false;

  //if (colon > -1) {
  //  fn = fn.substring(0, colon) + fn.substring(colon+1, fn.length);
  //  fn = '_interface' + utils.camelCase(fn);
  //  desc = 'interface';
  //}
  //else {
    desc = 'method';
  //}

  if (fn.substr(0,1) == '=') {
    let ob = fn.indexOf('(');

    eqFunc = '_eq' + fn.substr(1, ob-1).toLowerCase();
    isEqFunc = true;
  }

  if (isEqFunc) {
    el.addEventListener(event, this._eqFuncEval.bind(this, fn)); 
  }
  else {
    if (!(fn in this)) {
      console.error('No', desc, fn, this._section)
    }
    else {
      el.addEventListener(event, this[fn].bind(this));
    }    
  }
}

MVC._addBinding('on', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-on');
  let obj = this._evaluate(expr, 'Invalid on Expression', {});
  let events = Object.keys(obj);
  let event, fn;

  for (event of events) {
    fn = obj[event];
    eventBinder.call(this, event, fn, el);
  }
});

MVC._addBinding('click', function(el) {
  let pfx = MVC.prefix;
  let fn = el.getAttribute(pfx + '-click');

  if (!fn) return;

  eventBinder.call(this, 'click', fn, el);
});

MVC._addBinding('event', function(el) {
  // look for all mvc-event-* attrs
  let pfx = MVC.prefix;
  let pfxLen = pfx.length;
  let attrs = el.attributes;

  for (let idx=0; idx<attrs.length; idx++) {
    let attr = attrs[idx].name;

    if (attr.substr(0, pfxLen+6) == pfx + '-event') {
      let event = attr.substr(pfxLen+7);
      let fn = el.getAttribute(attr);

      if (fn) {
        eventBinder.call(this, event, fn, el);
      }
    }
  }          
});

MVC._addBinding('enabled', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-enabled');

  if (!path) return;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.disabled = !!!ev.detail;
  });

  this._setInitialValue(path);
});

MVC._addBinding('disabled', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-disabled');

  if (!path) return;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.disabled = !!ev.detail;
  });

  this._setInitialValue(path);
});

MVC._addBinding('show', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-show');

  if (!path) return;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.style.display = (!!ev.detail) ? '' : 'none';
  });

  this._setInitialValue(path);
});

MVC._addBinding('hide', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-hide');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.style.display = (!!ev.detail) ? 'none' : '';
  });

  this._setInitialValue(path);
});

MVC._addBinding('if', function(el) {
  let pfx = MVC.prefix;
  let path = el.getAttribute(pfx + '-if');
  let sib = el.nextElementSibling;

  if (!path) return;

  if (sib && !sib.hasAttribute(pfx + '-else')) sib = null;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    let show = !!ev.detail;

    el.style.display = (show) ? '' : 'none';

    if (sib) sib.style.display = (show) ? 'none' : '';
  });

  this._setInitialValue(path);
});

// JS expr based
// ie, "this.model.switch && this.something == 'fred'"
// gets calced every time this.model.switch is changed
// can't do much about this.something
// set initial value locally as _setInitialValue would only be based on one path
MVC._addBinding('xenabled', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-xenabled');
  let tf = this._evaluate(expr, 'Invalid xenabled Expression', true);

  this._addExpression(expr, function(val) {
    el.disabled = !!!val;
  });

  el.disabled = !!!tf;
});

MVC._addBinding('xdisabled', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-xdisabled');
  let tf = this._evaluate(expr, 'Invalid xdisabled Expression', true);

  this._addExpression(expr, function(val) {
    el.disabled = !!val;
  });

  el.disabled = !!tf;
});

MVC._addBinding('xshow', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-xshow');
  let tf = this._evaluate(expr, 'Invalid xshow Expression', true);

  this._addExpression(expr, function(val) {
    el.style.display = (!!val) ? '' : 'none';
  });

  el.style.display = (!!tf) ? '' : 'none';;
});

MVC._addBinding('xhide', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-xhide');
  let tf = this._evaluate(expr, 'Invalid xhide Expression', true);

  this._addExpression(expr, function(val) {
    el.style.display = (!!val) ? 'none' : '';
  });

  el.style.display = (!!tf) ? 'none' : '';
});

MVC._addBinding('xif', function(el) {
  let pfx = MVC.prefix;
  let expr = el.getAttribute(pfx + '-xif');
  let tf = this._evaluate(expr, 'Invalid xif Expression', true);
  let sib = el.nextElementSibling;

  if (sib && !sib.hasAttribute(pfx + '-else')) sib = null;

  this._addExpression(expr, function(val) {
    el.style.display = (val) ? '' : 'none';
  });

  el.style.display = (tf) ? '' : 'none';
});

/* === INTERFACES === */

/* ===================  MOBISCROLL ================== */
/*
MVC._addBinding('mobi-calendar', function(el) {
  let path = el.getAttribute('mvc-value');

  // from Model
  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.value = this._processFilters(el, ev.detail);
  }.bind(this));

  // to Model
  mobiscroll.calendar(el, {
    responsive: {
      xsmall: {
        controls: ['date'],
        display: 'bubble'
      },
      small: {
        controls: ['calendar'],
        display: 'bubble'
      },
      medium: {
        controls: ['calendar'],
        months: 2,
        yearChange: true,
        touchUi: false
      }
    },

    returnFormat: 'jsdate',
    showOnFocus: true,
    onSet: function(ev, inst) {
      this.$updateModel(path, this._processEdits(el, inst.getVal().toJSON()));
    }.bind(this)
  });

  this._setInitialValue(path);
});

MVC._addBinding('mobi-form', function(el) {
  mobiscroll.form(el, {
    inputStyle: 'underline',
    labelStyle: 'stacked'
  })
});

MVC._addBinding('mobi-page', function(el) {
 mobiscroll.page(el, {
  })
});
*/


export {MVC}