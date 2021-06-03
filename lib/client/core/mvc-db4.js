import {App} from '/~static/project/app.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {io} from "/static/v1/static/lib/client/core/io.js";
import Parser from "/static/v1/static/lib/client/core/rd-parse.js";
import Grammar from "/static/v1/static/lib/client/core/grammar.js";

const JSParser = Parser(Grammar);

/*
Built-in
  $updateModel(path, value)
  $readModel(path)
  $setValue(path, val)
  $addCalculated(path, name)
  $addWatched(path, fn)
  $focus(path)
  $display(model)
  $copy(model)

Add-Ons
  $serverProcess(pid, postdata)

  $tableLookup(table, pk, model)
  $tableQuery(query, opts, model)
  $tableInsert(table, model, [clear])  
  $tableUpdate(table, model, [clear])  
  $tableUpsert(table, model, [clear])  
  $tableDelete(table, pk, model)  

  $arrayCopyToObject(array, idx, object)
  $arrayClear(array)
  $arraySet(array, value)

  $objectClear(object)
  $objectSet(object, value)

  $formGet(name)
  $formGet()            return parent form, all fields
  $formGet(form)        return specified form, all fields
  $formGet(, fld)       return parent form, specified field
  $formGet(form, fld)   return specified form, specified field  

  $calcSum(model, [condition])
  $condIf(if, [else])

  $urlGetParam(name)    also this.model._params  Or (_params.name in html)
  $urlGetPath(#)
*/
let addDB4Functions;

export default addDB4Functions = function(MVC) {
  MVC._addProtoMethod('$serverProcess', async function(obj) {
    // $serverProcess(pid, postdata)
    const fnName = '$serverProcess';

    if (obj.args.length != 2) throw new Error(`${fnName} needs exactly 2 arguments: pid and postdata`);

    let [pid, postdata] = obj.args;

    if (!utils.object.isObject(postdata)) throw new Error(`${fnName} post data ${model} is not an object`);
  
    let res = await io.post(postdata, `${App.url}/db4/v1/api/process/${pid}`);

    if (res.status == 200) {
      console.log(res.data)
    }
    else {
      throw new Error(res.message);
    }
    
    return res;
  });

  MVC._addProtoMethod('$tableLookup', async function(obj) {
    // $tableLookup(table, pk, model)
    // model must be a this.model entry.
    const fnName = '$tableLookup';

    if (obj.args.length != 3) throw new Error(`${fnName} needs exactly 3 arguments`);

    let opts = {};
    let [table, pk, model] = obj.args;
    let isProxy = model.isProxy || false;

    if (utils.object.isObject(pk)) {
      opts.filters = JSON.stringify(pk);
      pk = null;
    }

    // make sure destination is a model object
    if (!isProxy || !utils.object.isObject(model)) throw new Error(`${fnName} destination model is not a model object`);

    opts.columns = JSON.stringify(['*']);

    let res = (pk) ? await io.get(opts, `${App.url}/db4/v1/api/${table}/${pk}`) : await io.get(opts, `${App.url}/db4/v1/api/${table}/one`);

    if (res.status == 200) {
      model = model.proxyFor;

      this.$updateModel(model, res.data);
    }
    else {
      throw new Error(res.message);
    }

    return res.data;
  });

  MVC._addProtoMethod('$tableQuery', async function(obj) {
    // $tableQuery(query, opts, model)
    // model must be a this.model entry.
    const fnName = '$tableQuery';

    if (obj.args.length != 3) throw new Error(`${fnName} needs exactly 3 arguments`);

    let [query, opts, model] = obj.args;
    let isProxy = model.isProxy || false;

    // make sure destination is an object
    if (!isProxy || !utils.object.isArray(model)) throw new Error(`${fnName} destination model is not a model array`);

    let res = await io.get(opts, `${App.url}/db4/v1/api/query/${query}`);

    if (res.status == 200) {
      model = model.proxyFor;

      this.$updateModel(model, res.data);
    }
    else {
      throw new Error(res.message);
    }

    return res.data;
  });

  MVC._addProtoMethod('$tableInsert', async function(obj) {
    // $tableInsert(table, model, [clear])  
    // model can be an object or a this.model entry
    const fnName = '$tableInsert';

    if (obj.args.length < 2) throw new Error(`${fnName} needs at least 2 arguments`);

    let [table, model, clear] = obj.args;
    let isProxy = model.isProxy || false;

    // make sure source is an object, not necessarily a proxy
    if (!utils.object.isObject(model)) throw new Error(`${fnName} source model is not an object`);
    if (Object.keys(model).length == 0) throw new Error(`${fnName} has no data to insert`);
    if ('_PK0' in model) throw new Error(`${fnName}: existing data cannot be inserted, try $tableUpdate or $tableUpsert`);

    let res = await io.post(model, `${App.url}/db4/v1/api/${table}`);

    if (res.status == 200) {
      if (isProxy) {
        // only update if a this.model entry
        model = model.proxyFor;

        if (clear) {
          this.$updateModel(model, {});
        }
        else {
          this.$updateModel(model, res.data);
        }
      }
    }
    else {
      throw new Error(res.message);
    }

    return res.data;
  });

  MVC._addProtoMethod('$tableUpdate', async function(obj) {
    // $tableUpdate(table, model, [clear])  
    const fnName = '$tableUpdate';

    if (obj.args.length < 2) throw new Error(`${fnName} needs at least 2 arguments`);

    let [table, model, clear] = obj.args;
    let isProxy = model.isProxy || false;

    // make sure source is an object
    if (!utils.object.isObject(model)) throw new Error(`${fnName} source model is not an object`);
    if (Object.keys(model).length == 0) throw new Error(`${fnName} has no data to insert`);
    if (!('_PK0' in model)) throw new Error(`${fnName}: existing data cannot be updated, try $tableInsert or $tableUpsert`);

    let res = await io.put(model, `${App.url}/db4/v1/api/${table}`);

    if (res.status == 200) {
      if (isProxy) {
        // only update if a this.model entry
        model = model.proxyFor;

        if (clear) {
          this.$updateModel(model, {});
        }
        else {
          this.$updateModel(model, res.data);
        }
      }
    }
    else {
      throw new Error(res.message);
    }

    return res.data;
  });

  MVC._addProtoMethod('$tableUpsert', async function(obj) {
    // $tableUpsert(table, model, [clear])  
    const fnName = '$tableUpsert';

    if (obj.args.length < 2) throw new Error(`${fnName} needs at least 2 arguments`);

    let [table, model, clear] = obj.args;
    let isProxy = model.isProxy || false;

    // make sure source is an object
    if (!utils.object.isObject(model)) throw new Error(`${fnName} source model is not an object`);
    if (Object.keys(model).length == 0) throw new Error(`${fnName}: no data to insert`);

    if ('_PK0' in model) {
      res = await io.put(model, `${App.url}/db4/v1/api/${table}`);
    }
    else {
      res = await io.post(model, `${App.url}/db4/v1/api/${table}`);
    } 

    if (res.status == 200) {
      if (isProxy) {
        // only update if a this.model entry
        model = model.proxyFor;

        if (clear) {
          this.$updateModel(model, {});
        }
        else {
          this.$updateModel(model, res.data);
        }
      }
    }
    else {
      throw new Error(res.message);
    }

    return res.data;
  });

  MVC._addProtoMethod('$tableDelete', async function(obj) {
    // $tableDelete(table, pk, model)  
    const fnName = '$tableDelete';

    if (obj.args.length < 3) throw new Error(`${fnName} needs at least 3 arguments`);

    let opts = {};
    let [table, pk, model] = obj.args;
    let isProxy = model.isProxy || false;

    if (utils.object.isObject(pk)) {
      opts.filters = JSON.stringify(pk);
      pk = null;
    }

    let res = (pk) ? await io.delete(opts, `${App.url}/db4/v1/api/${table}/${pk}`) : await io.delete(opts, `${App.url}/db4/v1/api/${table}/one`);

    if (res.status == 200) {
      if (isProxy) {
        // only update if a this.model entry
        model = model.proxyFor;

        this.$updateModel(model, {});
      }
      else {
        throw new Error(res.message);
      }
    }

    return {};
  });

  MVC._addProtoMethod('$arrayCopyToObject', function(obj) {
    // $arrayCopyToObject(array, idx, object)
    // any array, model object
    const fnName = '$arrayCopyToObject';

    if (obj.args.length != 3) throw new Error(`${fnName} needs exactly 3 arguments`);

    let [array, idx, object] = obj.args;
    let objectProxy = object.isProxy || false;

    if (!utils.object.isArray(array)) throw new Error(`${fnName}: Invalid Array`);
    if (!objectProxy || !utils.object.isObject(object)) throw new Error(`${fnName}: Invalid Object`);

    let entry = array[idx];

    object = object.proxyFor;

    this.$updateModel(object, entry);

    return entry;
  });

  MVC._addProtoMethod('$arrayClear', function(obj) {
    // $arrayClear(array)
    const fnName = 'arrayClear';

    if (obj.args.length != 1) throw new Error(`${fnName} needs exactly 1 argument`);

    let [array] = obj.args;
    let isProxy = array.isProxy || false;

    if (!isProxy || !utils.object.isArray(array)) throw new Error(`${fnName}: Invalid Array`);

    array = array.proxyFor;

    this.$updateModel(array, []);

    return [];
  });

  MVC._addProtoMethod('$arraySet', function(obj) {
    // $arraySet(array, value)
    const fnName = 'arraySet';

    if (obj.args.length != 2) throw new Error(`${fnName} needs exactly 2 arguments`);

    let [array, value] = obj.args;
    let arrayProxy = array.isProxy || false;

    if (!arrayProxy || !utils.object.isArray(array)) throw new Error(`${fnName}: Destination is not a model Array`);
    if (!utils.object.isArray(value)) throw new Error(`${fnName}: Source is not an Array`);

    array = array.proxyFor;

    this.$updateModel(array, valueData);

    return value;
  });

  MVC._addProtoMethod('$objectClear', function(obj) {
    // $objectClear(object)
    const fnName = 'objectClear';

    if (obj.args.length != 1) throw new Error(`${fnName} needs exactly 1 argument`);

    let [object] = obj.args;
    let isProxy = object.isProxy || false;

    if (!isProxy || !utils.object.isObject(object)) throw new Error(`${fnName}: Invalid Object`);

    object = object.proxyFor;

    this.$updateModel(object, {});

    return {};
  });

  MVC._addProtoMethod('$objectSet', function(obj) {
    // $objectSet(object, value)
    const fnName = 'objectSet';

    if (obj.args.length != 2) throw new Error(`${fnName} needs exactly 2 arguments`);

    let [object, value] = obj.args;
    let objectProxy = object.isProxy || false;

    if (!objectProxy || !utils.object.isObject(object)) throw new Error(`${fnName}: Destination is not a model Object`);
    if (!utils.object.isObject(value)) throw new Error(`${fnName}: Source is not an Object`);

    object = object.proxyFor;

    this.$updateModel(object, valueData);

    return value;
  });

  MVC._addProtoMethod('$formGet', function(obj) {
    // $formGet(name)
    // 
    // $formGet()            return parent form, all fields
    // $formGet(form)        return specified form, all fields
    // $formGet(, fld)       return parent form, specified field
    // $formGet(form, fld)   return specified form, specified field
    
    const fnName = '$formGet';
    let result = {};

    const getSpecifiedForm = function(f) {
      return (f.substr(0,1) == '#' || f.substr(0,1) == '.') ? document.querySelector(f) : document.querySelector(`form[name=${f}]`);
    }

    const getParentForm = function() {
      return obj.target.closest('form');
    }

    let [form, fldName] = obj.args;

    let formEl = (form) ? getSpecifiedForm(form) : getParentForm();

    if (!formEl) throw new Error(`${fnName}: Invalid Form: ${form}`);

    for (let el of formEl) {
      if (fldName) {
        if (el.name == fldName) {
          return el.value;
        }
      }
      else {
        if (el.name) result[el.name] = el.value;
      }
    }

    return result;
  });
  
  MVC._addProtoMethod('$calcSum', async function(obj) {
    // $calcSum(model, field, [cond])

    const fnName = '$calcSum';
    let sum = 0;
    let ast;

    if (obj.args.length < 2) throw new Error(`${fnName} needs at least 2 arguments`);

    let [path, field, cond] = obj.args;
    if (cond) ast = JSParser(cond);
    let data = this.$readModel(path);
    let arrayProxy = data.isProxy || false;

    if (!arrayProxy || !utils.object.isArray(data)) throw new Error(`${fnName}: Source is not a model Array`);

    for (let idx=0, res; idx<data.length; idx++) {
      this.$updateModel('$index', idx);
      
      res = (cond) ? await this._jsParse(null, ast) : true;

      if (res) sum += data[idx][field] || 0;
    }

    return sum;
  });

  MVC._addProtoMethod('$urlGetParam', function(obj) {
    // $urlGetParam(name)
    const fnName = '$urlGetParam';

    if (obj.args.length != 1) throw new Error(`${fnName} needs exactly 1 argument`);

    let [name] = obj.args;

    for (let q of location.search.substr(1).split('&')) {
      let nvp = q.split('=');

      obj[nvp[0]] = nvp[1];
    }

    return obj[name] || '';    
  });

  MVC._addProtoMethod('$urlGetPath', function(obj) {
    // $urlGetPath(#)
    // path split, 1 based.
    // neg# is from end.
    // [1,2,3] = [-3,-2,-1]
    const fnName = '$urlGetPath';
    let path;

    if (obj.args.length != 1) throw new Error(`${fnName} needs exactly 1 argument`);

    let [fldNo] = obj.args;
    
    if (isNaN(fldNo)) throw new Error(`${fnName} Invalid Position# ${fldNo}`);

    if (fldNo < 0) {
      path = path.reverse();
      fldNo = Math.abs(fldNo);
    }

    fldNo--;

    if (path.length <= fldNo) return '';

    return path[fldNo];
  });
};