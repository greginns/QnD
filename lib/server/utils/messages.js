class TravelMessage {
  constructor({data={}, type='json', status=200, err=null, message='', cookies=[]} = {}) {
    // use data for json
    // use message for text
    this.data = data;
    this.type = type;
    this.status = status;       // HTTP status
    this.message = message;
    this.cookies = cookies;
    
    // error
    this.err = err;             // Error class
  }
  
  isBad() {
    return this.status != 200 || this.err;
  }
  
  isGood() {
    return this.status == 200 && !this.err;
  }

  toResponse() {
    // ideally send back error messages as {message: message, errors: {}}
    var status = (this.err) ? this.err.status || this.status || 500 : this.status || 500;
    var cookies = this.cookies;
    var data = this.data;
    var encoding = null;
    var ct;

    if (status == 200 || (status == 400 && this.data)) {
      if (this.type == 'json') {
        data = JSON.stringify(data);
        ct = 'application/json';
      }
      else if (this.type == 'text') {
        ct = 'text/plain';
      }
      else if (this.type == 'html') {
        ct = 'text/html';
      }
      else if (this.type == 'js' || this.type == 'mjs') {
        ct = 'application/javascript';
      }
      else if (this.type == 'css') {
        ct = 'text/css; charset=utf-8';
      }
      else if (this.type == 'icon') {
        ct = 'image/x-icon';
        encoding = 'binary';
      }
      else {
        ct = 'text/plain';
      }              
    }
    else {
      data = (this.err && this.err.message) ? this.err.message : (this.message) ? this.message : '';
      ct = 'text/plain';   
      cookies = []; 
    }

    return new ResponseMessage({data, status, ct, encoding, cookies});
  }
}

// 200 is all good, data is whatever.
// 400 is not all good:  
//  two sources: 
//    if (tm.err) data is text error message
//    else data is json data (supplied)
// all others are text errors.  

class ResponseMessage {
  constructor({data='', status=200, ct='text/plain', encoding=null, err='', cookies=[]} = {}) {
    this.data = data;
    this.status = status;
    this['Content-Type'] = ct;
    this.encoding = encoding;
    this.err = err;
    this.cookies = cookies;
  }
/*  
  convertFromTravel(tm) {
    this.status = (tm.err) ? tm.err.status || tm.status || 500 : tm.status || 500;

    if (this.status == 200 || (this.status == 400 && !tm.err)) {
      this.status = tm.status;
      this.cookies = tm.cookies;
      
      if (tm.type == 'json') {
        this.data = JSON.stringify(tm.data);
        this['Content-Type'] = 'application/json';
      }
      else if (tm.type == 'text') {
        this.data = tm.data;
        this['Content-Type'] = 'text/plain';
      }
      else if (tm.type == 'html') {
        this.data = tm.data;
        this['Content-Type'] = 'text/html';
      }
      else if (tm.type == 'icon') {
        this.data = tm.data;
        this['Content-Type'] = 'image/x-icon';
        this.encoding = 'binary';
      }
      else {
        this.data = tm.data;
        this['Content-Type'] = 'text/plain';
      }              
    }
    else {
      this.data = tm.err.message;
      this['Content-Type'] = 'text/plain';    
    }
  }
*/  
}

class SendMessage {
  constructor({headers={}, body=null, options={}, type='json'} = {}) {
    this.headers = headers;
    this.body = body;
    this.options = options;
    this.type = type;
  }

  prep() {
    // convert message to 'ready to send' format
    let ct = 'text/plain';
    let headers = SendMessage._copy(this.headers);
    let body = SendMessage._copy(this.body);
    let options = SendMessage._copy(this.options);

    if ('url' in options) {
      // convert url to individual options
      if (options.url.substr(0,4) != 'http') options.url = 'https://' + options.url;
  
      let url = new URL(options.url);
  
      options.protocol = url.protocol;
      options.hostname = url.hostname;
      options.port = url.port || '443';
      options.path = url.pathname;
  
      if (url.search) options.path += ('?' + url.search);
  
      delete options.url;
    }

    if (!('method' in options)) options.method = 'POST';
    
    if (this.type == 'json') {
      body = JSON.stringify(body);
      ct = 'application/json';
    }

    if (options.method == 'POST' || options.method == 'PUT') {
      headers['Content-Type'] = ct;
      //headers['Content-Length'] = Buffer.byteLength(body);
      // https://nodejs.org/api/http.html#http_http_request_url_options_callback
      // Sending a 'Content-Length' header will disable the default chunked encoding.
    }
    else {
      body = null;
    }

    options.headers = headers;

    return {body, options};
  }

  static _copy(x) {
    return JSON.parse(JSON.stringify(x));
  } 
} 

class SendResponse {
  constructor({data={}, headers={}, status=200, err=null} = {}) {
    this.data = data;
    this.headers = headers;
    this.status = status;
    this.err = err;

    // status 999 = error
  }
}

module.exports = {
  TravelMessage,
  ResponseMessage,
  SendMessage,
  SendResponse,
}