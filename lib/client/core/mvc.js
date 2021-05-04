import {utils} from '/~static/lib/client/core/utils.js';
import Parser from "/static/v1/static/lib/client/core/rd-parse.js";
import Grammar from "/static/v1/static/lib/client/core/grammar.js";

const JSParser = Parser(Grammar);

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
    const noBindingList = ['handle', 'nohandle', 'edit', 'role', 'filter', 'index'];
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
          if (noBindingList.indexOf(attr) > -1) continue;  // these aren't bindings, but informational

          if (attr.substr(0,6) == 'event-') attr = 'event';   // if event-something ---> event

          if (MVC._bindings.indexOf(attr) > -1) {
            let binding = '_bind' + utils.camelCase(attr);

            this[binding](el);
          }
          else {
            if (attr.indexOf('_') == -1) {
              console.log('No binding for ','*'+attr+'*', el)
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

  async _jsParse(ev, ast) {
    // parse an ast (abstract syntax tree)
    // ev is the original event that kicked off the process.  Passed from function to function
    let result;
    let self = this;

    const parse = async function(obj) {
      switch (obj.type) {
        case 'CallExpression':
          let fn = obj.callee.name;
          let fnObj = {ev, args: [], target: null, attrs: {}};

          if (ev) {
            fnObj.target = ev.target;
            
            if (fnObj.target.hasAttributes()) {
              let attrs = fnObj.target.attributes;

              for (let i=0; i<attrs.length; i++) {
                fnObj.attrs[attrs[i].name] = attrs[i].value;
              }
            }
          }

          for (let i=0; i<obj.arguments.length; i++) {
            fnObj.args.push(await parse(obj.arguments[i]));
          }          

          try {
            result = await this[fn](fnObj);
          }
          catch (err) {
            console.error('Function ' + fn)
            console.error(err);
          }

          break;  

        case 'BinaryExpression':
          // left/right
          result = 0;

          let left = await parse(obj.left);
          let right = await parse(obj.right);

          switch (obj.operator) {
            // mathematical
            case '+':
              result = left + right;
              break;

            case '-':
              result = left - right
              break;

            case '*':
              result = left * right;
              break;

            case '/':
              try {
                result = left / right;
              }
              catch(err) {
                result = 0;
              }

              break;

            case '^':
              result = left ^ right;
              break;
    
            case '%':
              result = left % right;
              break;
    
            // comparisons
            case '>':
              result = left > right;
              break;

            case '>=':
              result = left >= right;
              break;            
    
            case '<':
              result = left < right;
              break;  

            case '<=':
              result = left <= right;
              break;  

            case '==':
              result = left == right;
              break;            

            case '!=':
              result = left != right;
              break;            
        
            }

          break;

        case 'ObjectLiteral':
          // {}
          // build a new object with interpreted values
          result = {};

          for (let p=0; p<obj.properties.length; p++) {
            let res = await parse(obj.properties[p].value);

            result[obj.properties[p].name] = res;
          }

          break;

        case 'ArrayLiteral':
          // []
          // build a new array with interpreted values
          result = [];

          for (let p=0; p<obj.elements.length; p++) {
            let res = await parse(obj.elements[p]);

            result.push(res);
          }

          break;
    
        case 'MemberExpression':
          // obj.mema.memb

        case 'Identifier':
          // Not string, object, etc
          // this is an index into this.model
          result = this.$readModel(obj.text);
          break;

        case 'Literal':
          // self-explanatory
          result = obj.value;
          break;

        default:
          break;
      }

      return result;
    }.bind(this);

    return await parse(ast);
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
  
  _addMethod(name, method) {
    // Add class method
    this[name] = method;
  }

  async _functionHandler(expr, ev) {
    let op = expr.indexOf('('), colon = expr.indexOf(':');
    if (colon == -1) colon = expr.length;
    
    if (op >-1 && colon < op) {
      this[expr](ev);
      return;
    }

    let ast = JSParser(expr);

    return await this._jsParse(ev, ast);
  }

  // public instance methods
  $updateModel(path, value) {
    // Update model value with given path
    // path = dotted path
    path = path.replace(/\[(\w+)\]/g, '.$1'); // [1] --> .1

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

    path = path.replace(/\[(\w+)\]/g, '.$1'); // [1] --> .1

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

  $setValue(path, val) {
    // set value on field with mvc-value=path
    let pfx = MVC.prefix;

    setTimeout(function() {
      this._section.querySelector(`[${pfx}-value="${path}"]`).value = val;
    }.bind(this),1)    
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
  
  $display(model) {
    // Proxy data looks weird.
    // This un-weirds it.
    console.log(JSON.parse(JSON.stringify(model)))
  }

  $copy(model) {
    return JSON.parse(JSON.stringify(model));
  }

  // private (_) class methods
  static _setPrefix(prefix) {
    MVC.prefix = prefix || 'mvc';
  }

  static _addProtoMethod(name, method) {
    // Add instance method to MVC
    this.prototype[name] = method;
  }

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

  static _expressionTester(expr) {
    return JSParser(expr);
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
      if (key in target && Array.isArray(target[key])) {
        while (target[key].length > 0) {
          target[key].pop();
        }
      }

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

    else {
      target[key] = value;
    }

    if (!bypassEvent) this._triggerEvent(this._makeEventTopic(key), value);
    return true;
  },

  get(target, key) {
    //console.log('get',target, key)
    let self = this;

    if (key == 'isProxy') return true;

    if (key == 'proxyFor') return this._proxyFor;

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

export {MVC}