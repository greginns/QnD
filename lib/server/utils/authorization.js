// maintain roles, and auth levels
/*
    priv levels of each action          User Priv Level
    contacts, contact                   UPDATE    CREATE
    contactPage       ACCESS            allowed   allowed
    getMany           VIEW              allowed   allowed
    getOne            VIEW              allowed   allowed  
    create            CREATE            allowed   denied
    update            UPDATE            allowed   denied
    delete            DELETE            denied    denied
*/
const root = process.cwd();

const usergroups = require(root + '/usergroups.json');

const DENIED = -1;
const OPEN = 0;
const ACCESS = 1;
const VIEW = 2;
const CREATE = 3;
const UPDATE = 4;
const DELETE = 5;
const SUPER = 9;

const authMap = new Map();
//const groupMap = new Map();

class Authorization {
  constructor() {
  }

  static getGroupLevel(group, app, subapp) {
    if (group in usergroups && app in usergroups[group] && subapp in usergroups[group][app]) return usergroups[group][app][subapp];

    return DENIED;    // can't do it.
  }

  // get and set app.subapp.action levels
  static addActionLevel(app, version, subapp, action, level) {
    // record the level required for every app, version, subapp, action
    if (!authMap.has(app)) authMap.set(app, new Map());
    if (!authMap.get(app).has(version)) authMap.get(app).set(version, new Map());
    if (!authMap.get(app).get(version).has(subapp)) authMap.get(app).get(version).set(subapp, new Map());

    authMap.get(app).get(version).get(subapp).set(action, level);
  }

  static getActionLevel(app, version, subapp, action) {
    if (authMap.has(app) && authMap.get(app).has(version) && authMap.get(app).get(version).has(subapp) && authMap.get(app).get(version).get(subapp).has(action)) return authMap.get(app).get(version).get(subapp).get(action);

    return SUPER;  // can't do it!
  }

  // get user (group) level for app.subapp, individual action level
  static canUserAccess(app, version, subapp, action, group) {
    let actionLevel = this.getActionLevel(app, version, subapp, action);
    let userLevel = this.getGroupLevel(group, app, subapp);

    return (userLevel >= actionLevel) || (actionLevel == OPEN);
  }
}

module.exports = {Authorization, DENIED, ACCESS, VIEW, CREATE, UPDATE, DELETE, SUPER};