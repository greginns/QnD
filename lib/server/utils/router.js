const root = process.cwd();
const {ResponseMessage} = require(root + '/lib/server/utils/messages.js');

//var routePaths = []
var routeList = new Map();

class Router {
  constructor() {
  }

  static add(msg) {
    // routeList: Map(method: Map(app: Map(version: Map(path: RouteMessage))));
    if (!routeList.has(msg.method)) routeList.set(msg.method, new Map());
    
    let apps = routeList.get(msg.method);
    if (!apps.has(msg.app)) apps.set(msg.app, new Map());

    let versions = apps.get(msg.app);
    if (!versions.has(msg.version)) versions.set(msg.version, new Map());

    let paths = versions.get(msg.version);

    for (let path of msg.path) {
      paths.set(this._stripSlashes(path), msg);
    }  

    //for (let p of msg.path) {
    //  routePaths.push({mpath: msg.method + '/' + msg.app + ((msg.version) ? '/' + msg.version : '') + this._stripSlashes(p), msg});
    //}
  }

  static async go(req, res) {
    var path = req.method + this._stripSlashes(req.parsedURL.pathname);
    var [entry, params] = this._getEntry(path);
console.log(path)

    if (!entry) {
      return new ResponseMessage({data: '', status: 404, ct: 'text/plain', err: new Error('No 404 page found')});
    }

    req.params = params;
    
    return await entry.fn(req, res);
  }

  static getSecurity(req) {
    // get security for a route
    let path = req.method + this._stripSlashes(req.parsedURL.pathname);
    let [entry, params] = this._getEntry(path);

    return (!entry) ? false : entry.security;
  }
  
  static getStrategy(path) {
    // get strategy route
    path = 'STRATEGY' + this._stripSlashes(path);
    let [entry, params] = this._getEntry(path);

    return entry;
  }
  
  static _stripSlashes(path) {
    return path.toString().replace(/\/$/, '');
  }
 
  static _getEntry(path) {
    // compare path to stored paths
    // contact/5/view vs
    // contact/search
    // contact/5/edit (has priority over /:id/edit)
    // contact/:id/edit
    // contact/:id/view
    const pathSearch = path.split('?');
    const parts = pathSearch[0].split('/');
    var sch = [], params = {};

    if (parts[parts.length - 1] == '') parts.pop();               // in case route ended in /
    if (pathSearch.length > 1) sch = pathSearch[1].split('&');    // get search portion.

    const method = parts[0], app = parts[1], version = parts[2];
    var pparts = parts.slice(3);
    if (pparts.length == 0) pparts = [''];

    const storedPaths = routeList.get(method).get(app).get(version);    // all the paths for method, app, version as a Map
    const possiblePaths = [];

    for (var [spath, rmsg] of storedPaths) {   // iterate over paths Map [key, value (routerMsg)]
      spath = spath.substr(1);

      let good = true;
      let sparts = spath.split('/');

      if (sparts.length == pparts.length) {
        let varCount = 0;

        for (let j=0; j<sparts.length; j++) {
          if (sparts[j] != pparts[j] && sparts[j].substr(0,1) != ':') {
            good = false;
            break;
          }

          if (sparts[j].substr(0,1) == ':') varCount++;
        }

        if (good) {
          possiblePaths.push([spath, rmsg, varCount]);
        }
      }
    }

    if (possiblePaths.length > 0) {
      // rank possibles by fewest variables
      possiblePaths.sort(function(a,b) {
        return (a[2] < b[2]) ? -1 : a[2] > b[2] ? 1 : 0;
      })

      // get variables, if any, from winning entry
      let sparts = possiblePaths[0][0].split('/'); 

      for (var j=0; j<sparts.length; j++) {
        if (sparts[j].substr(0,1) == ':') {
          params[sparts[j].substr(1)] = pparts[j];
        }
      }

      // add any query vars to params
      sch.forEach(function(xy) {
        let z = xy.split('=');
        params[z[0]] = z[1];
      });

      //console.log('GUESS:',possiblePaths[0][1], params)
      return [possiblePaths[0][1], params];
    }

/*
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
            params[z[0]] = z[1];
          });

          return [routePaths[i].msg, params || {}];
        }
      }
    }
*/
    return [false, false];
  }
}

class RouterMessage {
  constructor({method='post', app='', version='v0', path='', fn='', security={}} = {}) {
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
    this.version = version;
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
    var stgTypes = ['SESSION', 'BASIC'];
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

      if (stgTypes.indexOf(type.toUpperCase()) > -1) {
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