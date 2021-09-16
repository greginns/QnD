const querystring = require('querystring');

class TravelMessage {
  constructor({data={}, type='json', status=200, headers={}, err=null, message='', cookies=[]} = {}) {
    // use data for json
    // use message for text
    this.data = data;
    this.type = type;
    this.status = status;       // HTTP status
    this.headers = headers;
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
    let status = (this.err) ? this.err.status || this.status || 500 : this.status || 500;
    let cookies = this.cookies;
    let data = this.data;
    let encoding = null;
    let ct;

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
      else if (this.type == 'png') {
        ct = 'image/png';
        encoding = 'binary';
      }      
      else if (this.type == 'pdf') {
        ct = 'application/pdf';
        encoding = 'binary';
        this.headers['Content-Disposition'] = 'attachment; filename="' + this.filename;
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

    this.headers['Content-Type'] = ct;

    return new ResponseMessage({data, status, headers: this.headers, encoding, cookies});
  }
}

// 200 is all good, data is whatever.
// 204 No content.  Usually CORS request
// 400 is not all good:  
//  two sources: 
//    if (tm.err) data is text error message
//    else data is json data (supplied)
// all others are text errors.  

class ResponseMessage {
  constructor({data='', status=200, headers={}, encoding=null, err='', cookies=[]} = {}) {
    this.data = data;
    this.status = status;
    this.headers = headers;
    this.encoding = encoding;
    this.err = err;
    this.cookies = cookies;
  }
}

class SendMessage {
  constructor({headers={}, body=null, options={}, type='json', chunked=true} = {}) {
    this.headers = headers;
    this.body = body;
    this.options = options;
    this.type = type;
    this.chunked = chunked;
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

    if (options.method != 'GET') {
      if (this.type == 'json') {
        body = JSON.stringify(body);
        ct = 'application/json';
      }
      
      if (this.type == 'form') {
        body = querystring.stringify(body);
        ct = 'application/x-www-form-urlencoded';
      }
  
      headers['Content-Type'] = ct;
      if (!this.chunked) headers['Content-Length'] = Buffer.byteLength(body);    // smtp2go needs this, ee doesn't.
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
    let j = Object.assign({}, x);

    for (let k in j) {
      if (!j[k]) delete j[k];
    }

    return JSON.parse(JSON.stringify(j));
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