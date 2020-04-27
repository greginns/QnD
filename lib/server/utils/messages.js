class TravelMessage {
  constructor({data={}, type='json', status=200, err=null, cookies=[]} = {}) {
    this.data = data;
    this.type = type;
    this.status = status;       // HTTP status
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

  };
}

module.exports = {
  TravelMessage,
  ResponseMessage,
}