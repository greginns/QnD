import {MVC} from '/~static/lib/client/core/mvc.js';
import {io} from "/static/v1/static/lib/client/core/io.js";
import {App} from '/~static/lib/client/core/app.js';

class Db4MVC extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.badMessage = '';
    this.model.errors = {
      app: {},
      message: ''
    };

  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
  }

  outView() {
    return true;  
  }

  fred() {
    this.model.contact = {};
  }
}

// fire it up!
for (let mel of document.querySelectorAll('[mvc-mvc]')) {
  let mvc = new Db4MVC(mel);

  let attrTypes = ['string', 'number', 'object', 'array'];

  for (let el of mel.querySelectorAll('db4-model')) {
    let name = el.getAttribute('name') || '';
    let type = el.getAttribute('type') || 'string';
    
    if (!name) {
      console.error('db4-model has no model name');
      continue;
    }

    if (attrTypes.indexOf(type) == -1) {
      console.error('db4-model type must be ' + attrTypes.join(' or '));
      continue;
    }

    mvc.model[name] = (type == 'object') ? {} : (type == 'array') ? [] : '';
  }

  let fn = `function({a='', b='', c=0}={}) {
    console.log(a,b,c);
    console.log(this);
  }`;
  
  let func2 = new Function('return ' + fn)();

  mvc._addMethod('fuck', func2);
  mvc.fuck({a: 'greggie', b: 'jay', c: 99});
}

// LOGIN Stuff
(function() {
  const url = 'https://roam3.adventurebooking.com:3011';
  const db4_login_html = `
    <div id='db4-login-inline' style = 'position: absolute; top: 0; bottom: 0; left: 0; right: 0; background: rgba(0, 0, 0, 0.5); visibility: hidden;'>
      <div style = 'margin: 100px auto; padding: 20px; background: #fff; border: 1px solid #666; width: 300px; border-radius: 6px; box-shadow: 0 0 50px rgba(0, 0, 0, 0.5); position: relative;'>
        <div style='text-align: center; font-size: 24px; font-weight: 400'>
          DB4 Login
        </div>
        <br>
        <div>
          <input value='12345' id='db4-login-inline-username' placeholder='User ID' style = 'display: block; min-height: calc(1.5em + .75rem + 2px); padding: .375rem .75rem; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #495057; background-color: #fff; background-clip: padding-box; border: 1px solid #ced4da; -webkit-appearance: none; -moz-appearance: none; appearance: none; border-radius: .25rem;'>
        </div>
        <br>
        <div>
          <input value='herbie' type='password' id='db4-login-inline-password' placeholder='password' style = 'display: block; min-height: calc(1.5em + .75rem + 2px); padding: .375rem .75rem; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #495057; background-color: #fff; background-clip: padding-box; border: 1px solid #ced4da; -webkit-appearance: none; -moz-appearance: none; appearance: none; border-radius: .25rem;'>
        </div>
        <br>
        <div>
          <button id='db4-login-inline-submit' style = 'display: block; min-height: calc(1.5em + .75rem + 2px); padding: .375rem .75rem; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #495057; background-color: #fff; background-clip: padding-box; border: 1px solid #ced4da; -webkit-appearance: none; -moz-appearance: none; appearance: none; border-radius: .25rem; background-color: limegreen' >
            Login
          </button>
        </div>
        <br>
        <br>
        <div id='db4-login-inline-error' style='color: red'></div>
      </div>
    </div>
  `
  let callback;
  
  const key13 = function(ev) {
    if (ev.which == 13) {
      login();
    }
  };

  const login = function() {
    let database = '{{db}}';
    let workspace = '{{ws}}';
    let username = usernameEl.value;
    let password = passwordEl.value;

    errMsgEl.innerText = '';
    
    if (!username) {
      errMsgEl.innerText = 'Username is required';
      return;
    }
    
    if (!password) {
      errMsgEl.innerText = 'Password is required';
      return;
    }
    
    io.post({database, workspace, username, password}, url + '/db4/v1/login')
    .then(function(res) {
      if (res.status == 200) {
        loginClose();
        callback();
      }
      else {
        errMsgEl.innerText = res.data.errors.message;
      }
    })
    .catch(function(err) {
      alert(err.errMsg)
    })
  };

  const loginOpen = function(obj) {
    callback = obj.cb;
    popup.style.visibility = 'visible';
  };

  const loginClose = function() {
    popup.style.visibility = 'hidden';
  };

    // add login overlay/modal to body
  let db4_login_div = document.createElement('div');
  db4_login_div.innerHTML = db4_login_html;
  document.body.appendChild(db4_login_div);

  // get access to input fields
  let usernameEl = document.getElementById('db4-login-inline-username');
  let passwordEl = document.getElementById('db4-login-inline-password');
  let loginBtnEl = document.getElementById('db4-login-inline-submit');
  let errMsgEl = document.getElementById('db4-login-inline-error');
  let popup = document.getElementById('db4-login-inline');

  usernameEl.addEventListener('keyup', key13);
  passwordEl.addEventListener('keyup', key13);
  loginBtnEl.addEventListener('click', login);
  
  App.reLogin = loginOpen;
})();

/*
class Db4Table extends HTMLElement {
  constructor() {
    super();

    this._attributes = {};

    this._allowedAttributes = [
      'table',
      'model'
    ];

    this._init();
  }

  _init() {
    this._getAttributes();

    if (!this._testAttributes()) {
      alert('db4-table requires a table and model names');
      return;
    }

    this._recordTableAndModel()
  }

  _recordTableAndModel() {
    App.tableModels = App.tableModels || {};
    App.tableModels[this._attributes.table] = this._attributes.model;
    console.log(App.tableModels)
  }

  _getAttributes() {
    for (let attr of this.attributes) {
      this._attributes[attr.nodeName.toLowerCase()] = attr.nodeValue;
    }
  }

  _testAttributes() {
    for (let attr of this._allowedAttributes) {
      if (!(attr in this._attributes)) return false
    }

    return true;
  }
}
*/
/*
class Db4Model extends HTMLElement {
  constructor() {
    super();

    this._attributes = {};

    this._allowedAttributes = {
      'model': {required: true},
      'type': {required: false, values: ['object', 'array', 'string', 'number']}
    };

    this._init();
  }

  _init() {
    this._getAttributes();

    let errs = this._testAttributes();
    if (errs.length > 0) {
      alert(errs.join('\n'));

      return;
    }

    this._setupModels()
  }

  _setupModels() {
    console.log(this._attributes);

    let type = (this._attributes.type == 'object') ? {} : (this._attributes.type == 'array') ? [] : '';

    App.MVC.model[this._attributes.model] = type;
  }

  _getAttributes() {
    for (let attr of this.attributes) {
      this._attributes[attr.nodeName.toLowerCase()] = attr.nodeValue;
    }
  }

  _testAttributes() {
    let errs = [];

    if (!('model' in this._attributes)) {
      errs.push('model name is required');
    }

    if ('type' in this._attributes) {
      let type = this._attributes.type;
      let types = this._allowedAttributes.type.values;

      if (types.indexOf(type) == -1) {
        errs.push('Type must be one of ' + types.join(','));
      }
    }
    else {
      this._attributes.type = 'string';
    }

    return errs;
  }
}
*/
/*
class Db4Query extends HTMLElement {
  constructor() {
    super();
    
    this._allowedAtts = [
      'qid',
      'where',
      'query',
      'limit',
      'offset',
      'orderby',
      //'trigger',
      //'event'
    ]
    
    this._init();
  }
  
  _init() {
    this._getAttributes();
    //if (!this._testAttributes()) return;
    
    //this._setupWS();
    //this._setupTableAccess();
    //this._setupTableStore();          
  }
  
  _getAttributes() {
    this._atts = {};
    
    for (let attr of this.attributes) {
      let key = attr.nodeName.toLowerCase();

      if (this._allowedAtts.indexOf(key) == -1) {
        console.warn(`Invalid ${key} attribute in `, this)
      }
      else {
        this._atts[key] = attr.nodeValue;  
      }
    }
  }
  
  connectedCallback() {
  }        
}
*/

//customElements.define('db4-table', Db4Table);
//customElements.define('db4-model', Db4Model);
//customElements.define('db4-query', Db4Query);