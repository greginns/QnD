const root = process.cwd();
const urlParse = require('url').parse;
const qParse = require('querystring').parse;

const {SystemError, JSONError, Error413} = require(root + '/lib/server/utils/errors.js');
const {Rewrite} = require(root + '/lib/server/utils/rewrite.js');
//const versionRe = /^v\d{1}$/;

function cookieParse(req) {
  var list = {}, rc = req.headers.cookie;

  rc && rc.split(';').forEach(function(cookie) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });

  return list;
}

function getMultipartBody(parts) {
  const CRLF2 = Buffer.from('\r\n\r\n');
  const FILENAME = Buffer.from('filename=');
  const NAME = Buffer.from('name=');
  const CT = Buffer.from('Content-Type: ');
  const QT = Buffer.from('"')
  
  var body = {}, files = [];

  var getNameAndValue = function(subPart, name) {
    var pos1 = subPart.indexOf(name);
    var pos2, pos3, fld, val;
    
    if (pos1 > -1) {
      pos2 = subPart.indexOf(CRLF2, pos1);
      
      if (pos2 == -1) pos2 = subPart.length+1;
      
      fld = subPart.slice(pos1 + name.length, pos2);

      // remove any quotes around names
      if (fld.slice(0,1).compare(QT) == 0) fld = fld.slice(1, fld.indexOf(QT, 1));
      
      pos3 = subPart.indexOf(CRLF2, pos2);
      val = subPart.slice(pos3 + 4, subPart.length-2);
    }
    
    fld = fld.toString('utf8');
    if (name == NAME) val = val.toString('utf8');
    
    return [fld, val];
  }
  
  function getMime(subPart) {
    var pos2, mime = '';
    var pos1 = subPart.indexOf(CT);
    
    if (pos1 == -1) return '';
    pos1 += CT.length;

    pos2 = subPart.indexOf(CRLF2);
    mime = subPart.slice(pos1, pos2);
    
    return mime.toString('utf8');
  }
  
  parts.forEach(function(part){
    // name; filename; Content-type
    var subParts = splitBuffer(part, '; ');
    var fld, val, file, contents, ct, type;
    
    subParts.shift(); // get rid of Content-Disposition
    
    // go through each sub part extracting info
    subParts.forEach(function(subPart) {
      // either a file or a field.  If file, multiple parts will end up valuing fld, file, contents
      if (subPart.indexOf(FILENAME) > -1) {
        type = 'file';
        
        [file, contents] = getNameAndValue(subPart, FILENAME);
        ct = getMime(subPart);
      }
      else {
        type = 'field';
        
        [fld, val] = getNameAndValue(subPart, NAME);
      }
    });
      
    // save results      
    if (type == 'file') {
      files.push({fieldname: fld, filename: file, contents: contents, 'Content-Type': ct, length: contents.length});
    }
    else {
      if (fld in body) {  // already a field with that name.
        if (!Array.isArray(body[fld])) {  // if not already an array, make values array
          body[fld] = [body[fld]];
        }
        
        body[fld].push(val);
      }
      else {
        body[fld] = val;
      }        
    }
  })
  
  return [body, files];  
}

async function getBody(req) {
  var str = '', body = {}, files = [], boundary, parts, chunks = [], chunkLength = 0;
  var aborted = false;
  var ct = (req.headers['content-type'] || "").toLowerCase();
  var charset;
  var x = ct.indexOf(';');

  if (x > -1) {
    charset = ct.substr(x+1).split('=').pop();
    ct = ct.substr(0,x);
  }

  return new Promise(function(resolve, reject) {
    req.on('data', function(data) {
      chunks.push(data);
      chunkLength += data.length;
//console.log('DATA')      
      if (chunkLength > 1e6) { // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        aborted = true;

        reject(new Error413());
      }
    });

    req.on('end', function () {
//console.log('END', aborted)      
      if (aborted) return;
      
      str = Buffer.concat(chunks);

      if (ct == 'application/json') {
        try {
          body = JSON.parse(str)
        }
        catch(err) {
          reject(err);
        }
      }
      else if (ct == 'text/plain') {
        body = str.toString(charset);
      }
      else if (ct == 'application/x-www-form-urlencoded') {
        body = qParse(str);
      }
      else if (ct.indexOf('multipart/form-data') >-1) {
        boundary = ct.match(/^.*boundary=(.+)$/i)[1];
        parts = splitBuffer(str, '--' + boundary);

        parts.pop();
        parts.shift();
        
        [body, files] = getMultipartBody(parts)
      }

      resolve([body, files]);
    });  
    
    req.on('error', function(err) {
//console.log('ERROR',err)            
      reject(err);
    })  
  })        
}

function splitBuffer(buff, bound) {
  var parts = [], part, start = 0, end, buffLength = buff.length;
  var boundary = Buffer.from(bound);
  var boundaryLength = boundary.length;
  
  while (start <= buffLength) {
    end = buff.indexOf(boundary, start);
    if (end == -1) end = buffLength + 1;
    part = buff.slice(start, end);
    parts.push(part)
    start = end + boundaryLength;
  }
  
  return parts;
}

function cleanPathname(path) {
  let parts = path.split('/');

  return parts.map(function(part) {
    try {
      part = decodeURIComponent(part);
    }
    catch(err) {
      // leave it go undecoded
    }

    return part;
  }).join('/');
}

function rewritePath(path) {
  // enforce app/version/path format
  let newPath = Rewrite.get(path);

  if (newPath !== false) return newPath;
  return path;
}

module.exports = {
  process: async function(req, res) {
    req.parsedURL = urlParse(req.url, true);

    req.cookies = cookieParse(req);
    req.CSRFToken = req.headers['x-csrf-token'];
    req.query = req.parsedURL.query;
    req.parsedURL.pathname = rewritePath(cleanPathname(req.parsedURL.pathname));

    if (req.method == 'POST' || req.method == 'PUT') {
      try {
        [req.body, req.files] = await getBody(req);
      }
      catch(err) {
        throw err;
      }
    }
  },
  
  processWS: function(req) {
    req.parsedURL = urlParse(req.url, true);
    req.cookies = cookieParse(req);
  }
}

/*
const dataURL = snapshotCanvas.toDataURL('image/png');
$.ajax({
    url: 'http://localhost:3000/upload-image',
    dataType: 'json',
    data: { data: dataURL },
    type: 'POST',
    success: function(data) {}
});

Receiving request:

router.post('/', (req, res) => {
    const base64 = req.body.data.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(`uploads/images/newImage.jpg`, base64, {encoding: 'base64'});
}
*/