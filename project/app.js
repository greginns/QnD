// App-wide variables
import {MVC} from '/~static/lib/client/core/mvc.js';
import addBindings from '/~static/lib/client/core/mvc-bindings.js';
import addDtBindings from '/~static/lib/client/core/mvc-datetime.js';
import addMultisel from '/~static/lib/client/core/mvc-multisel.js';
//import addDB4Functions from '/~static/lib/client/core/mvc-db4.js';

addBindings(MVC);
addDtBindings(MVC);
addMultisel(MVC);
//addDB4Functions(MVC);

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