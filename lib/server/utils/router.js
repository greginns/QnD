const root = process.cwd();

const {TravelMessage, ResponseMessage} = require(root + '/lib/server/utils/messages.js');
const {Authorization, DENIED} = require(root + '/lib/server/utils/authorization.js');
const {Rewrite} = require(root + '/lib/server/utils/rewrite.js');
const {VIEW, CREATE, UPDATE, DELETE} = require(root + '/lib/server/utils/authorization.js');
const {urlQueryParse} = require(root + '/lib/server/utils/url.js');

const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const routeMap = new Map();

class Router {
  constructor() {
  }

  static add(msg) {
    // save authorizations
    if (msg.app && msg.version && msg.subapp && msg.id) {
      Authorization.addActionLevel(msg.app, msg.version, msg.subapp, msg.id, msg.level || DENIED);
    }
    else {
      console.log("MISSING ROUTE INFO", msg.path, msg.app || 'APP', msg.version || 'VERSION', msg.subapp || 'SUBAPP', msg.id || 'ID');
    }

    // method app/version/path
    // routeMap: Map(method: Map(app: Map(version: Map(subapp: Map(path: RouteMessage))));
    if (!routeMap.has(msg.method)) routeMap.set(msg.method, new Map());
    
    let apps = routeMap.get(msg.method);
    if (!apps.has(msg.app)) apps.set(msg.app, new Map());

    let versions = apps.get(msg.app);
    if (!versions.has(msg.version)) versions.set(msg.version, new Map());

    let subapps = versions.get(msg.version);
    if (!subapps.has(msg.subapp)) subapps.set(msg.subapp, new Map());

    let paths = subapps.get(msg.subapp);

    // save paths, and setup rewrites
    for (let path of msg.path) {
      path = this._stripSlashes(path);

      paths.set(path, msg);

      if (msg.rewrite) {
        Rewrite.add(path, `/${msg.app}/${msg.version}/${msg.subapp}${path}`);
      }
    }
  }

  static async go(req, res) {
    let path = req.method + this._stripSlashes(req.parsedURL.pathname);
    let [entry, params] = this._getEntry(path);

    if (!entry) {
      return new ResponseMessage({data: '', status: 404, ct: 'text/plain', err: new Error('No 404 page found')});
    }

    req.params = params;
    
    return await entry.fn(req, res);
  }
/*
  static getSecurity(req) {
    // get security for a route
    let path = req.method + this._stripSlashes(req.parsedURL.pathname);
    let [entry, params] = this._getEntry(path);

    return (!entry) ? false : entry.security;
  }
*/
  static getRouteInfo(req) {
    // get role info for a route
    let path = req.method + this._stripSlashes(req.parsedURL.pathname);
    let [entry, params] = this._getEntry(path);

    return (!entry) ? false : entry;
  }

  static getRoutes(app, version) {
    const routes = [];

    for (let method of methods) {
      if (routeMap.has(method)) {
        if (routeMap.get(method).has(app)) {
          if (routeMap.get(method).get(app).has(version)) {
            routes.push(routeMap.get(method).get(app).get(version));
          }
        }
      }
    }

    return routes;
  }
  
  static list(app) {
    console.log(routeMap.get('GET').get(app))
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
    let storedPaths;
    let sch = [], params = {}, pparts;

    if (parts[parts.length - 1] == '') parts.pop();               // in case route ended in /
    if (pathSearch.length > 1) sch = pathSearch[1].split('&');    // get search portion.

    const method = parts[0], app = parts[1], version = parts[2], subapp = parts[3];

    pparts = parts.slice(4);
    if (pparts.length == 0) pparts = [''];

    if (routeMap.has(method) && routeMap.get(method).has(app) && routeMap.get(method).get(app).has(version) && routeMap.get(method).get(app).get(version).has(subapp)) {
      storedPaths = routeMap.get(method).get(app).get(version).get(subapp);    // all the paths for method, app, version, subapp as a Map
    }
    else {
      return [false, false];
    }
    
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

    return [false, false];
  }
}

class RouterMessage {
  constructor({method='post', app='', subapp='', version='v0', path='', id='', level=0, desc='', input={}, rewrite=false, inAPI=true, apiInfo={}, fn='', security={}} = {}) {
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
    this.subapp = subapp;
    this.version = version;
    this.path = path;
    this.id = id;
    this.level = level;
    this.desc = desc;
    this.input = input;
    this.apiInfo = apiInfo;
    this.rewrite = rewrite;
    this.inAPI = inAPI || false;
    this.fn = fn;
    this.security = security;
    this.security.app = app;

    if (!('strategies' in this.security)) this.security.strategies = [];
    if (!('redirect' in this.security)) this.security.redirect = '';
  
    this.test();
  }
  
  test() {
    const stgTypes = ['SESSION', 'BASIC'];
    const defaults = {};

    defaults.session = {
      needCSRF: true,
      allowAnon: false,
    }

    defaults.basic = {
      needCSRF: false,
      allowAnon: false,
    }

    defaults.apiInfo = {
      type: 'json',
      desc: 'Unknown',
      schema: '',
    }
    
    for (let strategy of this.security.strategies) {
      let type = Object.keys(strategy)[0];    // session or basic

      if (stgTypes.indexOf(type.toUpperCase()) > -1) {
        for (let k in defaults[type]) {
          if (!(k in strategy[type])) {
            strategy[type][k] = defaults[type][k];
          }
        }
      }
      else {
        console.log(`Strategy type ${type} is not valid`);
      }
    }

    if (methods.indexOf(this.method) == -1) {
      console.log(`Invalid Method ${this.method}, ${this.app}`);
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

    if (this.apiInfo.schema) {
      let anArray = Array.isArray(this.apiInfo.schema);
      let name = (anArray) ? this.apiInfo.schema[0].name : this.apiInfo.schema.name;

      if (!this.desc) {
        switch (this.method) {
          case 'GET':
            this.desc = (anArray) ? 'Get many ' + name + 's' : 'Get one ' + name;
            break;
          case 'POST':
            this.desc = 'Create ' + name + ' entry';
            break;
          case 'PUT':
            this.desc = 'Update ' + name + ' entry';
            break;
          case 'DELETE':
            this.desc = 'Delete ' + name + ' entry';
            break;
        }
      }

      if (!this.apiInfo.desc) {
        // response description
        try {
          this.apiInfo.desc = (anArray) ? 'Array of ' + name + ' objects' : 'One ' + name + ' object';
        }
        catch(err) {
          console.log('Router Message', this.apiInfo.schema, err);
        }
      }
    }

    // Response defaults
    for (let r in defaults.apiInfo) {
      if (! (r in this.apiInfo)) {
        this.apiInfo[r] = defaults.apiInfo[r];
      }
    }
  }
}

class Routes {
  // Create the 5 basic routes for every model
  // Subclass this for deviations
  constructor({app='', subapp='', version='v1', model={}, services={}} = {}) {
    this.app = app;
    this.subapp = subapp;
    this.version = version;
    this.model = model;
    this.services = services;

    this.setup();
  }

  setup() {
    this.getMany();
    this.getOne();
    this.create();
    this.update();
    this.delete();
  }

  getMany() {
    Router.add(new RouterMessage({
      method: 'get',
      app: this.app,
      subapp: this.subapp,
      version: this.version,
      path: `/`, 
      id: 'getMany',
      level: VIEW,
      inAPI: true,
      apiInfo: {type: 'json', schema: [this.model]},
      fn: async function(req) {
        let {rec, cols, where, values, limit, offset, orderby} = urlQueryParse(req.query);
        let tm = await this.services[this.subapp].getMany({pgschema: req.TID, rec, cols, where, values, limit, offset, orderby});
    
        return tm.toResponse();
      }.bind(this),
      security: {
        strategies: [
          {session: {allowAnon: false, needCSRF: true}},
          {basic: {allowAnon: false, needCSRF: false}},
        ],
      } 
    }));
  }

  getOne() {
    Router.add(new RouterMessage({
      method: 'get',
      app: this.app,
      subapp: this.subapp,
      version: this.version,
      path: `/:id`, 
      id: 'getOne',
      level: VIEW,
      inAPI: true,
      apiInfo: {type: 'json', schema: this.model},
      fn: async function(req) {
        let id = req.params.id;
        let tm;
    
        if (!id) {
          tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
        }
        else {
          tm = await this.services[this.subapp].getOne({pgschema: req.TID, rec: {id} });
    
          if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
        }
      
        return tm.toResponse();
      }.bind(this), 
      security: {
        strategies: [
          {session: {allowAnon: false, needCSRF: true}},
          {basic: {allowAnon: false, needCSRF: false}},
        ],
      } 
    }));
  }

  create() {
    Router.add(new RouterMessage({
      method: 'post',
      app: this.app,
      subapp: this.subapp,
      version: this.version,
      path: `/`, 
      id: 'create',
      level: CREATE,
      inAPI: true,
      apiInfo: {type: 'json', schema: this.model},
      fn: async function(req) {
        let tm = await this.services[this.subapp].create({pgschema: req.TID, rec: req.body[this.subapp] || {} });
    
        return tm.toResponse();
      }.bind(this), 
      security: {
        strategies: [
          {session: {allowAnon: false, needCSRF: true}},
          {basic: {allowAnon: false, needCSRF: false}},
        ],
      } 
    }));
  }

  update() {
    Router.add(new RouterMessage({
      method: 'put',
      app: this.app,
      subapp: this.subapp,
      version: this.version,
      path: `/:id`, 
      id: 'update',
      level: UPDATE,
      inAPI: true,
      apiInfo: {type: 'json', schema: this.model},
      fn: async function(req) {
        let id = req.params.id;
        let tm;
    
        if (!id) {
          tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
        }
        else {
          tm = await this.services[this.subapp].update({pgschema: req.TID, id, rec: req.body[this.subapp] || {} });
    
          if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
        }
    
        return tm.toResponse();
      }.bind(this), 
      security: {
        strategies: [
          {session: {allowAnon: false, needCSRF: true}},
          {basic: {allowAnon: false, needCSRF: false}},
        ],
      } 
    }));
  }

  delete() {
    Router.add(new RouterMessage({
      method: 'delete',
      app: this.app,
      subapp: this.subapp,
      version: this.version,
      path: `/:id`, 
      id: 'delete',
      level: DELETE,
      inAPI: true,
      apiInfo: {type: 'json', schema: this.model},
      fn: async function(req) {
        let id = req.params.id;
        let tm;
    
        if (!id) {
          tm = new TravelMessage({data: {message: 'Invalid ID'}, status: 400});
        }
        else {
          tm = await this.services[this.subapp].delete({pgschema: req.TID, id});
    
          if (tm.isGood() && tm.data.length == 0) tm = new TravelMessage({status: 404});
        }
    
        return tm.toResponse();
      }.bind(this), 
      security: {
        strategies: [
          {session: {allowAnon: false, needCSRF: true}},
          {basic: {allowAnon: false, needCSRF: false}},
        ],
      } 
    }));
  }
}
    
module.exports = {
  Router,
  RouterMessage,
  Routes
}