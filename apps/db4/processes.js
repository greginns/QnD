//const querystring = require('querystring');
const root = process.cwd();
const https = require('https');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');

const utils = {object: {}, datetime: {}, modals: {}};
// requires element ids overlay and toaster

// object
utils.object.objectType = function(a) {
  if (utils.object.isObject(a)) return 'object';
  if (utils.object.isFunction(a)) return 'function';
  if (utils.object.isArray(a)) return 'array';
  if (utils.object.isString(a)) return 'string';
  if (utils.object.isNumber(a)) return 'number';
  
  return 'string';
};

utils.object.isObject = function(a) {
  if (!a) return false;
  return (a) && (a.constructor === Object);
};
    
utils.object.isFunction = function(a) {
  if (!a) return false;
  return (a) && (typeof a === 'function');
};

utils.object.isArray = function(a) {
  if (!a) return false;
  return (a) && (Array.isArray(a));
};

utils.object.isString = function(a) {
  if (!a) return false;
  return (typeof a === 'string' || a instanceof String);
}

utils.object.isNumber = function(a) {
  if (!a) return false;
  return (!isNaN(a));
}

const credentials = {
  smtp2go: {
    "api_key": "api-1F90F3A4875211EBAA9DF23C91C88F4E",
  }
};

const config = {
  smtp2go: {
    hostname: 'api.smtp2go.com',
    port: 443,
    path: '/v3/email/send',
  }
};

const inputParams = {
  smtp2go: {
    from: {
      prompt: 'From Address',
      name: 'sender'
    },
    fromname: {
      prompt: 'From Name',
      name: 'sender'
    },
    to: {
      prompt: 'To Address(es)',
      type: 'array'
    },
    cc: {
      prompt: 'CC Address(es)',
      type: 'array'
    },
    bcc: {
      prompt: 'BCC Address(es)',
      type: 'array'
    },
    subject: 'Subject Line',
    html: {
      prompt: 'HTML Text',
      name: 'html_body'
    },
    text: {
      prompt: 'Text',
      name: 'text_body'
    },
    attachments: {
      prompt: 'Attachment Files',
      name: 'filename',
      content: 'fileblob',
      mime: 'mimetype'
    }
  },
  nunjucks: {
    document: "Document name",
    data: 'Merge Data'
  }
};

const formatEmailObject = function(data, provider) {
  let translator = inputParams[provider];
  let creds = credentials[provider];
  let emailObj = {};

  // credentials
  for (let k in creds) {
    emailObj[k] = creds[k];
  }

  // from address/name
  let f = data.from, fn = data.fromname, n = translator.from.name;
  emailObj[n] = (fn) ? `${fn} <${f}>` : f;

  for (let k in translator) {
    if (!data[k]) continue;

    let v = translator[k];

    if (k == 'from' || k == 'fromname') continue;

    if (utils.object.isObject(v)) {
      let name =  ('name' in v) ? v.name : k;

      if ('type' in v) {
        if (v.type == 'array') {
          emailObj[name] =  (utils.object.isArray(data[k])) ? data[k] : data[k].split(',');
        }
        else {
          emailObj[name] = data[k];  
        }
      }
      else {
        emailObj[name] = data[k];
      }
    }
    else {
      emailObj[k] = data[k];
    }
  }

  return emailObj;
};

const emailOne = function(data, provider) {
  return processes[provider].sendOne(data);
}

const processes = {
  smtp2go: {
    sendOne: function(data) {
      let postData = JSON.stringify(data);
      let tm = new TravelMessage({type: 'json', status: 200});

      let options = {
        hostname: config.smtp2go.hostname,
        port: config.smtp2go.port,
        path: config.smtp2go.path,
        method: 'POST',
        headers: {
         'Content-Type': 'application/json',
         'Content-Length': postData.length
        }
      };

      return new Promise(function(resolve) {
        let req = https.request(options, function(res) {
          tm.status = res.statusCode;
          res.setEncoding('utf8');
        
          res.on('data', function(d) {
            let dObj = JSON.parse(d);

            dObj._EMAILID = dObj.data.email_id;

            tm.data = JSON.stringify(dObj);

            resolve(tm);
          });
        });
        
        req.on('error', function(e) {
          tm.data = e;

          resolve(tm);
        });
  
        req.write(postData);
        req.end();
      })
     }
   }
 }

 module.exports = {formatEmailObject, emailOne};