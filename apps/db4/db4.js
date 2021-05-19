import {io} from "/static/v1/static/lib/client/core/io.js";
import {App} from '/~static/project/db4app.js';

const database = '{{database}}';
const workspace = '{{workspace}}';

class Db4MVC extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model._params = {};
    this.model._badMessage = '';
    this.model._errors = {
      app: {},
      message: ''
    };

    this.model.temp = [
      {name: 'Greg', 'qty': 5},
      {name: 'Fred', 'qty': 10},
      {name: 'Wilma', 'qty': 69}
    ];

    this.model.total = 0;

    this.model.test = 'New MVC Test'
/*
    setTimeout(function() {
      console.log(this._watchedPaths)
    }.bind(this), 5000)
*/    
  }

  async ready() {
    return new Promise(async function(resolve) {
      resolve();
    }.bind(this));
  }
  
  async inView(params) {
    this.model._params = params;
  }

  outView() {
    return true;  
  }

  showTemp() {
    this.model.temp[0].qty = 99;

    setTimeout(function() {
      this.model.temp.pop();
      console.log(this._watchedPaths)
    }.bind(this), 1000)
  }

  stars(ev) {
    return '*'.repeat(ev.args[0]);
  }
};

async function fireItUp() {
  window.DB4 = window.DB4 || {};
  window.DB4.util = window.DB4.util || {};

  const attrTypes = ['string', 'number', 'object', 'array'];

  const importBundle = async function(els, hook) {
    for (let el of els) {
      let id = el.getAttribute('id') || '';
      
      if (!id) {
        console.error('db4-bundle has no id', el);
        continue;
      }

      let obj = await import(`/db4/v1/api/bundle/${id}?database=${database}&workspace=${workspace}`);

      for (let type in obj.bundle) {
        for (let fn in obj.bundle[type]) {
          if (type == 'CE') {
            hook[fn] = obj.bundle.CE[fn];
          }
          else if (type == 'UT') {
            window.DB4.util[fn] = obj.bundle.UT[fn];
          }
        }
      }
    }
  };

  const mainBundleHandler = async function() {
    let els = document.querySelectorAll('body > db4-bundle');

    if (els.length > 0) {
      importBundle(els, App.MVC.prototype);
    }
  }

  const db4BundleHandler = async function(mel, mvc) {
    // process db4-bundle tags
    let els = mel.querySelectorAll('db4-bundle');

    if (els.length > 0) {
      await importBundle(els, mvc);
    }
  };

  const db4ModelHandler = function(mel, mvc) {
    // process db4-model tags
    for (let el of mel.querySelectorAll('db4-model')) {
      let name = el.getAttribute('name') || '';
      let type = el.getAttribute('type') || 'string';
      let initial = el.getAttribute('initial') || '';
      
      if (!name) {
        console.error('db4-model has no model name', el);
        continue;
      }

      if (attrTypes.indexOf(type) == -1) {
        console.error('db4-model type must be ' + attrTypes.join(' or '), el);
        continue;
      }

      mvc.model[name] = (type == 'object') ? {} : (type == 'array') ? [] : initial;
    }
  };

  const db4MathHandler = function(mel, mvc) {
    // process db4-math-sum tags
    for (let el of mel.querySelectorAll('db4-math-sum')) {
      let path = el.getAttribute('source') || '';
      let field = el.getAttribute('field') || '';
      let dest = el.getAttribute('dest') || '';
      let cond = el.getAttribute('condition') || '';
      let index = el.getAttribute('index') || '';
      let ast;
      let data = mvc.$readModel(path);
      let arrayProxy = data.isProxy || false;
  
      if (!path || !field || !dest) {
        console.error('Source, field, and destination are all mandatory', el);
        continue;
      }

      if (!arrayProxy || !Array.isArray(data)) {
        console.error('Source is not a model Array');
        continue;
      }

      if (cond && !index) index = '$index';

      if (cond) {
        try {
          ast = App.MVC._expressionTester(cond);
        }
        catch(err) {
          console.error(err, el);
          return;
        }
      }

      async function mathsum() {
        let data = mvc.$copy(mvc.$readModel(path));
        let sum = 0;
  
        for (let idx=0, res; idx<data.length; idx++) {
          if (cond) mvc.$updateModel(index, idx);
          
          res = (cond) ? await mvc._jsParse(null, ast) : true;
  
          try {
            if (res) sum += parseFloat(data[idx][field]) || 0;
          }
          catch(err) {};
        }
  
        mvc.$updateModel(dest, sum);
      };
  
      // bind events to array contents
      mvc._addProxyFunction(path, mathsum);
      mvc._addProxyFunction(path+'.length', mathsum);
  
      mathsum();    
    }

    // process db4-math-avg tags
    for (let el of mel.querySelectorAll('db4-math-avg')) {
      let path = el.getAttribute('source') || '';
      let field = el.getAttribute('field') || '';
      let dest = el.getAttribute('dest') || '';
      let cond = el.getAttribute('condition') || '';
      let index = el.getAttribute('index') || '';
      let ast;
      let data = mvc.$readModel(path);
      let arrayProxy = data.isProxy || false;
  
      if (!path || !field || !dest) {
        console.error('Source, field, and destination are all mandatory', el);
        continue;
      }

      if (!arrayProxy || !Array.isArray(data)) {
        console.error('Source is not a model Array');
        continue;
      }

      if (cond && !index) index = '$index';

      if (cond) {
        try {
          ast = App.MVC._expressionTester(cond);
        }
        catch(err) {
          console.error(err, el);
          return;
        }
      }

      async function mathavg() {
        let data = mvc.$copy(mvc.$readModel(path));
        let sum = 0, count = 0;
  
        for (let idx=0, res; idx<data.length; idx++) {
          if (cond) mvc.$updateModel(index, idx);
          
          res = (cond) ? await mvc._jsParse(null, ast) : true;
  
          try {
            if (res) {
              count++;
              sum += parseFloat(data[idx][field]) || 0;
            }
          }
          catch(err) {};
        }
  
        mvc.$updateModel(dest, sum/count);
      };
  
      // bind events to array contents
      mvc._addProxyFunction(path, mathavg);
      mvc._addProxyFunction(path+'.length', mathavg);
  
      mathavg();    
    }    

    // process db4-math-min tags
    for (let el of mel.querySelectorAll('db4-math-min')) {
      let path = el.getAttribute('source') || '';
      let field = el.getAttribute('field') || '';
      let dest = el.getAttribute('dest') || '';
      let cond = el.getAttribute('condition') || '';
      let index = el.getAttribute('index') || '';
      let ast;
      let data = mvc.$readModel(path);
      let arrayProxy = data.isProxy || false;
  
      if (!path || !field || !dest) {
        console.error('Source, field, and destination are all mandatory', el);
        continue;
      }

      if (!arrayProxy || !Array.isArray(data)) {
        console.error('Source is not a model Array');
        continue;
      }

      if (cond && !index) index = '$index';

      if (cond) {
        try {
          ast = App.MVC._expressionTester(cond);
        }
        catch(err) {
          console.error(err, el);
          return;
        }
      }

      async function mathmin() {
        let data = mvc.$copy(mvc.$readModel(path));
        let min = 9007199254740991;

        for (let idx=0, res; idx<data.length; idx++) {
          if (cond) mvc.$updateModel(index, idx);
          
          res = (cond) ? await mvc._jsParse(null, ast) : true;
  
          try {
            if (res) min = Math.min(min, parseFloat(data[idx][field]) || 0);
          }
          catch(err) {};
        }
  
        mvc.$updateModel(dest, min);
      };
  
      // bind events to array contents
      mvc._addProxyFunction(path, mathmin);
      mvc._addProxyFunction(path+'.length', mathmin);
  
      mathmin();    
    }    

    // process db4-math-max tags
    for (let el of mel.querySelectorAll('db4-math-max')) {
      let path = el.getAttribute('source') || '';
      let field = el.getAttribute('field') || '';
      let dest = el.getAttribute('dest') || '';
      let cond = el.getAttribute('condition') || '';
      let index = el.getAttribute('index') || '';
      let ast;
      let data = mvc.$readModel(path);
      let arrayProxy = data.isProxy || false;
  
      if (!path || !field || !dest) {
        console.error('Source, field, and destination are all mandatory', el);
        continue;
      }

      if (!arrayProxy || !Array.isArray(data)) {
        console.error('Source is not a model Array');
        continue;
      }

      if (cond && !index) index = '$index';

      if (cond) {
        try {
          ast = App.MVC._expressionTester(cond);
        }
        catch(err) {
          console.error(err, el);
          return;
        }
      }

      async function mathmax() {
        let data = mvc.$copy(mvc.$readModel(path));
        let max = -9007199254740991;
  
        for (let idx=0, res; idx<data.length; idx++) {
          if (cond) mvc.$updateModel(index, idx);
          
          res = (cond) ? await mvc._jsParse(null, ast) : true;
  
          try {
            if (res) max = Math.max(max, parseFloat(data[idx][field]) || 0);
          }
          catch(err) {};
        }
  
        mvc.$updateModel(dest, max);
      };
  
      // bind events to array contents
      mvc._addProxyFunction(path, mathmax);
      mvc._addProxyFunction(path+'.length', mathmax);
  
      mathmax();    
    }    
  }

  await mainBundleHandler();  

  for (let mel of document.querySelectorAll('[db4-mvc]')) {
    let mvc = new Db4MVC(mel);

    db4ModelHandler(mel, mvc);
    db4BundleHandler(mel, mvc);
    db4MathHandler(mel, mvc);
  };
};

const setupLogin = function() {
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
    let database = '{{database}}';
    let workspace = '{{workspace}}';
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
    
    io.post({database, workspace, username, password}, App.url + '/db4/v1/login')
    .then(function(res) {
      if (res.status == 200) {
        localStorage.setItem('db4_CSRF_token', res.data.token);
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
  
  window.QNDreLogin = loginOpen;

  // do we need to login?
  io.get({}, App.url + '/db4/v1/login/test');
};

window.onload = function() {
  fireItUp();
  setupLogin();
};