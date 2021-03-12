import {io} from '/~static/lib/client/core/io.js';
import {utils} from '/~static/lib/client/core/utils.js';

const url = 'https://roam3.adventurebooking.com:3011';

const formActions = {
  'rowInsert': function(form) {
    const data = db4GetRegularFormData(form);
    const table = form.getAttribute('db4-table');

    setTimeout(async function() {
      let res = await io.post(data, url + '/db4/v1/api/' + table);
      console.log(res)
    }, 1);      

    return false;
  }, 
  
  'rowUpdate': function(form) {
    const data = db4GetRegularFormData(form);
    const table = form.getAttribute('db4-table');

    setTimeout(async function() {
      let res = await io.patch(data, url + '/db4/v1/api/' + table);
      console.log(res)
    }, 1);      

    return false;
  },

  'rowUpsert': function(form) {
    const data = db4GetRegularFormData(form);

    if ('_pk0' in data && data._pk0) {
      this.rowUpdate(form);
    }
    else {
      this.rowInsert(form);
    }

    return false;
  },

  'rowDelete': function(form) {
    const data = db4GetRegularFormData(form);
    const table = form.getAttribute('db4-table');

    setTimeout(async function() {
      let res = await io.delete(data, url + '/db4/v1/api/' + table);
      console.log(res)
    }, 1);      

    return false;
  },

  'getOneRow': function(form) {
    const filters = db4GetRegularFormData(form);
    const options = db4GetSpecialFormData(form);
    const table = form.getAttribute('db4-table');
    let opts = {}, pk;
    let columns = options._columns || '*';

    if ('_pk0' in filters && !('_pk1' in filters)) {
      pk = filters._pk0;
      
    }
    else {
      opts.filters = JSON.stringify(filters);
    }

    opts.columns = JSON.stringify(columns.split(','));

    setTimeout(async function() {
      let res = (pk) ? await io.get(opts, `${url}/db4/v1/api/${table}/${pk}`) : await io.get(opts, `${url}/db4/v1/api/${table}/one`);

      console.log(res)
    }, 1);      

    return false;
  },


  'getManyRows': function(form) {
    const filters = db4GetRegularFormData(form);
    const options = db4GetSpecialFormData(form);
    const table = form.getAttribute('db4-table');
    let opts = {};
    let columns = options._columns || '*';

    opts.filters = JSON.stringify(filters);
    opts.columns = JSON.stringify(columns.split(','));

    setTimeout(async function() {
      let res = await io.get(opts, url + '/db4/v1/api/' + table + '/many');
      console.log(res)
    }, 1);      

    return false;
  },
};

const db4GetAllFormData = function(form) {
  const formData = new FormData(form);
  let entries = {};

  for (let entry of formData.entries()) {
    entries[entry[0]] = entry[1];
  }
     
  return entries;
}

const db4SetAllFormData = function(form, data) {
  for (let idx=0; idx<form.length; idx++) {
    if (form[idx].name in data) {
      form[idx].value = data[form[idx].name]
    }
  }
};

const db4GetRegularFormData = function(form) {
  const formData = new FormData(form);
  let entries = {};

  for (let entry of formData.entries()) {
    if (entry[0].substr(0,1) != '_') {
      entries[entry[0]] = entry[1];
    }
  }
     
  return entries;
}

const db4GetSpecialFormData = function(form) {
  const formData = new FormData(form);
  let entries = {};

  for (let entry of formData.entries()) {
    if (entry[0].substr(0,1) == '_') {
      entries[entry[0]] = entry[1];
    }
  }
     
  return entries;
}

const formHandler = function(ev) {
  let action = ev.submitter.getAttribute('db4-formAction')

  if (! (action in formActions)) {
    console.warn(`Invalid Form Action ${action} on form ${this.name}`);
    console.warn('Valid actions are:');
    for (let act in formActions) {
      console.warn(act);
    }
  }
  else {
    formActions[action](this);
  }

  return false;
}

for (let fel of document.querySelectorAll('form[db4-table]')) {
  //fel.onsubmit = formHandler;
}
/*
const formulaParsers = {
  '=form': function(argList) {
    // form name, field name
    let ret = '';
    let args = argList.split(',');

    if (args.length < 2) return ret;

    for (let idx=0; idx<args.length; idx++) {
      args[idx] = args[idx].trim();
    }

    let form = (args[0].substr(0,1) == '#' || args[0].substr(0,1) == '.') ? document.querySelector(args[0]) : document.querySelector(`form[name=${args[0]}]`);

    if (!form) return ret;

    for (let el of form) {
      if (el.name == args[1]) {
        ret = el.value;
      }
    }

    return ret;
  },

  '=urlparam': function(arg) {
    // url search parameter name
    let obj = {};

    for (let q of location.search.substr(1).split('&')) {
      let nvp = q.split('=');

      obj[nvp[0]] = nvp[1];
    }

    return obj[arg] || '';
  },

  '=urlpath': function(arg) {
    // path split, 1 based.
    // neg# is from end.
    // [1,2,3] = [-3,-2,-1]
    let path = location.pathname.split('/').splice(1);

    arg = parseInt(arg) || 1;

    if (arg < 0) {
      path = path.reverse();
      arg = Math.abs(arg);
    }

    arg--;

    if (path.length <= arg) return '';

    return path[arg];
  },

  '=tlookup': async function(argList) {
    // lookup from a table, getOne
    // =tlookup(table, {pk} || id, fmt)
    // {pk} ==> {name: value, name: value, etc} or an id
    // if pk is an id then bypass sending filters.
    let ret = '', filters = {}, opts = {}, pk;
    let args = argList.split(',');

    if (args.length < 3) return ret;

    let [table, pks, ...fmt] = args;
    fmt = fmt.join(',');
    
    pks = pks.trim();

    if (pks.substr(0,1) == '{') {
      pks = pks.substring(1, pks.length-1);  // remove {}
      pks = pks.split(',');
    
      for (let pk of pks) {
        let pair = pk.split(':');
        filters[pair[0].trim()] = pair[1].trim();
      }

      opts.filters = JSON.stringify(filters);
    }
    else {
      pk = pks;
    }
    
    opts.columns = JSON.stringify(['*']);

    let res = (pk) ? await io.get(opts, `${url}/db4/v1/api/${table}/${pk}`) : await io.get(opts, `${url}/db4/v1/api/${table}/one`);

    let ev2 = function(ctx, fmtx) {
      let expr = 'return (`' + fmtx + '`)';

      return Function(expr).bind(ctx, fmtx)();
    }    

    let result = ev2(res.data, fmt)

    return result;
  }
}

const db4FormulaParse = async function(formula) {
  let ob = formula.indexOf('('), cb = formula.indexOf(')');

  if (ob < 0 || cb < 0) return '';

  let action = formula.substring(0,ob).toLowerCase(), argList = formula.substring(ob+1,cb);

  return (action == '=tlookup') ? await formulaParsers[action](argList) : formulaParsers[action](argList);
}
*/
window.db4 = {
  table: {
    insert: async function(ev) {
      if (!window.db4._utils.isGoodFormEvent(ev)) return false;

      const form = ev.target.parentElement;
      const data = db4GetRegularFormData(form);
      const table = form.getAttribute('db4-table');

      let res = await io.post(data, url + '/db4/v1/api/' + table);
      console.log(res)
    },

    update: async function(ev) {
      if (!window.db4._utils.isGoodFormEvent(ev)) return false;

      const form = ev.target.parentElement;
      const data = db4GetRegularFormData(form);
      const table = form.getAttribute('db4-table');  
      
      let res = await io.patch(data, url + '/db4/v1/api/' + table);
      console.log(res);
    },

    upsert: function(ev) {
      if (!window.db4._utils.isGoodFormEvent(ev)) return false;

      const form = ev.target.parentElement;
      const data = db4GetRegularFormData(form);

      if ('_pk0' in data && data._pk0) {
        window.db4.table.update(form);
      }
      else {
        window.db4.table.insert(form);
      }
    },

    delete: async function(ev) {
      if (!window.db4._utils.isGoodFormEvent(ev)) return false;

      const form = ev.target.parentElement;
      const data = db4GetRegularFormData(form);
      const table = form.getAttribute('db4-table');  

      let res = await io.delete(data, url + '/db4/v1/api/' + table);
      console.log(res)
    },

    getone: async function(ev) {
      if (!window.db4._utils.isGoodFormEvent(ev)) return false;

      const form = ev.target.parentElement;
      const filters = db4GetRegularFormData(form);
      const options = db4GetSpecialFormData(form);
      const table = form.getAttribute('db4-table');

      let opts = {}, pk;
      let columns = options._columns || '*';
  
      if ('_pk0' in options && !('_pk1' in options)) {
        pk = options._pk0;
      }
      else {
        opts.filters = JSON.stringify(filters);
      }
  
      opts.columns = JSON.stringify(columns.split(','));
  
      let res = (pk) ? await io.get(opts, `${url}/db4/v1/api/${table}/${pk}`) : await io.get(opts, `${url}/db4/v1/api/${table}/one`);
      
      db4SetAllFormData(form, res.data);
      
      return false;
    },

    getmany: async function(ev) {
      if (!window.db4._utils.isGoodFormEvent(ev)) return false;

      const form = ev.target.parentElement;      
      const filters = db4GetRegularFormData(form);
      const options = db4GetSpecialFormData(form);
      const table = form.getAttribute('db4-table');

      let opts = {};
      let columns = options._columns || '*';
  
      opts.filters = JSON.stringify(filters);
      opts.columns = JSON.stringify(columns.split(','));
  
      let res = await io.get(opts, url + '/db4/v1/api/' + table + '/many');
      console.log(res);
    }
  },

  _utils: {
    isGoodFormEvent: function(ev) {
      let parent = ev.target.parentElement;

      return (!parent || parent.tagName != 'FORM') ? false : true;
    }
  }
};

const db4ExpressionParser = async function(expr, opts) {
  const options = opts || {};

  const parser = async function(expr, posn) {
    const COMMA = ',', COLON = ':', OPENPAREN = '(', CLOSEPAREN = ')', OPENBRACE = '{', CLOSEBRACE = '}';
    const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789-';
    const alphanum = alpha + numbers;
    const exprLength = expr.length;
    const getFormElement = function(f) {
      return (f.substr(0,1) == '#' || f.substr(0,1) == '.') ? document.querySelector(f) : document.querySelector(`form[name=${f}]`);
    }

    let err;

    posn = posn || 0;

    let actions = {
      'eqfunc': async function() {
        // equal functions
        // search alphanum characters
        let token = '', char;
        posn++;

        while (true) {
          let char = expr.charAt(posn);
          
          if (alphanum.indexOf(char) > -1) {
            token += char;
            posn++;
          }
          else {
            break;
          }
        }

        token = token.toLowerCase();
        char = actions['getNextChar']();

        if (char != OPENPAREN) {
          err = 'No Open Bracket';
          return;
        }

        let res = await eqfuncs[token]();

        return res;
      },

      'string': function(ch) {
        let eq = expr.indexOf(ch, posn+1);
        if (eq == -1) {
          err = 'No Closing Quote';
          return;
        }

        let token = expr.substring(posn, eq+1);
        posn = eq+1;

        return token;      
      },

      'number': function(token) {
        let char;
        posn++;

        while(true) {
          char = actions['getNextChar']();

          if (numbers.indexOf(char) == -1) {
            // too far
            posn--;
            break;
          }

          token += char;
        }

        return token;
      },

      'alphanum': function(token) {
        // unquoted, go up to non alpha
        let char;
        posn++;

        while(true) {
          char = actions['getNextChar']();

          if (alphanum.indexOf(char) == -1) {
            // too far
            posn--;
            break;          
          }

          token += char;
        }

        return token  ;
      },

      'object': async function(ch) {
  //=tlookup("eKVExJHhzJCpvxRC7Fsn8W", {"_pk0": 3}, "fmt")
  //0         1         2         3         4         5
  //01234567890123456789012345678901234567890123456789012345
        let ce = expr.indexOf(CLOSEBRACE, posn);
        let newObj = {}, char, name, value;

        if (ce == -1) {
          err = 'Missing Close Brace';
          return;
        }

        posn++;

        while (true) {
          [name, posn] = await parser(expr, posn);
          name = actions.dequote(name);

          if (!name) break;

          char = actions['getNextChar']();

          if (char != COLON) {
            err = 'Missing Colon';
          }

          [value, posn] = await parser(expr, posn);
          value = actions.dequote(value);
          char = actions['getNextChar']();

          if (char != COMMA && char != CLOSEBRACE) {
            err = 'Missing Comma/Close Brace';
          } 
          
          newObj[name] = value;

          if (posn >= ce) break;
        }

        return newObj;
      },

      'getNextChar': function() {
        let char;

        while(true) {
          char = expr.charAt(posn);

          if (char == ' ') {
            posn++;
          }
          
          break;
        } 
        
        posn++;
        return char;  
      },

      'dequote': function(str) {
        if (utils.object.isString(str)) {
          if (str.substr(0,1) == '"' || str.substr(0,1) == "'") {
            str = str.substring(1, str.length-1);
          }
        }

        return str;
      }
    };

    let eqfuncs = {
      'tlookup': async function() {
        // =tlookup(table, pks, fmt)
        let char, table, pks, pk, fmt;
        let result = '', filters = {}, opts = {};

        [table, posn] = await parser(expr, posn);
        table = actions.dequote(table);
        char = actions['getNextChar']();

        if (char != COMMA) {
          err = 'Missing Comma';
        }

        [pks, posn] = await parser(expr, posn);
        pks = actions.dequote(pks);
        char = actions['getNextChar']();

        if (char != COMMA) {
          console.log('Missing Comma', posn)
        }

        [fmt, posn] = await parser(expr, posn);
        fmt = actions.dequote(fmt);
        char = actions['getNextChar']();

        if (char != CLOSEPAREN) {
          console.log('Missing Closed Bracket',char)
        }

        if (utils.object.isObject(pks)) {
          for (let k in pks) {
            filters[k] = pks[k];
          }
   
          opts.filters = JSON.stringify(filters);
        }
        else {
          pk = pks;
        }
        
        opts.columns = JSON.stringify(['*']);
    
        let res = (pk) ? await io.get(opts, `${url}/db4/v1/api/${table}/${pk}`) : await io.get(opts, `${url}/db4/v1/api/${table}/one`);
    
        let ev2 = function(ctx, fmtx) {
          let expr = 'return (`' + fmtx + '`)';
          let x = Function(expr).bind(ctx)();

          return x;
        }    

        if (res.status == 200) {
          result = ev2(res.data, fmt);
        }
        
        return result;
      },

      'getrow': async function() {
        // getrow(table, key, form-out)
        let char, table, pks, pk, outForm;
        let result = '', filters = {}, opts = {};

        [table, posn] = await parser(expr, posn);
        table = actions.dequote(table);
        char = actions['getNextChar']();

        if (char != COMMA) {
          err = 'Missing Comma';
        }

        [pks, posn] = await parser(expr, posn);
        pks = actions.dequote(pks);
        char = actions['getNextChar']();

        if (char != COMMA) {
          console.log('Missing Comma', posn)
        }

        [outForm, posn] = await parser(expr, posn);
        //outForm = actions.dequote(outForm);
        char = actions['getNextChar']();

        if (char != CLOSEPAREN) {
          console.log('Missing Closed Bracket',char)
        }        

        if (utils.object.isObject(pks)) {
          for (let k in pks) {
            filters[k] = pks[k];
          }
   
          opts.filters = JSON.stringify(filters);
        }
        else {
          pk = pks;
        }
        
        opts.columns = JSON.stringify(['*']);
    
        let res = (pk) ? await io.get(opts, `${url}/db4/v1/api/${table}/${pk}`) : await io.get(opts, `${url}/db4/v1/api/${table}/one`);

        db4SetAllFormData(outForm, res.data);
      },

      'form': async function() {
        // =form(formname, formfield)
        // 
        // =form()            return default form
        // =form(form)        return form
        // =form(form, fld)   return for field value
        // =form(, fld)       return default form field value
        let result = '', formName, fldName, char, fld1;

        [fld1, posn] = await parser(expr, posn);
        fld1 = actions.dequote(fld1);

        formName = (fld1) ? fld1 : options.form.name || '#' + options.form.id;
        char = actions['getNextChar']();

        if (char == CLOSEPAREN) {
          return getFormElement(formName);
        }

        if (char != COMMA) {
          err = 'Missing Comma';
          return result;
        }

        [fldName, posn] = await parser(expr, posn);

        fldName = actions.dequote(fldName);
        char = actions['getNextChar']();

        if (char != CLOSEPAREN) {
          console.log('Missing Closed Bracket',char)
        }
    
        let form = getFormElement(formName);
    
        if (!form) return result;
    
        for (let el of form) {
          if (el.name == fldName) {
            result = el.value;
          }
        }
    
        return result;
      },
    
      'urlparam': async function() {
        // url search parameter name
        let obj = {}, fldName, char;

        [fldName, posn] = await parser(expr, posn);
        fldName = actions.dequote(fldName);
        char = actions['getNextChar']();

        if (char != CLOSEPAREN) {
          console.log('Missing Closed Bracket',char)
        }        
    
        for (let q of location.search.substr(1).split('&')) {
          let nvp = q.split('=');
    
          obj[nvp[0]] = nvp[1];
        }
    
        return obj[fldName] || '';
      },
    
      'urlpath': async function(arg) {
        // path split, 1 based.
        // neg# is from end.
        // [1,2,3] = [-3,-2,-1]
        let fldNo, char;
        let path = location.pathname.split('/').splice(1);

        [fldNo, posn] = await parser(expr, posn);
        fldNo = actions.dequote(fldNo);
        char = actions['getNextChar']();

        if (char != CLOSEPAREN) {
          console.log('Missing Closed Bracket',char)
        }        

        if (isNaN(fldNo)) {
          console.log('Invalid Position#')
          fldNo = 1;
        }

        if (fldNo < 0) {
          path = path.reverse();
          fldNo = Math.abs(fldNo);
        }
    
        fldNo--;
    
        if (path.length <= fldNo) return '';
    
        return path[fldNo];
      },      
    };

    // Let's go
    let resp; 

    while (posn < exprLength) {
      // valid: ' " = { number
      let char = expr.charAt(posn);

      if (char == ' ') {
        posn++;
        continue
      }

      else if (char == '=') {
        resp = await actions['eqfunc']();
      }

      else if (char == "'" || char == '"') {
        resp = actions['string'](char);
      }

      else if (char == OPENBRACE) {
        resp = await actions['object'](char);
      }

      else {
        if (!isNaN(char)) {
          resp = actions['number'](char);
        }
        else {
          if (alpha.indexOf(char) > -1) {
            resp = actions['alphanum'](char);
          }
          else {
            resp = '';
          }
        }
      }

      break;
    }

    return [resp, posn];
  }

  let [resp, posn] = await parser(expr, 0);
  return resp;
}


let func1 = async function() {
  let x, y, z;

  x = await db4FormulaParse('=form(#contactCreate, first)')
  y = await db4FormulaParse('=form(.contactCreate, first)')
  z = await db4FormulaParse('=form(contactUpdate, first)')
  console.log(x,y,z)
  
  x = await db4FormulaParse('=urlparam(name)')
  y = await db4FormulaParse('=urlpath(1)')
  z = await db4FormulaParse('=urlpath(-1)')
  console.log(x,y,z)
  
  x = await db4FormulaParse('=tlookup(eKVExJHhzJCpvxRC7Fsn8W, {id: 2}, ${this.first} ${this.last})')
  console.log(x)
}

//func1();

let func2 = async function() {
  //let resp = await db4ExpressionParser('=tlookup("eKVExJHhzJCpvxRC7Fsn8W", 3, "${this.first} ${this.last}")');
  //console.log(resp)

  let x, y, z;

  x = await db4ExpressionParser('=form(#contactCreate, first)')
  y = await db4ExpressionParser('=form(.contactCreate, first)')
  z = await db4ExpressionParser('=form(contactUpdate, first)')
  console.log(x,y,z)
  
  x = await db4ExpressionParser('=urlparam("_pk0")')
  y = await db4ExpressionParser('=urlpath(1)')
  z = await db4ExpressionParser('=urlpath(-1)')
  console.log(x,y,z)
  
  x = await db4ExpressionParser('=tlookup(eKVExJHhzJCpvxRC7Fsn8W, {id: 2}, "${this.first} ${this.last}")')
  console.log(x)  
}

//func2();

let func3 = async function() {
  let w, x, y, z;

  x = await db4ExpressionParser('=form("#contactCreate", "first")');
  y = await db4ExpressionParser('=form(, first)', {form: {name: '#contactCreate'}});
  z = await db4ExpressionParser('=form()', {form: {name: '#contactCreate'}});
  w = await db4ExpressionParser('=form("#contactCreate")');

  console.log(x, y, z, w)
}

//func3();

const db4ActionHandler = async function(ev) {
  ev.preventDefault();

  let options = {};
  let el = ev.target;
  let form = ev.target.form || null;
  let evType = ev.type;
  let action = el.getAttribute('db4-' + evType);

  options.form = form;

  let res = await db4ExpressionParser(action, options);
  return false;
}


for (let el of document.querySelectorAll('[db4-click]')) {
  el.onclick = db4ActionHandler;
}

let tags = document.evaluate('//*[@*[starts-with(name(), "db4-")]]', document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
try {
  var node = tags.iterateNext();

  while (node) {
    console.log(node);
    node = tags.iterateNext()
  }
}
catch (e) {
  console.log('couldn\'t style ' + e)
}