(function() {
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

    _fetch: function({method='GET', url = '', data = '', type='text'} = {}) {
      var orig = {method, url, data, type};
      var ret = {data: '', 'Content-type': '', status: 200};
      var init = {headers: {'X-CSRF-TOKEN': ''}};

      init.method = method;
      init.credentials = 'include';
      
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
          ret['Content-type'] = resp.headers.get("Content-Type");
          
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
              if (ret['Content-type'].indexOf('json') == -1) throw ret.data;  // just a text message
              break;
            case 401:
              // get login
  console.log('401 re-login')            
              ret = await io._login(orig);
              break;
            default:
              throw ret.data;
          }

          resolve(ret);
        })
        .catch(function(err) {
          ret.data = {errors: {message: err}};
          ret.status = 500;

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
    
    delete: function(params, url) {
      return io._fetch({method: 'DELETE', url: url, data: params, type: 'json'});
    }
  }

  io.post({}, 'https://roam3.adventurebooking.com:3011/contacts/v1/contact')
  .then(function(res) {
    console.log(res)
  })
  .catch(function(err) {
    console.log(err)
  })

})();