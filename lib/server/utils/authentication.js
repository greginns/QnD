// save, retrieve authentication routines.  Each app can have its own set of authentication rtns
// authApps(Map: method(Map: function))

const authApps = new Map();

class Authentication {
  constructor() {
  }

  static add(app, method, fn) {
    if (!authApps.has(app)) authApps.set(app, new Map());

    authApps.get(app).set(method, fn);
  }

  static get(app, method) {
    if (authApps.has(app) && authApps.get(app).has(method)) return authApps.get(app).get(method);

    return false;
  }
}

module.exports = {Authentication};