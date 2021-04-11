const root = process.cwd();
const {utils} = require(root + '/lib/server/utils/utils.js');

const templateEval = function(tmpl) {
  return Function('return (`' + tmpl + '`)').bind(this)();
}

const buildActionData = function(data, matcher, params) {
  // *** ADD OBJECTS {}
  // Four steps: 
  //  1- use the matcher to build a variable list
  //  2- execute templates
  //  3- virtual fields
  //  4- arrays
  let result = {};

  // step 1
  for (let k in matcher) {
    let v = matcher[k] || '';
//console.log(k,v)
    if (!v) {
      result[k] = '';
      continue;
    }

    if (v.substr(0,1) == '"' || v.substr(0,1) == "'") {
      // string literal
      result[k] = v.substring(1, v.length-1);
    }
    else {
      // from data object
      let d1 = {data: Object.assign({}, data)};  // copy data
      let pieces = v.split('.');        // v=  data.part1.part2,... or data.part1...., or data

      if (pieces.length == 1) {
        result[k] = d1;
        break;
      }

      let prop = pieces.pop();  // last part

      for (let p of pieces) {
        if (d1 && p in d1) {
          d1 = d1[p];
        }
        else {
          result[k] = null;
          break;
        }
      }

      result[k] = d1[prop];
    }
  }

  // step 2 - templates
  for (let k in params) {
    let v = params[k];

    if ('template' in v) {
      result[k] = templateEval.call(result, v.template);
    }
  }

  // step 3 - remove virtual fields
  for (let k in params) {
    let v = params[k];

    if (v.virtual) {
      delete result[k];
    }
  }

  // step 4 - handle arrays
  for (let k in params) {
    let v = params[k];

    if (v.type == 'array' && k in result && !Array.isArray(result[k])) { //&& result[k] 
      result[k] = (result[k]) ? result[k].split(',') : '';
    }

    if (v.type != 'array' && k in result && Array.isArray(result[k])) {
      result[k] = result[k].join(',');
    }
  }

  return result;
}

const addSecurity = function(headers, body, config, secVal) {
  if (config.security == 'body') {
    body[config.securityName] = secVal;
  }
  else {
    headers[config.securityName] = secVal;
  }
}

module.exports = {buildActionData, addSecurity};