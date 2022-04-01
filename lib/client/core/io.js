const io = {
  _formatURL: function(url, params) {
    let p2 = {};

    for (let [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        p2[key] = ((typeof value === 'object' && value !== null) || Array.isArray(value)) ? JSON.stringify(value) : value;
      }
    }

    return url + '?' + new URLSearchParams(p2).toString();
  },
  
  _login: function(orig) {
    return new Promise(function(resolve, reject) {
      try {
        window.QNDreLogin({cb: function() {
          // only comes back if/when a good login
          io._fetch(orig)  // this is the original request getting re-fired
          .then(function(res) {
            if (res.status == 200 || res.status == 400) {
              resolve(res);
            }
            else {
              reject(res.data.errors.message);
            }
          })
          .catch(function(err) {
            reject(err)
          })
        }});
      }
      catch(err) {
        reject({status: 400, data: {errors: {message: 'No re-login page'}}});
        return;
      }
    })
  },
  
  _fetch: function({method='GET', url = '', data = '', type='text'} = {}) {
    let orig = {method, url, data, type};
    let ret = {data: '', 'Content-type': '', status: 200};
    let headers = {};

    if (localStorage.getItem('CSRF_token')) headers['X-CSRF-TOKEN'] = localStorage.getItem('CSRF_token');
    if (localStorage.getItem('db4_CSRF_token')) headers['X-CSRF-TOKEN-DB4'] = localStorage.getItem('db4_CSRF_token');
    if (localStorage.getItem('db4admin_CSRF_token')) headers['X-CSRF-TOKEN-DB4ADMIN'] = localStorage.getItem('db4admin_CSRF_token');
    
    let init = {headers};

    init.method = method;
    init.credentials = 'include'; //'same-origin';
    
    if (method == 'GET') {
      url = io._formatURL(url, data);
    }
    else {
      init.body = (type == 'json') ? JSON.stringify(data) : data;
    }

    switch (type) {
      case 'json':
        init.headers['Content-Type'] = 'application/json';
        break;
        
      default:
        init.headers['Content-Type'] = 'text/plain';
    }
    
    return new Promise(function(resolve) {
      fetch(url, init)
      .then(function(resp) {
        // status: 200: OK, 400: User Error, 401: Unauthorized, 404: Not Found, 413: Too large, 500: System Error
        // status 200 is json or text, 
        // status 400 can be text or json
        // rest are text (mostly for APIs in case they want a text response)
        // normalize all responses to resolved json, {errors: {message: xxx, table: {}}}
        ret.status = resp.status;
        ret['Content-type'] = resp.headers.get("Content-Type") || 'text';
        
        return (ret['Content-type'].indexOf('json') > -1) ? resp.json() : resp.text();
      })
      .then(async function(data) {
        ret.data = data;

        switch (ret.status) {
          case 200:
            break;
          case 302:
            // handed off to calling rtn
            break;
          case 400:
            //if (ret['Content-type'].indexOf('json') == -1) throw ret.data;  // just a text message
            throw ret.data;
            break;
          case 401:
            // get login
            ret = await io._login(orig);
            break;
          case 404: 
            throw 'Item Not Found [404]';
            break;
          case 500:
            throw 'Internal Server Error [500]';
          default:
            throw ret.data;
        }

        resolve(ret);
      })
      .catch(function(err) {
        ret.data = {errors: {_message: err}};
        //ret.status = 500;     keep original status.  Original was to funnel all errors to 500.

        resolve(ret);
      })      
    })
  },
  
  get: function(params, url) {
    return io._fetch({method: 'GET', url: url, data: params, type: 'json'});
  },
    
  post: function(params, url) {
    return io._fetch({method: 'POST', url: url, data: params, type: 'json'});
  },
  
  put: function(params, url) {
    return io._fetch({method: 'PUT', url: url, data: params, type: 'json'});
  },
  
  patch: function(params, url) {
    return io._fetch({method: 'PATCH', url: url, data: params, type: 'json'});
  },
  
  delete: function(params, url) {
    return io._fetch({method: 'DELETE', url: url, data: params, type: 'json'});
  },  

  test: async function() {
    let orig=''
    let ret = await io._login(orig);
    console.log(ret)
  }
}

export {io};