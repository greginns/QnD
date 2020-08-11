const root = process.cwd();
const fs = require('fs').promises;

const config = require(root + '/config.json');
const {Router} = require(root + '/lib/server/utils/router.js');
const { Contact } = require(root + '/apps/contacts/models.js');
const ContactFields = Contact.getColumnDefns();
const ContactHidden = Contact.getHidden();

const base = root + '/apps';
const docName = 'openapi.yaml';
const paths = [], paramRefs = {};
const file = base + '/contacts/' + docName;
const spaces = '  '
var contents = '', prevPath = '';

const required = [];

const methodOrder = {
  'GET': 0,
  'POST': 1,
  'PUT': 2,
  'DELETE': 3,
}

const ctypes = {
  json: 'application/json',
}

for (let app of config.apiapps) {
  require(root + `/apps/${app}/routes.js`);  // process app routes.
}

const routes = Router.getRoutes('contacts', 'v1');

for (let routeMap of routes) {
  for (let [path, rmsg] of routeMap) {
    if (rmsg.inAPI) {
      paths.push([path, methodOrder[rmsg.method], rmsg]);
    }
  }
}

paths.sort(function(a, b) {
  return (a[0] < b[0]) ? -1 : (a[0] > b[0]) ? 1 : (a[1] < b[1]) ? -1 : (a[1] > b[1]) ? 1 : 0;
});

for (let field in ContactFields) {
  if (ContactFields[field].type != 'Derived') {
    if (ContactFields[field].notNull || !ContactFields[field].null) required.push(field);
  }
  
  ContactFields[field].type = 'string';
}

contents += 'openapi: "3.0.0"\n';
contents += 'info:\n';
contents += spaces + 'version: 1.0.0\n';
contents += spaces + 'title: Contacts\n';
contents += spaces + 'license:\n';
contents += spaces.repeat(2) + 'name: MIT\n';
contents += 'servers:\n';
contents += spaces + '- url: https:roam3.adventurebooking.com/contacts/v1\n';

// Paths
contents += 'paths:\n';

for (let pathInfo of paths) {
  let path = pathInfo[0], rmsg = pathInfo[2];
  let method = rmsg.method.toLowerCase(), desc = rmsg.desc, resp = rmsg.resp;
  let app = rmsg.app, subapp = rmsg.subapp, id = rmsg.id;
  let type = ctypes[resp.type];
  let inputSchema = rmsg.input.schema;
  let inputSchemaName = (inputSchema) ? inputSchema.name : '';
  let responseArray = Array.isArray(resp.schema);
  let schemaName = (resp.schema) ? (responseArray) ? resp.schema[0].name : resp.schema.name : '';
  let params = [], body = [];
  
  if (id == 'getMany') {
    params.push('- $ref: "#/components/parameters/limitParam"');
    params.push('- $ref: "#/components/parameters/offsetParam"');
    params.push('- $ref: "#/components/parameters/orderbyParam"');
    params.push('- $ref: "#/components/parameters/fieldsParam"');
    params.push('- $ref: "#/components/parameters/filtersParam"');
  }

  if (id == 'create' || id == 'update') {
    if (inputSchemaName) {
      body.push('required: true');
      body.push('content:');
      body.push('  application/json:');
      body.push('    schema:');
      body.push(`      $ref: "#/components/schemas/${inputSchemaName}"`);
    }
  }

  // gather up unique path variables
  for (let part of path.split('/')) {
    if (part.substr(0,1) == ':') {
      let ppath = part.substr(1);

      if (!(ppath in paramRefs)) {
        params.push(`- $ref: "#/components/parameters/${subapp}${ppath}"`);

        paramRefs[subapp+ppath] = [];
        paramRefs[subapp+ppath].push('name: ' + ppath);
        paramRefs[subapp+ppath].push('in: path');
        paramRefs[subapp+ppath].push('required: true');
        paramRefs[subapp+ppath].push('description: The id of the ' + schemaName + ' to retrieve');
        paramRefs[subapp+ppath].push('schema:');
        paramRefs[subapp+ppath].push('  type: string');
      }
    }
  }

  if (path != prevPath) {
    let newPath = [];

    for (let part of path.split('/')) {
      let ppath = (part.substr(0,1) == ':') ? '{' + part.substr(1) + '}' : part;

      newPath.push(ppath)
    }

    contents += spaces + newPath.join('/') + ':\n';
  }

  contents += spaces.repeat(2) + method + ':\n';
  contents += spaces.repeat(3) + 'summary: ' + desc + '\n';

  contents += spaces.repeat(3) + 'operationId: ' + `"${app}.${subapp}.${id}"` + '\n';

  contents += spaces.repeat(3) + 'tags:\n';
  contents += spaces.repeat(4) + `- "${app}.${subapp}"\n`;

  // body
  if (body.length > 0) {
    contents += spaces.repeat(3) + 'requestBody:\n';

    for (let b of body) {
      contents += spaces.repeat(4) + b + '\n';
    }
  }

  // parameters
  if (params.length > 0) {
    contents += spaces.repeat(3) + 'parameters:\n';

    for (let ref of params) {
      contents += spaces.repeat(4) + ref + '\n';
    }
  }

  contents += spaces.repeat(3) + 'responses:\n';
  contents += spaces.repeat(4) + '"200":\n';
  contents += spaces.repeat(5) + 'description: ' + resp.desc + '\n';
  contents += spaces.repeat(5) + 'content:\n';
  contents += spaces.repeat(6) + type + ':\n';
  contents += spaces.repeat(7) + 'schema:\n'
  contents += spaces.repeat(8) + `$ref: "#/components/schemas/${schemaName}${(responseArray) ? 's' : ''}"\n`;

  prevPath = path;
}

// Components
contents += 'components:\n';

//  Parameters
contents += spaces + 'parameters:\n';

contents += spaces.repeat(2) + 'limitParam:\n';
contents += spaces.repeat(3) + 'name: limit\n';
contents += spaces.repeat(3) + 'in: query\n';
contents += spaces.repeat(3) + 'description: How many items to return at one time (max 100)\n';
contents += spaces.repeat(3) + 'required: false\n';
contents += spaces.repeat(3) + 'schema:\n';
contents += spaces.repeat(4) + 'type: integer\n';
contents += spaces.repeat(4) + 'format: int32\n';

contents += spaces.repeat(2) + 'offsetParam:\n';
contents += spaces.repeat(3) + 'name: offset\n';
contents += spaces.repeat(3) + 'in: query\n';
contents += spaces.repeat(3) + 'description: How many entries to skip\n';
contents += spaces.repeat(3) + 'required: false\n';
contents += spaces.repeat(3) + 'schema:\n';
contents += spaces.repeat(4) + 'type: integer\n';
contents += spaces.repeat(4) + 'format: int32\n';

contents += spaces.repeat(2) + 'orderbyParam:\n';
contents += spaces.repeat(3) + 'name: orderby\n';
contents += spaces.repeat(3) + 'in: query\n';
contents += spaces.repeat(3) + 'description: "Comma separated list of sort order fields: ie col1,-col2"\n';
contents += spaces.repeat(3) + 'required: false\n';
contents += spaces.repeat(3) + 'schema:\n';
contents += spaces.repeat(4) + 'type: string\n';

contents += spaces.repeat(2) + 'fieldsParam:\n';
contents += spaces.repeat(3) + 'name: fields\n';
contents += spaces.repeat(3) + 'in: query\n';
contents += spaces.repeat(3) + 'description: "Comma separated list of fields to return, ie: col1,col2"\n';
contents += spaces.repeat(3) + 'required: false\n';
contents += spaces.repeat(3) + 'schema:\n';
contents += spaces.repeat(4) + 'type: string\n';

contents += spaces.repeat(2) + 'filtersParam:\n';
contents += spaces.repeat(3) + 'name: filters\n';
contents += spaces.repeat(3) + 'in: query\n';
contents += spaces.repeat(3) + 'description: "Comma separated list of filter fields: ie col1|Miller,col2|Greg"\n';
contents += spaces.repeat(3) + 'required: false\n';
contents += spaces.repeat(3) + 'schema:\n';
contents += spaces.repeat(4) + 'type: string\n';

let refKeys = Object.keys(paramRefs);

if (refKeys.length > 0) {
  for (let key of refKeys) {
    contents += spaces.repeat(2) + key + ':\n';

    for (let entry of paramRefs[key]) {
      contents += spaces.repeat(3) + entry + '\n';
    }
  }  
}

contents += spaces + 'schemas:\n';
contents += spaces.repeat(2) + 'Contact:\n';
contents += spaces.repeat(3) + 'type: object\n';

if (required.length > 0) {
  contents += spaces.repeat(3) + 'required:\n';

  for (let req of required) {
    contents += spaces.repeat(4) + '- ' + req + '\n';
  }
}

contents += spaces.repeat(3) + 'properties:\n';

for (let field in ContactFields) {
  contents += spaces.repeat(4) + field + ':\n';
  contents += spaces.repeat(5) + 'type: ' + ContactFields[field].type + '\n';
}

contents += spaces.repeat(2) + 'Contacts:\n';
contents += spaces.repeat(3) + 'type: array\n';
contents += spaces.repeat(3) + 'items:\n';
contents += spaces.repeat(4) + '$ref: "#/components/schemas/Contact"\n';

fs.writeFile(file, contents);

console.log(ContactFields, ContactHidden)
