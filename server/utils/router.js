const root = process.cwd();
const {ResponseMessage} = require(root + '/server/utils/messages.js');

var routePaths = []

class Router {
  constructor() {
  }

  static add(msg) {
    for (let p of msg.path) {
      routePaths.push({mpath: msg.method + '/' + msg.app + this._stripSlashes(p), msg});
    }
  }

  static async go(req, res) {
    var path = req.method + this._stripSlashes(req.parsedURL.pathname);
    var [entry, params] = this._getEntry(path);
console.log(path)
    //if (!entry) {  
      //var entry, params; // weird error if entry and params == false  "TypeError: Cannot set property 'false' of undefined"
      // no match, use 404 page if exists
      //var [entry, params] = this._getEntry(path);
    //}

    if (!entry) {
      return new ResponseMessage({data: '', status: 404, ct: 'text/plain', err: new Error('No 404 page found')});
    }

    req.params = params;
    
    return await entry.fn(req, res);
  }

  static getSecurity(req) {
    // get security for a route
    var path = req.method + this._stripSlashes(req.parsedURL.pathname);
    var [entry, params] = this._getEntry(path);
    
    return (!entry) ? false : entry.security;
  }
  
  static getStrategy(path) {
    // get strategy route
    path = 'STRATEGY' + this._stripSlashes(path);
    var [entry, params] = this._getEntry(path);

    return entry;
  }
  
  static _stripSlashes(path) {
    //return path.toString().replace(/\//g, '');
    //return path.toString().replace(/\/$/, '').replace(/^\//, '');
    return path.toString().replace(/\/$/, '');
  }
 
  static _getEntry(path) {
    // compare path to stored paths
    // contact/5/view vs
    // contact/search
    // contact/:id/edit
    // contact/:id/view
    var x = path.split('?');
    var parts = x[0].split('/');

    if (parts[parts.length - 1] == '') parts.pop();
    var sch = (x.length > 1) ? x[1].split('&') : [];

    for (var i=0, mparts, good, params={}; i<routePaths.length; i++) {
      good = true;
      mparts = routePaths[i].mpath.split('/');

      if (parts.length == mparts.length) {
        for (var j=0; j<parts.length; j++) {
          if (parts[j] == mparts[j] || mparts[j].substr(0,1) == ':') {
            if (mparts[j].substr(0,1) == ':') {
              params[mparts[j].substr(1)] = parts[j];
            }
          }
          else {
            good = false;
            break;
          }
        }

        if (good) {
          sch.forEach(function(xy) {
            let z = xy.split('=');
            params[unescape(z[0])] = unescape(z[1]);
          });

          return [routePaths[i].msg, params || {}];
        }
      }
    }

    return [false, false];
  }
}

class RouterMessage {
  constructor({method='post', app='', path='', fn='', security={}} = {}) {
    /*
      security: {
        strategies: [
          {session: {allowAnon, needCSRF}},
          {basic: {allowAnon, needCSRF}},
        ],
        redirect: ''
      }
    */
    path = path || '';

    if (!Array.isArray(path)) path = [path];
    
    this.method = method.toUpperCase();
    this.app = app;
    this.path = path;
    this.fn = fn;
    this.security = security;
    this.security.app = app;

    if (!('strategies' in this.security)) this.security.strategies = [];
    if (!('redirect' in this.security)) this.security.redirect = '';
  
    this.test();
  }
  
  test() {
    var methods = ['GET', 'POST', 'PUT', 'DELETE', 'STRATEGY'];
    var types = ['SESSION', 'BASIC'];
    var defaults = {};

    defaults.session = {
      needCSRF: true,
      allowAnon: false,
    }

    defaults.basic = {
      needCSRF: false,
      allowAnon: false,
    }
    
    for (let strategy of this.security.strategies) {
      let type = Object.keys(strategy)[0];    // session or basic

      if (types.indexOf(type.toUpperCase()) > -1) {
        for (let k in defaults[type]) {
          if (!(k in strategy)) {
            strategy[type][k] = defaults[type][k];
          }
        }
      }
      else {
        console.log(`Strategy type ${type} is not valid`);
      }
    }

    if (methods.indexOf(this.method) == -1) {
      console.log(`Invalid Method ${this.method}`);
    }

    if (!this.fn) {
      console.log(`No Function specified for ${this.method} ${this.app} ${this.path}`);
    }
    
    for (let strategy of this.security.strategies) {
      if (strategy.needCSRF && (strategy.needCSRF !== true && strategy.needCSRF !== false)) {
        console.log(`Invalid needCSRF Option for ${this.method} ${this.app} ${this.path} ${strategy}`);
      }      

      if (strategy.allowAnon && (strategy.allowAnon !== true && strategy.allowAnon !== false)) {
        console.log(`Invalid allowAnon Option for ${this.method} ${this.app} ${this.path} ${strategy}`);
      }            
    }
  }
}
    
module.exports = {
  Router,
  RouterMessage
}