import {utils} from '/~static/lib/client/core/utils.js';
import {io} from '/~static/lib/client/core/io.js';

const url = 'https://roam3.adventurebooking.com:3011';

class db4ExpressionParser {
// =tinsert(model, table, [clear])
// =tupdate(model, table, [clear])
// =tupsert(model, table, [clear])
// =tdelete(model, table, [clear])
// =tlookup(table, pk, model)
// =tquery(query, model)
// =process(pid, postdata)  
// =copyToObject(array, idx, object)
// =clearObject(object)
// =form(formname, formfield)
// =urlparam(name)
// =urlpath(#)
  constructor() {
    this._COMMA = ',';
    this._COLON = ':';
    this._OPENPAREN = '(';
    this._CLOSEPAREN = ')';
    this._OPENBRACE = '{';
    this._CLOSEBRACE = '}';
    this._ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.';
    this._NUMERIC = '0123456789-';
    this._ALPHANUM = this._ALPHA + this._NUMERIC;
  }
  
  async evaluate(expr, ctx, opts) {
    this._expr = expr;
    this._dataContext = ctx;
    this._options = opts || {};
    this._posn = 0;

    let resp = await this._parser();
    return resp;
  }

  async _parser() {
    // Let's go
    let resp; 

    while (this._posn < this._expr.length) {
      // valid: ' " = { number
      let char = this._expr.charAt(this._posn);

      if (char == ' ') {
        this._posn++;
        continue
      }

      else if (char == '=') {
        resp = await this._equalFunc();
      }

      else if (char == "'" || char == '"') {
        resp = this._string(char);
      }

      else if (char == this._OPENBRACE) {
        resp = await this._object(char);
      }

      else {
        if (!isNaN(char)) {
          resp = this._numeric(char);
        }
        else {
          if (this._ALPHA.indexOf(char) > -1) {
            resp = this._alphaNum(char);
          }
          else {
            resp = '';
          }
        }
      }

      break;
    }

    return resp;
  }

  async _equalFunc() {
    // equal functions
    // search alphanum characters
    let token = '', char;
    this._posn++;

    while (true) {
      let char = this._expr.charAt(this._posn);
      
      if (this._ALPHANUM.indexOf(char) > -1) {
        token += char;
        this._posn++;
      }
      else {
        break;
      }
    }

    token = token.toLowerCase();
    char = this._getNextChar();

    if (char != this._OPENPAREN) {
      err = 'No Open Bracket';
      return;
    }

    let res = await this['_eq' + token]();

    return res;
  };

  _string(ch) {
    let eq = this._expr.indexOf(ch, this._posn+1);
    if (eq == -1) {
      err = 'No Closing Quote';
      return;
    }

    let token = this._expr.substring(this._posn, eq+1);
    this._posn = eq+1;

    return token;      
  };

  _numeric(token) {
    let char;
    this._posn++;

    while(true) {
      char = this._getNextChar();

      if (this._NUMERIC.indexOf(char) == -1) {
        // too far
        this._posn--;
        break;
      }

      token += char;
    }

    return token;
  };

  _alphaNum (token) {
    // unquoted, go up to non alpha
    let char;
    this._posn++;

    while(true) {
      char = this._getNextChar();

      if (this._ALPHANUM.indexOf(char) == -1) {
        // too far
        this._posn--;
        break;          
      }

      token += char;
    }

    return token;
  };

  async _object() {
    //=tlookup("eKVExJHhzJCpvxRC7Fsn8W", {"_pk0": 3}, "fmt")
    //0         1         2         3         4         5
    //01234567890123456789012345678901234567890123456789012345
    let ce = this._expr.indexOf(this._CLOSEBRACE, this._posn);
    let newObj = {}, char, name, value;

    if (ce == -1) {
      let err = 'Missing Close Brace';
      console.log('Missing Close Brace')
      console.log(this._expr, this._posn)
      return;
    }

    this._posn++;

    while (true) {
      name = await this._parser();
      name = this._deQuote(name);

      if (!name) break;

      char = this._getNextChar();

      if (char != this._COLON) {
        err = 'Missing Colon';
      }

      value = await this._parser();
      value = this._deQuote(value);
      char = this._getNextChar();

      if (char != this._COMMA && char != this._CLOSEBRACE) {
        err = 'Missing Comma/Close Brace';
      } 
      
      newObj[name] = value;

      if (this._posn >= ce) break;
    }

    return newObj;
  };

  _getNextChar() {
    let char;

    while(true) {
      char = this._expr.charAt(this._posn);

      if (char == ' ') {
        this._posn++;
      }
      
      break;
    } 
    
    this._posn++;
    return char;  
  };

  _deQuote(str) {
    if (utils.object.isString(str)) {
      if (str.substr(0,1) == '"' || str.substr(0,1) == "'") {
        str = str.substring(1, str.length-1);
      }
    }

    return str;
  }

  _getFormElement(f) {
    return (f.substr(0,1) == '#' || f.substr(0,1) == '.') ? document.querySelector(f) : document.querySelector(`form[name=${f}]`);
  }

  static addMethod(methodName, methodFunc) {
    methodName = methodName.toLowerCase();

    this.prototype['_eq' + methodName] = methodFunc;
  }
};

db4ExpressionParser.addMethod('process', async function() {
  // =process(pid, postdata)
  let postdata = {};
  let pid = await this._parser();
  pid = this._deQuote(pid);

  let char = this._getNextChar();

  if (char == this._COMMA) {
    postdata = await this._parser();
    postdata = this._deQuote(postdata);
  }
  else if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }
console.log(postdata)
  let res = await io.post(postdata, `${url}/db4/v1/api/process/${pid}`);

  if (res.status == 200) {
    console.log(res.data)
  }
  else {
    alert(res.message);
  }
  
  return res;
});

db4ExpressionParser.addMethod('tinsert', async function() {
  // =tinsert(model, table, [clear])
  let clearIt = false;
  let model = await this._parser();
  model = this._deQuote(model);

  let char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  let table = await this._parser();
  table = this._deQuote(table);

  char = this._getNextChar();

  if (char == this._COMMA) {
    clearIt = await this._parser();
    clearIt = this._deQuote(clearIt);
  
    char = this._getNextChar();
  }  

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  let data = this._dataContext.$readModel(model).toJSON();

  if (!utils.object.isObject(data)) {
    alert('Data is not an object '+data);
    return;
  }

  if (Object.keys(data).length == 0) {
    alert('No data to insert');
  }

  if ('PK0' in data) {
    alert('Existing data cannot be inserted, try tupdate or tupsert');
    return;
  }

  let res = await io.post(data, url + '/db4/v1/api/' + table);

  if (res.status == 200) {
    if (clearIt) {
      this._dataContext.$updateModel(model, {});
    }
    else {
      this._dataContext.$updateModel(model, res.data);
    }
  }
  else {
    alert(res.message);
  }

  return res;  
});

db4ExpressionParser.addMethod('tupdate', async function() {
  // =tupdate(model, table, [clear])
  let clearIt = false;
  let model = await this._parser();
  model = this._deQuote(model);

  let char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  let table = await this._parser();
  table = this._deQuote(table);

  char = this._getNextChar();

  if (char == this._COMMA) {
    clearIt = await this._parser();
    clearIt = this._deQuote(clearIt);
  
    char = this._getNextChar();
  }  

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  let data = this._dataContext.$readModel(model).toJSON();

  if (!utils.object.isObject(data)) {
    alert('Data is not an object '+data);
    return;
  }

  if (Object.keys(data).length == 0) {
    alert('No data to insert');
  }

  if (!('PK0' in data)) {
    alert('Data cannot be updated, try tinsert or tupsert');
    return;
  }

  let res = await io.put(data, url + '/db4/v1/api/' + table);

  if (res.status == 200) {
    if (clearIt) {
      this._dataContext.$updateModel(model, {});
    }
    else {
      this._dataContext.$updateModel(model, res.data);
    }
  }
  else {
    alert(res.message);
  }

  return res;  
});

db4ExpressionParser.addMethod('tupsert', async function() {
  // =tupsert(model, table, [clear])
  let clearIt = false, res;
  let model = await this._parser();

  model = this._deQuote(model);

  let char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  let table = await this._parser();
  table = this._deQuote(table);

  char = this._getNextChar();

  if (char == this._COMMA) {
    clearIt = await this._parser();
    clearIt = this._deQuote(clearIt);
  
    char = this._getNextChar();
  }  

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  let data = this._dataContext.$readModel(model).toJSON();

  if (!utils.object.isObject(data)) {
    alert('Data is not an object '+data);
    return;
  }

  if (Object.keys(data).length == 0) {
    alert('No data to insert');
  }

  if ('PK0' in data) {
    res = await io.put(data, url + '/db4/v1/api/' + table);
  }
  else {
    res = await io.post(data, url + '/db4/v1/api/' + table);
  } 

  if (res.status == 200) {
    if (clearIt) {
      this._dataContext.$updateModel(model, {});
    }
    else {
      this._dataContext.$updateModel(model, res.data);
    }
  }
  else {
    alert(res.message);
  }

  return res;  
});

db4ExpressionParser.addMethod('tdelete', async function() {
  // =tdelete(model, table, [clear])
  let clearIt = false;
  let model = await this._parser();
  model = this._deQuote(model);

  let char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  let table = await this._parser();
  table = this._deQuote(table);

  char = this._getNextChar();

  if (char == this._COMMA) {
    clearIt = await this._parser();
    clearIt = this._deQuote(clearIt);
  
    char = this._getNextChar();
  }  

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  let data = this._dataContext.$readModel(model).toJSON();

  if (!utils.object.isObject(data)) {
    alert('Data is not an object '+data);
    return;
  }

  if (Object.keys(data).length == 0) {
    alert('No data to insert');
  }

  if (!('PK0' in data)) {
    alert('Data cannot be deleted without a Primary Key');
    return;
  }

  let res = await io.delete(data, url + '/db4/v1/api/' + table + '/' + data.PK0);

  if (res.status == 200) {
    if (clearIt) {
      this._dataContext.$updateModel(model, {});
    }
  }
  else {
    alert(res.message);
  }

  return res;  
});

db4ExpressionParser.addMethod('tlookup', async function() {
  // =tlookup(table, pk, model)
  let opts = {}, pk;
  let table = await this._parser();
  table = this._deQuote(table);

  let char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  let pks = await this._parser();
  let origPks = pks;
  pks = this._deQuote(pks);

  char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma')
  }

  let model = await this._parser();
  model = this._deQuote(model);

  char = this._getNextChar();

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  if (utils.object.isObject(pks)) {
    for (let k in pks) {
      filters[k] = pks[k];
    }

    opts.filters = JSON.stringify(filters);
  }
  else {
    if (isNaN(pks)) {
      // string, assumed to be a model or literal - if quoted
      if (origPks.substr(0) == '"' || origPks.substr(0) == "'") {
        // literal
        pk = pks;
      }
      else {
        pk = this._dataContext.$readModel(pks);
      }
    }
    else {
      // number
      pk = pks;
    }    
  }

  let data = this._dataContext.$readModel(model).toJSON();

  if (!utils.object.isObject(data)) {
    alert('Data is not an object '+data);
    return;
  }

  opts.columns = JSON.stringify(['*']);

  let res = (pk) ? await io.get(opts, `${url}/db4/v1/api/${table}/${pk}`) : await io.get(opts, `${url}/db4/v1/api/${table}/one`);

  if (res.status == 200) {
    this._dataContext.$updateModel(model, res.data);
  }
  else {
    alert(res.message);
  }
  
  return res;
});

db4ExpressionParser.addMethod('tquery', async function() {
  // =tquery(query, model)
  let query = await this._parser();
  query = this._deQuote(query);

  let char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  let model = await this._parser();
  model = this._deQuote(model);

  char = this._getNextChar();

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  let res = await io.get({}, `${url}/db4/v1/api/query/${query}`);

  if (res.status == 200) {
    this._dataContext.$updateModel(model, res.data);
  }
  else {
    alert(res.message);
  }
  
  return res;
});

db4ExpressionParser.addMethod('copyArrayToObject', async function() {
  // =copyToObject(array, idx, object)
  let array = await this._parser();
  array = this._deQuote(array);

  let char = this._getNextChar();

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  let idx = await this._parser();
  idx = this._deQuote(idx);

  if (char != this._COMMA) {
    console.log('Missing Comma',char);
    return;
  }

  char = this._getNextChar();

  let obj = await this._parser();
  obj = this._deQuote(obj);

  char = this._getNextChar();

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  let arrayData = this._dataContext.$readModel(array);
  let entry = arrayData[idx];

  this._dataContext.$updateModel(obj, entry);
});

db4ExpressionParser.addMethod('clearObject', async function() {
  // =clearObject(object)
  let obj = await this._parser();
  obj = this._deQuote(obj);

  let char = this._getNextChar();

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char);
    return;
  }

  this._dataContext.$updateModel(obj, {});
});

db4ExpressionParser.addMethod('form', async function() {
  // =form(formname, formfield)
  // 
  // =form()            return default form
  // =form(form)        return form
  // =form(form, fld)   return for field value
  // =form(, fld)       return default form field value
  let result = '', formName, fldName, char, fld1;

  fld1 = await this._parser();
  fld1 = this._deQuote(fld1);

  formName = (fld1) ? fld1 : this._options.form.name || '#' + this._options.form.id;
  char = this._getNextChar();

  if (char == this._CLOSEPAREN) {
    return formName;
  }

  if (char != this._COMMA) {
    err = 'Missing Comma';
    return result;
  }

  fldName = await this._parser();
  fldName = this._deQuote(fldName);
  char = this._getNextChar();

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char)
  }

  let form = this._getFormElement(formName);

  if (!form) return result;

  for (let el of form) {
    if (el.name == fldName) {
      result = el.value;
    }
  }

  return result;
});

db4ExpressionParser.addMethod('urlparam', async function() {
  // =urlparam(name)
  // url search parameter name
  let obj = {}, fldName, char;

  fldName = await this._parser();
  fldName = this._dequote(fldName);
  char = this._getNextChar();

  if (char != this._CLOSEPAREN) {
    console.log('Missing Closed Bracket',char)
  }        

  for (let q of location.search.substr(1).split('&')) {
    let nvp = q.split('=');

    obj[nvp[0]] = nvp[1];
  }

  return obj[fldName] || '';
});

db4ExpressionParser.addMethod('urlpath', async function() {
  // =urlpath(#)
  // path split, 1 based.
  // neg# is from end.
  // [1,2,3] = [-3,-2,-1]
  let fldNo, char;
  let path = location.pathname.split('/').splice(1);

  fldNo = await this._parser();
  fldNo = this._dequote(fldNo);
  char = this._getNextChar();

  if (char != this._CLOSEPAREN) {
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
});

export {db4ExpressionParser};

/*
const db4ExpressionParserx = async function(expr, opts) {
  const options = opts || {};

  var parser = async function(expr, posn) {
    const COMMA = ',', COLON = ':', OPENPAREN = '(', CLOSEPAREN = ')', OPENBRACE = '{', CLOSEBRACE = '}';
    const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789-';
    const alphanum = alpha + numbers;
    const exprLength = expr.length;
    const getFormElement = function(f) {
      return (f.substr(0,1) == '#' || f.substr(0,1) == '.') ? document.querySelector(f) : document.querySelector(`form[name=${f}]`);
    }

    let err;
    let actions = {};
    let eqfuncs = {};

    posn = posn || 0;    

    actions.eqfunc = async function() {
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
      char = actions.getNextChar();

      if (char != OPENPAREN) {
        err = 'No Open Bracket';
        return;
      }

      let res = await eqfuncs[token]();

      return res;
    };

    actions.string = function(ch) {
      let eq = expr.indexOf(ch, posn+1);
      if (eq == -1) {
        err = 'No Closing Quote';
        return;
      }

      let token = expr.substring(posn, eq+1);
      posn = eq+1;

      return token;      
    };

    actions.number = function(token) {
      let char;
      posn++;

      while(true) {
        char = actions.getNextChar();

        if (numbers.indexOf(char) == -1) {
          // too far
          posn--;
          break;
        }

        token += char;
      }

      return token;
    };

    actions.alphanum = function(token) {
      // unquoted, go up to non alpha
      let char;
      posn++;

      while(true) {
        char = actions.getNextChar();

        if (alphanum.indexOf(char) == -1) {
          // too far
          posn--;
          break;          
        }

        token += char;
      }

      return token  ;
    };

    actions.object = async function(ch) {
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

        char = actions.getNextChar();

        if (char != COLON) {
          err = 'Missing Colon';
        }

        [value, posn] = await parser(expr, posn);
        value = actions.dequote(value);
        char = actions.getNextChar();

        if (char != COMMA && char != CLOSEBRACE) {
          err = 'Missing Comma/Close Brace';
        } 
        
        newObj[name] = value;

        if (posn >= ce) break;
      }

      return newObj;
    };

    actions.getNextChar = function() {
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
    };

    actions.dequote = function(str) {
      if (utils.object.isString(str)) {
        if (str.substr(0,1) == '"' || str.substr(0,1) == "'") {
          str = str.substring(1, str.length-1);
        }
      }

      return str;
    };

    let eqfuncs = {
      'tinsert': async function() {
        // =tinsert(table)
        let table, char;

        [table, posn] = await parser(expr, posn);
        table = actions.dequote(table);
        char = actions.getNextChar();
        
        if (char != CLOSEPAREN) {
          console.log('Missing Closed Bracket',char)
        }

        console.log('Insert to ', table)
      },

      'tlookup': async function() {
        // =tlookup(table, pks, fmt)
        let char, table, pks, pk, fmt;
        let result = '', filters = {}, opts = {};

        [table, posn] = await parser(expr, posn);
        table = actions.dequote(table);
        char = actions.getNextChar();

        if (char != COMMA) {
          err = 'Missing Comma';
        }

        [pks, posn] = await parser(expr, posn);
        pks = actions.dequote(pks);
        char = actions.getNextChar();

        if (char != COMMA) {
          console.log('Missing Comma', posn)
        }

        [fmt, posn] = await parser(expr, posn);
        fmt = actions.dequote(fmt);
        char = actions.getNextChar();

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
        let filters = {}, opts = {};

        [table, posn] = await parser(expr, posn);
        table = actions.dequote(table);
        char = actions.getNextChar();

        if (char != COMMA) {
          err = 'Missing Comma';
        }

        [pks, posn] = await parser(expr, posn);
        pks = actions.dequote(pks);
        char = actions.getNextChar();

        if (char != COMMA) {
          console.log('Missing Comma', posn)
        }

        [outForm, posn] = await parser(expr, posn);
        //outForm = actions.dequote(outForm);
        char = actions.getNextChar();

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
        char = actions.getNextChar();

        if (char == CLOSEPAREN) {
          return getFormElement(formName);
        }

        if (char != COMMA) {
          err = 'Missing Comma';
          return result;
        }

        [fldName, posn] = await parser(expr, posn);

        fldName = actions.dequote(fldName);
        char = actions.getNextChar();

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
        char = actions.getNextChar();

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
        char = actions.getNextChar();

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
        resp = await actions.eqfunc();
      }

      else if (char == "'" || char == '"') {
        resp = actions.string(char);
      }

      else if (char == OPENBRACE) {
        resp = await actions.object(char);
      }

      else {
        if (!isNaN(char)) {
          resp = actions.number(char);
        }
        else {
          if (alpha.indexOf(char) > -1) {
            resp = actions.alphanum(char);
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
*/