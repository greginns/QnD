import {io} from "/static/v1/static/lib/client/core/io.js";
import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {WSDataComm, TableAccess, TableStore} from '/~static/lib/client/core/db4data.js';
import {Pages, Page, Section} from '/~static/lib/client/core/paging.js';

async function fireItUp() {
  window.DB4 = window.DB4 || {};
  window.DB4.util = window.DB4.util || {};

  const attrTypes = ['string', 'number', 'object', 'array'];

  const importBundle = async function(els, hook) {
    for (let el of els) {
      let id = el.getAttribute('bundle') || '';
      
      if (!id) {
        console.error('db4-bundle has no bundle attribute', el);
        continue;
      }

      let obj = await import(`/db4/v1/api/bundle/${id}?database=${App.database}&workspace=${App.workspace}`);

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
    const getMathAttrs = function(el) {
      let path = el.getAttribute('source') || '';
      let field = el.getAttribute('field') || '';
      let dest = el.getAttribute('dest') || '';
      let cond = el.getAttribute('condition') || '';
      let index = el.getAttribute('index') || '';
      
      return {path, field, dest, cond, index};
    };

    const testMathAttrs = function(path, field, dest) {
      let data = mvc.$readModel(path);
      let arrayProxy = data && data.isProxy || false;

      if (!path || !field || !dest) {
        console.error('Source, field, and destination are all mandatory', el);

        return false;
      }

      if (!arrayProxy || !Array.isArray(data)) {
        console.error(`Source ${path} is not a model Array`);

        return false;
      }

      return true;
    };

    const getAST = function(cond) {
      let ast;

      if (cond) {
        try {
          ast = mvc._expressionTester(cond);
        }
        catch(err) {
          console.error(err, el);
          return false;
        }
      }

      return ast;
    };

    // process db4-math-sum tags
    for (let el of mel.querySelectorAll('db4-math-sum')) {
      let {path, field, dest, cond, index} = getMathAttrs(el);

      if (!testMathAttrs(path, field, dest)) continue;
  
      if (cond && !index) index = '$index';
      let ast = getAST(cond);
      if (ast === false) return;

      async function mathSum() {
        // gets executed on model change, and initially
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
      mvc._addProxyFunction(path, mathSum);
      mvc._addProxyFunction(path + '.length', mathSum);
  
      mathSum();    
    }

    // process db4-math-avg tags
    for (let el of mel.querySelectorAll('db4-math-avg')) {
      let {path, field, dest, cond, index} = getMathAttrs(el);

      if (!testMathAttrs(path, field, dest)) continue;
  
      if (cond && !index) index = '$index';
      let ast = getAST(cond);
      if (ast === false) return;

      async function mathAvg() {
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
      mvc._addProxyFunction(path, mathAvg);
      mvc._addProxyFunction(path + '.length', mathAvg);
  
      mathAvg();    
    }    

    // process db4-math-min tags
    for (let el of mel.querySelectorAll('db4-math-min')) {
      let {path, field, dest, cond, index} = getMathAttrs(el);

      if (!testMathAttrs(path, field, dest)) continue;
  
      if (cond && !index) index = '$index';
      let ast = getAST(cond);
      if (ast === false) return;

      async function mathMin() {
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
      mvc._addProxyFunction(path, mathMin);
      mvc._addProxyFunction(path + '.length', mathMin);
  
      mathMin();    
    }    

    // process db4-math-max tags
    for (let el of mel.querySelectorAll('db4-math-max')) {
      let {path, field, dest, cond, index} = getMathAttrs(el);

      if (!testMathAttrs(path, field, dest)) continue;
  
      if (cond && !index) index = '$index';
      let ast = getAST(cond);
      if (ast === false) return;

      async function mathMax() {
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
      mvc._addProxyFunction(path, mathMax);
      mvc._addProxyFunction(path + '.length', mathMax);
  
      mathMax();    
    }    
  }

  // module
  //  page
  //    section
  let mel = document.querySelector('db4-module');
  // main level
  // - common data
  // - bundle

  Module.baseURL = location.pathname.split('/')[1]; 
  Module.startPage = mel.getAttribute('start') || '';

  // look for main bundles
  let els = Array.from(mel.children).filter(function(el) {
    return el.matches('db4-bundle');
  })

  importBundle(els, App.MVC.prototype);

  // tables
  let tels = mel.querySelectorAll('db4-table');
  let ws;

  if (tels.length > 0) {
    let url = App.url.split('//');
    ws = new WSDataComm(url[1]);
  }

  for (let tel of tels) {
    let uuid = tel.getAttribute('table') || '';
    let load = tel.hasAttribute('load');

    if (!uuid) {
      console.error('db4-table requires a table attribute');
      continue;
    }

    Module.data[uuid] = new TableAccess(uuid);
    Module.table[uuid] = new TableStore({accessor: Module.data[uuid]});
    ws.addTable(uuid);

    if (load) Module.table[uuid].getAll();
  }

  if (ws) ws.start();

  // pages
  for (let pel of mel.querySelectorAll('db4-page')) {
    pel.style.display = 'none';

    let path = pel.getAttribute('path') || '';
    let title = pel.getAttribute('title') || '';
    let sections = [], mvc;

    for (let sel of pel.querySelectorAll('db4-section')) {
      // section stuff
      let mvcClass = sel.getAttribute('mvc') || null;

      if (mvcClass) {
        if (! (mvcClass in Module.mvcs)) {
          console.error(`${mvcClass} not in list of MVC Classes, page `, pel, 'section', sel);
          continue;
        };
  
        mvc = new Module.mvcs[mvcClass](sel);
      }

      else {
        mvc = new App.MVC(sel);
      }

      sections.push(new Section({mvc}));

      db4ModelHandler(sel, mvc);
      db4BundleHandler(sel, mvc);
      db4MathHandler(sel, mvc);
    };

    Module.pages.push(new Page({el: pel, path, title, sections}));
  };

  const pager = new Pages({root: `/${Module.baseURL}`, pages: Module.pages});

  try {
    // fire off init method in each section of each page.
    await pager.ready(Module.startPage);   // default page
  }
  catch(e) {
    console.log('FAILURE TO LAUNCH');
    console.log(e)
  }
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
    let database = App.database;
    let workspace = App.workspace;
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
};

const db4init = async function() {
  setupLogin();

  // do we need to login?
  let res = await io.get({}, App.url + '/db4/v1/login/test');

  if (res.status == 200) {
    fireItUp();
  }
};

export {db4init};