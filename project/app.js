// App-wide variables
import {MVC} from '/~static/lib/client/core/mvc.js';
import addBindings from '/~static/lib/client/core/mvc-bindings.js';
import addDtBindings from '/~static/lib/client/core/mvc-datetime.js';
import addDB4Functions from '/~static/lib/client/core/mvc-db4.js';

addBindings(MVC);
addDtBindings(MVC);
addDB4Functions(MVC);

MVC._addBinding('multiselect', function(el) {
  // make sure when input array is set that the data list array has checked = true for initial choices
  let group = el.querySelector('div.input-group');
  let inp = group.querySelector('input');
  let drop = el.querySelector('div.dropdown-menu');
  let srcPath = inp.getAttribute('data-source');
  let valPath = inp.getAttribute(MVC.prefix + '-value');

  // set initial checked values
  if (valPath && srcPath) {
    let srcData = this.$readModel(srcPath) || [];
    let valData = this.$readModel(valPath) || [];

    for (let entry of srcData) {
      let x = valData.indexOf(entry.value);
      entry.checked = x > -1;
    }
  }

  const lostFocus = function(ev) {
    // off of the dropdown?
    if (ev.relatedTarget) {
      let target = ev.relatedTarget;
      if (target == drop) return;

      if (target.tagName != 'INPUT' || target.closest('div.dropdown-menu') != drop) {
        action(ev);
        return;
      }
    }
  }

  const external = function(ev) {
    // click somewhere.  If not on dropdown, then close
    if (!ev.target.closest('div.dropdown-menu')) {
      action(ev);
    }
  }

  const action = function(ev) {
    if (drop.classList.contains('show')) {
      // dropdown is showing, close
      inp.disabled = false;        
      drop.classList.remove('show');
      document.removeEventListener('click', external);
    }
    else {
      // dropdown not showing, open
      inp.disabled = true;
      drop.classList.add('show');
      document.addEventListener('click', external);

      let cbs = drop.querySelectorAll('input');
      cbs[0].focus();
    }

    ev.stopPropagation();      
  }

  group.addEventListener('click', action);
  drop.addEventListener('focusout', lostFocus);
  inp.addEventListener('focus', action);
})

MVC._addProtoMethod('$checked2text', function(obj) {
  let dataPath = obj.args[0];
  let destPath = obj.args[1];
  let data = this.$readModel(dataPath);
  let text = [];

  for (let entry of data) {
    if (entry.checked) text.push(entry.value);
  }

  this.$updateModel(destPath, text);
});

MVC._addFilter('checked2text', function(el, value) {
  // value will be the chosen values from {text, value}
  // data is overall list of {text, value}
  let src = el.getAttribute('data-source') || null;
  let text = [];

  if (src && value.length) {
    let data = this.$readModel(src) || [];
    let keys = data.map(function(x) {   // list of values
      return x.value;
    })

    for (let val of value) {
      let x = keys.indexOf(val);

      if (x > -1) text.push(data[x].text);
    }
  }

  return text.join(', ');
});

const App = {};

App.config = {};
App.utils = {};
App.dateFormat = 'YYYY-MM-DD';
App.timeFormat = 'h:mm A';
App.USER = {};
App.CSRF = '';
App.reLogin = '';

App.url = 'https://roam3.adventurebooking.com:3011';

MVC.dateFormat = App.dateFormat;
MVC.timeFormat = App.timeFormat;

App.config.ee = {
  "email": "greg@reservation-net.com",
  "name": "Greg Miller",
  "apikey": "",
  "domain": "https://api.elasticemail.com/v2/"
},

App.utils.ee = {
  sendOne: async function({config={}, obj={}} = {}) {
    // http://api.elasticemail.com/public/help#Email_Send

    let params = {
      apikey: config.ee.apikey,
      charset: 'utf-8',
      encodingType:'0',
      isTransactional: true
    };

    let url = config.ee.domain + 'email/send';
    let attachments = [], query = [], init = {}, formData = new FormData();

    if ('attachments' in obj) {
      obj.attachments.forEach(function(file) {
        formData.append(file.name, file);
      });

      delete obj.attachments;
    }
		
		params = Object.assign(params, obj);
		
		Object.keys(params).forEach(function(k) {
			query.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
		})
		
		url += '?' + query.join('&');
		init.method = 'POST';
		
		if (attachments.length > 0) {
      init.headers = {};
      //init.headers['Content-Type'] = "multipart/form-data";  *** browser will add it, with a boundary
      init.body = formData;
		}
		
		let resp = await fetch(url, init);
		
		if (resp.status == 200) {
      return await resp.json();  
		}
		else {
      return {success: false, error: 'Comm Error'};
		}		
  }, 
  
  getStatus: async function({config={}, obj={}} = {}) {
    let params = {
      apikey: config.ee.apikey,
    };

    let url = config.ee.domain + 'email/getstatus';  
    let query = [], init = {};  

    params = Object.assign(params, obj);

		Object.keys(params).forEach(function(k) {
			query.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
		})
		
		url += '?' + query.join('&');
		init.method = 'GET';

		let resp = await fetch(url, init);
		
		if (resp.status == 200) {
      return await resp.json();  
		}
		else {
      return {success: false, error: 'Comm Error'};
		}		
  }
};

App.MVC = class extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model._params = {};
    this.model._badMessage = '';
    this.model._errors = {};
  }

  async inView(params) {
    this.model._params = params;
  }
};

export {App};