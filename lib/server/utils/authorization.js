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
const DENIED = 0;
const ACCESS = 1;
const VIEW = 2;
const CREATE = 3;
const UPDATE = 4;
const DELETE = 5;
const SUPER = 9;

const authMap = new Map();
const groupMap = new Map();

class Authorization {
  constructor() {
  }

  // initialize group settings
  static initGroups() {
    this.setGroupLevel('admin', 'contacts', 'contact', 3);
  }

  // get and set group levels
  static setGroupLevel(group, app, subapp, level) {
    if (!groupMap.has(group)) groupMap.set(group, new Map());
    if (!groupMap.get(group).has(app)) groupMap.get(group).set(app, new Map());
    
    groupMap.get(group).get(app).set(subapp, level);
  }

  static getGroupLevel(group, app, subapp) {
    if (groupMap.has(group) && groupMap.get(group).has(app) && groupMap.get(group).get(app).has(subapp)) return groupMap.get(group).get(app).get(subapp);

    return DENIED;    // can't do it.
  }

  // get and set app.subapp.action levels
  static addActionLevel(app, subapp, action, level) {
    // record the level required for every app, subapp, action
    if (!authMap.has(app)) authMap.set(app, new Map());
    if (!authMap.get(app).has(subapp)) authMap.get(app).set(subapp, new Map());

    authMap.get(app).get(subapp).set(action, level);
  }

  static getActionLevel(app, subapp, action) {
    if (authMap.has(app) && authMap.get(app).has(subapp) && authMap.get(app).get(subapp).has(action)) return authMap.get(app).get(subapp).get(action);

    return SUPER;  // can't do it!
  }

  // get user (group) level for app.subapp, individual action level
  static userCanAccess(app, subapp, action, group) {
    let actionLevel = this.getActionLevel(app, subapp, action);
    let userLevel = this.getGroupLevel(group, app, subapp);

    return userLevel >= actionLevel;
  }

}

module.exports = {Authorization, DENIED, ACCESS, VIEW, CREATE, UPDATE, DELETE, SUPER};