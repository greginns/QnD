import {QnD} from '/static/lib/client/core/qnd.js';
import {utils} from '/static/lib/client/core/utils.js';

/* ====================================== MVC ==================================== */
class MVC {
  // _methods are private
  // $methods are public.  $ used to not conflict with user method names
  constructor(element) {
    this._element = element;

    this._init();
  }

  // lifecycle methods - to be over-ridden in user code.  
  createModel() {}

  // Used by Router
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
  _init() {
    // save the section element
    this._section = document.querySelector(`#${this._element}`);

    // setup proxy handler
    let proxy = Object.assign({}, proxyHandler);
    proxy._eventEl = this._section;

    // setup model base
    this.model = new Proxy({}, proxy);
    this.createModel();

    // find all initial section elements and process
    for (let el of this._section.querySelectorAll('*')) {
      this._processElement(el);
    };
  }

  _processElement(el) {
    // for one element find all of it's mvc attributes and run approrpriate role and binding
    var attrs, attr, idx, role, binding;

    if (el.hasAttributes()) {
      // role
      if (el.hasAttribute('mvc-role')) {
        attr = el.getAttribute('mvc-role');

        if (MVC._roles.indexOf(attr) > -1) {
          role = '_role' + utils.camelCase(attr);

          this[role](el);
        }
      }

      // binding (all different names: mvc-value, mvc-checked, etc) so go through all attributes which is shorter than through all bindings
      attrs = el.attributes;

      for (idx=0; idx<attrs.length; idx++) {
        attr = attrs[idx].name.substr(4);

        if (MVC._bindings.indexOf(attr) > -1) {
          binding = '_bind' + utils.camelCase(attr);

          this[binding](el);
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
    var res, self = this;
    var ev2 = function(expr) {
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
    var attr = 'mvc-filter';
    var filters = [], filter, idx;

    if (el.hasAttribute(attr)) {
      filters = el.getAttribute(attr).toLowerCase().split(',');

      for (idx=0; idx<filters.length; idx++) {
        filter = filters[idx];

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
    var attr = 'mvc-edit';
    var edits = [], edit, idx;

    if (el.hasAttribute(attr)) {
      edits = el.getAttribute(attr).toLowerCase().split(',');

      for (idx=0; idx<edits.length; idx++) {
        edit = edits[idx];

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

    for (var k of kp) {
      mdl = mdl[k];
    }

    mdl[prop] = value;
  }

  $readModel(path) {
    // Return back model value of given path
    if (!path) return null;

    let kp = path.split('.');
    let prop = kp.pop();
    let mdl = this.model;

    for (var k of kp) {
      if (mdl && k in mdl) {		// in case of invalid path or path doesn't exist yet
        mdl = mdl[k];
      }
      else {
        return null;
      }
    }

    return mdl[prop];
  }
  
  $display(model) {
    // Proxy data looks weird.
    // This un-weirds it.
    console.log(JSON.parse(JSON.stringify(model)))
  }

  $copy(model) {
    return JSON.parse(JSON.stringify(model));
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
      let oldValue = this.$readModel(path);

      this._section.addEventListener(`${path}-FM`, function(ev) {
        fn(ev.detail, oldValue);

        oldValue = ev.detail;
      }.bind(this))
    }.bind(this))();
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
}

MVC._bindings = [];
MVC._filters = [];
MVC._edits = [];
MVC._roles = [];
MVC._interfaces = [];

/* ===================================== PROXY HANDLER ================================= */
var proxyHandler = {
  set(target, key, value, rcv) {
//console.log('SET',target, 'KEY', key, 'VALUE', value, 'RCVR', rcv)
    if (utils.object.isObject(value)) {
      //if (!(key in target))
      target[key] = this._makeProxyFor({}, key);

      for (var k in value) {
        target[key][k] = value[k];
      }
    }

    else if (Array.isArray(value)) {
      //if (!(key in target))
      target[key] = this._makeProxyFor([], key);

      value.forEach(function(v, idx) {
        target[key].push(v);
      })
    }

    else { //if (target[key] != value) {
      target[key] = value;
    }

    this._triggerEvent(this._makeEventTopic(key), value);

    return true;
  },

  get(target, key) {
    //console.log('get',target, key)
    var self = this;

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
    //console.log(topic, value)
    this._eventEl.dispatchEvent(new CustomEvent(`${topic}-FM`, {bubbles: false, detail: value}));
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
  return String(value).toUpperCase();
});

MVC._addFilter('lower', function(el, value) {
  return String(value).toLowerCase();
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
  // expects a JS date.toJSON() format
  var dt, dtx;
  var haveMoment = moment || null;

  if (haveMoment) {
    dt = moment(value);
    dtx = dt.format(QnD.dateFormat);
  }
  else {
    dt = new Date(value);
    dtx = dt.toLocaleDateString();
  }

  return dtx;
});

MVC._addFilter('time', function(el, value) {
  // expects a JS date.toJSON() format
  var tm, tmx;
  var haveMoment = moment || null;

  if (haveMoment) {
    tm = moment(value);
    tmx = tm.format(QnD.timeFormat);
  }
  else {
    tm = new Date(value);
    tmx = tm.toLocaleTimeString();
  }

  return tmx;
});

MVC._addFilter('stepper', function(el, value) {
  var max = parseFloat(el.getAttribute('max')) || null;
  var min = parseFloat(el.getAttribute('min')) || null;

  value = parseFloat(value) || 0;

  if (max && value > max) value = max;
  if (min && value < min) value = min;

  return value;
});

/* === EDITS === Value testing */
MVC._addEdit('integer', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  var path = el.getAttribute('mvc-value');
  var oldVal = this.$readModel(path);
  var posn;

  if (isNaN(value) || value.indexOf('.') > -1) {
    // invalid value
    posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })
  }

  return value;
});

MVC._addEdit('floatpos', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  var path = el.getAttribute('mvc-value');
  var oldVal = this.$readModel(path);
  var posn, neg = value.indexOf('-');

  if (neg > -1) {
    value = value.substring(0,neg) + value.substring(neg+1);
    setTimeout(function() {
      el.setSelectionRange(neg, neg);  
    })
  }

  if (isNaN(value)) {
    // invalid value
    posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })
  }

  return value;
});

MVC._addEdit('float', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  var path = el.getAttribute('mvc-value');
  var oldVal = this.$readModel(path);
  var posn;

  if (isNaN(value)) {
    // invalid value
    posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })      
  }

  return value;
});

MVC._addEdit('dollar', function(el, value) {
  // if an invalid value, reset to saved value, reposition cursor
  var path = el.getAttribute('mvc-value');
  var oldVal = this.$readModel(path);
  var [dollars, cents, ...extras] = value.split('.');
  var posn;

  if (extras.length > 0 || (isNaN(value) && value != '-') || cents.length >2) {
    // invalid value
    posn = el.selectionStart;       // cursor posn
    value = oldVal;                 // set back old value
    setTimeout(function() {
      el.setSelectionRange(posn-1, posn-1);  
    })
  }

  return value;
});

MVC._addEdit('date', function(el, value) {
  // if an invalid value, reset to saved value
  var path = el.getAttribute('mvc-value');
  var oldVal = this.$readModel(path);
  var dt, dtx;
  var haveMoment = moment || null;

  if (haveMoment) {
    dt = moment(value, QnD.dateFormat);
    dtx = (dt.isValid()) ? dt.toJSON() : oldVal;
  }
  else {
    dt = new Date(value);
    dtx = (isNaN(dt.getTime())) ? oldVal : dt.toJSON();
  }

  return dtx;
});

MVC._addEdit('time', function(el, value) {
  // if an invalid value, reset to saved value
  var path = el.getAttribute('mvc-value');
  var oldVal = this.$readModel(path);
  var tm, tmx;
  var haveMoment = moment || null;

  if (haveMoment) {
    tm = moment(value, QnD.timeFormat);
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

  return tmx;
});

MVC._addEdit('stepper', function(el, value) {
  var max = parsefloat(el.getAttribute('max')) || null;
  var min = parsefloat(el.getAttribute('min')) || null;

  value = parseFloat(value) || 0;

  if (max && value > max) value = max;
  if (min && value < min) value = min;

  return value;
});

/* === ROLES ===  Multi-step */
MVC._addRole('date', function(el) {
  el.setAttribute('mvc-filter', 'date');
  el.setAttribute('mvc-edit', 'date');
  el.setAttribute('mvc-event-type', 'blur');
});

MVC._addRole('time', function(el) {
  el.setAttribute('mvc-filter', 'time');
  el.setAttribute('mvc-edit', 'time');
  el.setAttribute('mvc-event-type', 'blur');
});

MVC._addRole('stepper', function(el) {
  el.setAttribute('mvc-filter', 'stepper');
  el.setAttribute('mvc-edit', 'stepper');
});

MVC._addRole('integer', function(el) {
  el.setAttribute('mvc-filter', 'integer');
  el.setAttribute('mvc-edit', 'integer');
});

MVC._addRole('floatpos', function(el) {
  el.setAttribute('mvc-filter', 'floatpos');
  el.setAttribute('mvc-edit', 'floatpos');
});

MVC._addRole('float', function(el) {
  el.setAttribute('mvc-filter', 'float');
  el.setAttribute('mvc-edit', 'float');
});

MVC._addRole('dollar', function(el) {
  el.setAttribute('mvc-filter', 'dollar');
  el.setAttribute('mvc-edit', 'dollar');
});

MVC._addRole('stepperadj', function(el) {
  var tens = '10000000000000000';
  var forx = el.getAttribute('for');
  var stepper = document.getElementById(forx);
  var path = stepper.getAttribute('mvc-value');
  var step = stepper.getAttribute('step') || '1';
  var dir = el.getAttribute('dir') || '+';
  var p = step.split('.');
  var decs = (p.length < 2) ? 1 : p[1].length+1;  // any decimals?
  var mult = tens.substr(0,decs);
  var step = parseFloat(step);

  if (!forx || !stepper || !path) return;

  el.addEventListener('click', function(ev) {
    let value = parseFloat(this.$readModel(path)) || 0;
    value = (dir == '+') ? value + step : value - step;
    value = Math.round(value*mult)/mult;
    this.$updateModel(path, String(value));
  }.bind(this))
});

MVC._addRole('passwordtoggle', function(el) {
  var forx = el.getAttribute('for');
  var password = document.getElementById(forx);

  var toggle = function(elm) {
    if (elm.type == 'password') {
      el.classList.add('strikediag');
    }
    else {
      el.classList.remove('strikediag');
    }
  }

  el.addEventListener('click', function(ev) {
    password.type = (password.type == 'password') ? 'text': 'password';
    toggle(password);
  });

  toggle(password);
});

/* === BINDINGS === Connect model to DOM */
MVC._addBinding('value', function(el) {
  let eventType = el.getAttribute('mvc-event-type') || 'input';
  let path = el.getAttribute('mvc-value');

  // from Model
  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.value = this._processFilters(el, ev.detail);
  }.bind(this));

  // to Model
  el.addEventListener(eventType, function(ev) {
    this.$updateModel(path, this._processEdits(el, el.value));
  }.bind(this));

  this._setInitialValue(path);
});

MVC._addBinding('checked', function(el) {
  let path = el.getAttribute('mvc-checked');
  let checkbox = el.getAttribute('type') == 'checkbox';
  let name = el.getAttribute('name');

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
  let path = el.getAttribute('mvc-text');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.innerText = this._processFilters(el, ev.detail);
  }.bind(this));

  this._setInitialValue(path);
});

MVC._addBinding('html', function(el) {
  let path = el.getAttribute('mvc-html');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.innerHTML = this._processFilters(el, ev.detail);
  }.bind(this));

  this._setInitialValue(path);
});

MVC._addBinding('class', function(el) {
  let path = el.getAttribute('mvc-class');

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
  var expr = el.getAttribute('mvc-attr');
  var obj = this._evaluate(expr, 'Invalid attr Expression', {});
  var keys = Object.keys(obj);

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
  let href = el.getAttribute('mvc-href');
  let reText = /\$\{(.*?)\}/gi;
  let fragments = href.match(reText);	// build list of what to watch

  // setup watchers
  for (let path of fragments) {
    // for each fragment we have to replace all fragments
    path = path.substring(2, path.length-1);  // extract the goods

    this._section.addEventListener(`${path}-FM`, function(ev) {
      let hrefx = el.getAttribute('mvc-href');

      hrefx = hrefx.replace(reText, function(match) {
        return this.$readModel(match.substring(2, match.length-1));
      }.bind(this));

      el.setAttribute('href', hrefx);
    }.bind(this));

    this._setInitialValue(path);
  }
});

MVC._addBinding('option', function(el) {
  var expr = el.getAttribute('mvc-option');
  var exprObj = this._evaluate(expr, 'Invalid Option Expression', {});
  var valPath = exprObj.value || '';
  var textPath = exprObj.text || '';
  var path, val, parent;

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
  parent = el.parentNode;
  if (parent && parent.tagName != 'SELECT') parent = parent.parentNode;   // could be an optgroup

  if (parent && parent.tagName == 'SELECT') {
    path = parent.getAttribute('mvc-value');
    val = this.$readModel(path);
    parent.value = val;
  }
});

MVC._addBinding('optgroup', function(el) {
  var path = el.getAttribute('mvc-optgroup');
  var val;

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

  var tagName = el.tagName;
  var path = el.getAttribute('mvc-each');
  var maxArrayLength = 0;

  // build regexp from index variable.
  var indexVar = el.getAttribute('mvc-index') || '$index';
  var expr = utils.escapeRegExp(indexVar);
  var reText = new RegExp(expr, 'g');  // /(\$index)/g

  // get contents of target element, then empty it
  var contents = el.innerHTML;
  el.innerHTML = '';

  // make a temporary parent container to house template.  Table stuff needs table stuff, li needs ul, etc.
  // this is done to convert html text to a node in the dupe container, then the node is moved to the real container
  // dupe is the cloned version of the original container, ie a <tbody mvc-each='cust.array'>
  // parent.appendChild(dupe) appends the dupe to a fake parent container.  You can't create a <tr> outside of a table.
  var container, parent, grandparent;
  var dupe = el.cloneNode(true);

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
    container.appendChild(grandparent);

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
        child.setAttribute('mvc-_tracker', sIdx)

        // process the new node
        this._processElement(child);

        // process the node's children
        for (let elx of child.querySelectorAll('*')) {
          this._processElement(elx);
        };

        // array length gets sent first from proxy so this all hQnDens before the new array item exists
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
          if (del.getAttribute('mvc-_tracker') == dIdx) {
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

var eventBinder = function(event, fn, el) {
  let colon = fn.indexOf(':'), desc;

  if (colon > -1) {
    fn = fn.substring(0, colon) + fn.substring(colon+1, fn.length);
    fn = '_interface' + utils.camelCase(fn);
    desc = 'interface';
  }
  else {
    desc = 'method';
  }

  if (!(fn in this)) {
    console.log('No',desc,fn)
  }
  else {
    el.addEventListener('click', this[fn].bind(this));
  }
}

MVC._addBinding('on', function(el) {
  let expr = el.getAttribute('mvc-on');
  let obj = this._evaluate(expr, 'Invalid on Expression', {});
  let events = Object.keys(obj);
  let event, fn;

  for (event of events) {
    fn = obj[event];

    eventBinder.call(this, event, fn, el);
  }
});

MVC._addBinding('click', function(el) {
  let fn = el.getAttribute('mvc-click');

  eventBinder.call(this, 'click', fn, el);
});

MVC._addBinding('enabled', function(el) {
  let path = el.getAttribute('mvc-enabled');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.disabled = !!!ev.detail;
  });

  this._setInitialValue(path);
});

MVC._addBinding('disabled', function(el) {
  let path = el.getAttribute('mvc-disabled');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.disabled = !!ev.detail;
  });

  this._setInitialValue(path);
});

MVC._addBinding('show', function(el) {
  let path = el.getAttribute('mvc-show');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.style.display = (!!ev.detail) ? 'initial' : 'none';
  });

  this._setInitialValue(path);
});

MVC._addBinding('hide', function(el) {
  let path = el.getAttribute('mvc-hide');

  this._section.addEventListener(`${path}-FM`, function(ev) {
    el.style.display = (!!ev.detail) ? 'none' : 'initial';
  });

  this._setInitialValue(path);
});

MVC._addBinding('if', function(el) {
  let path = el.getAttribute('mvc-if');
  let sib = el.nextElementSibling;

  if (sib && !sib.hasAttribute('mvc-else')) sib = null;

  this._section.addEventListener(`${path}-FM`, function(ev) {
    let show = !!ev.detail;

    el.style.display = (show) ? 'initial' : 'none';

    if (sib) sib.style.display = (show) ? 'none' : 'initial';
  });

  this._setInitialValue(path);
});

// JS expr based
// ie, "this.model.switch && this.something == 'fred'"
// gets calced every time this.model.switch is changed
// can't do much about this.something
// set initial value locally as _setInitialValue would only be based on one path
MVC._addBinding('xenabled', function(el) {
  let expr = el.getAttribute('mvc-xenabled');
  let tf = this._evaluate(expr, 'Invalid xenabled Expression', true);

  this._addExpression(expr, function(val) {
    el.disabled = !!!val;
  });

  el.disabled = !!!tf;
});

MVC._addBinding('xdisabled', function(el) {
  let expr = el.getAttribute('mvc-xdisabled');
  let tf = this._evaluate(expr, 'Invalid xdisabled Expression', true);

  this._addExpression(expr, function(val) {
    el.disabled = !!val;
  });

  el.disabled = !!tf;
});

MVC._addBinding('xshow', function(el) {
  let expr = el.getAttribute('mvc-xshow');
  let tf = this._evaluate(expr, 'Invalid xshow Expression', true);

  this._addExpression(expr, function(val) {
    el.style.display = (!!val) ? 'initial' : 'none';
  });

  el.style.display = (!!tf) ? 'initial' : 'none';;
});

MVC._addBinding('xhide', function(el) {
  let expr = el.getAttribute('mvc-xhide');
  let tf = this._evaluate(expr, 'Invalid xhide Expression', true);

  this._addExpression(expr, function(val) {
    el.style.display = (!!val) ? 'none' : 'initial';
  });

  el.style.display = (!!tf) ? 'none' : 'initial';
});

MVC._addBinding('xif', function(el) {
  let expr = el.getAttribute('mvc-xhide');
  let tf = this._evaluate(expr, 'Invalid xif Expression', true);
  let sib = el.nextElementSibling;

  if (sib && !sib.hasAttribute('mvc-else')) sib = null;

  this._addExpression(expr, function(val) {
    el.style.display = (val) ? 'initial' : 'none';
  });

  el.style.display = (tf) ? 'initial' : 'none';
});

/* === INTERFACES === */
MVC._addInterface('date:boot', async function(ev) {
  // user clicked on calendar, model dates are JSON.  Widget is moment
  let el = ev.target;
  let fork = el.getAttribute('for');
  let dEl = document.getElementById(fork);
  let path = dEl.getAttribute('mvc-value');
  let dt = this.$readModel(path);
  let mdt = (dt) ? moment(dt) : moment();
  
  let ret = await QnD.widgets.mdate.calendar(mdt);
  this.$updateModel(path, ret.toJSON());
});

MVC._addInterface('time:boot', async function(ev) {
  // user clicked on clock, model times are JSON.  Widget is moment
  let el = ev.target;
  let fork = el.getAttribute('for');
  let dEl = document.getElementById(fork);
  let path = dEl.getAttribute('mvc-value');
  let dt = this.$readModel(path);
  let mdt = (dt) ? moment(dt) : moment();
  
  let ret = await QnD.widgets.mtime.time(mdt);
  
  this.$updateModel(path, ret.toJSON());
});

export {MVC}