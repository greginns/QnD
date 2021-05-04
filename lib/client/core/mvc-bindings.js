import {utils} from '/~static/lib/client/core/utils.js';

/* === FILTERS ===  Appearance */
let addMVCBindings;

export default addMVCBindings = function(MVC) {
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
    let [dollars, cents, ...extras] = String(value).split('.');

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

  MVC._addFilter('tag', function(el, value) {
    let outerSpan = document.createElement('span');
    let fmttag = el.getAttribute('mvc-tag-format') || null;
    let fmtfunc = (fmttag) ? this[fmttag] || null : null;
  
    if (value && fmtfunc) {
      for (let entry of value) {
        outerSpan.appendChild(this[fmttag](entry));
      }
    }
  
    return outerSpan;
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

    for (let elx of el.querySelectorAll('*')) {
      this._processElement(elx);
    };
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
          // from then on the proxy event will suffice
          pathlet = `${path + '.' + sIdx}`;
          val = this.$readModel(pathlet);

          this._dispatch(pathlet + '-FM', val);
        }
      }

      if (arrayLength < maxArrayLength) {
        // shortened array
        for (let dIdx=arrayLength; dIdx<maxArrayLength; dIdx++) {
          for (let del of el.childNodes) {
            if (del.getAttribute(pfx + '-_tracker') == String(dIdx)) {
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
  // mvc-event-xxxxx = 'func' (except mvc-event-type)
  // mvc-click = 'func'
  var eventBinder = function(event, expr, el) {
    let op = expr.indexOf('('), colon = -1;

    if (op == -1) op = expr.length;

    if (op > -1) {
      colon = expr.indexOf(':');
      if (colon > op) colon = -1;
    }
    
    if (colon > -1) {
      expr = expr.substring(0, colon) + expr.substring(colon+1, expr.length);  // date:boot ---> dateboot
      expr = '_interface' + utils.camelCase(expr);                             // dateboot ---> _interfacedateboot 
    }
    else {
      // test expression
      try {
        MVC._expressionTester(expr);
      }
      catch(err) {
        console.log(err);
        return;
      }
    }

    el.addEventListener(event, this._functionHandler.bind(this, expr));
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

        if (fn && event != 'type') {
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

    if (!expr) return;

    let tf = this._evaluate(expr, 'Invalid xenabled Expression', true);

    this._addExpression(expr, function(val) {
      el.disabled = !!!val;
    });

    el.disabled = !!!tf;
  });

  MVC._addBinding('xdisabled', function(el) {
    let pfx = MVC.prefix;
    let expr = el.getAttribute(pfx + '-xdisabled');

    if (!expr) return;

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
}