const root = process.cwd();
const fs = require('fs').promises;

const config = require(root + '/config.json');
const {Router} = require(root + '/lib/server/utils/router.js');
const { Contact } = require(root + '/apps/contacts/models.js');
const ContactFields = Contact.getColumnDefns();
const ContactHidden = Contact.getHidden();

const base = root + '/apps';
const docName = 'openapi.yaml';
const paths = [];
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
    paths.push([path, methodOrder[rmsg.method], rmsg]);
  }
}

paths.sort(function(a, b) {
  return (a[0] < b[0]) ? -1 : (a[0] > b[0]) ? 1 : (a[1] < b[1]) ? -1 : (a[1] > b[1]) ? 1 : 0;
});

const file = base + '/contacts/' + docName;
const spaces = '  '
var contents = '', prevPath = '';

const required = [];

for (let field in ContactFields) {
  if (ContactFields[field].notNull || !ContactFields[field].null) required.push(field);
}

contents += 'openapi: "3.0.0"\n';
contents += 'info:\n';
contents += spaces + 'version: 1.0.0\n';
contents += spaces + 'title: Contacts\n';
contents += spaces + 'license:\n';
contents += spaces.repeat(2) + 'MIT\n';
contents += 'servers:\n';
contents += spaces + '- url: https:roam3.adventurebooking.com/v1\n';
contents += 'paths:\n';

for (let pathInfo of paths) {
  let path = pathInfo[0], rmsg = pathInfo[2];
  let method = rmsg.method.toLowerCase(), desc = rmsg.desc, resp = rmsg.resp;
  let type = ctypes[resp.type];

  if (path != prevPath) contents += spaces + path + ':\n';

  contents += spaces.repeat(2) + method + ':\n';
  contents += spaces.repeat(3) + 'summary: ' + desc + '\n';
  contents += spaces.repeat(3) + 'tags:\n';
  contents += spaces.repeat(4) + '- contacts\n';
  contents += spaces.repeat(3) + 'parameters:\n';
  contents += spaces.repeat(4) + '$ref: "#/components/query/get"\n';
  contents += spaces.repeat(3) + 'responses:\n';
  contents += spaces.repeat(4) + '"200":\n';
  contents += spaces.repeat(5) + 'description:' + resp.desc + '\n';
  contents += spaces.repeat(5) + 'content:\n';
  contents += spaces.repeat(6) + type + ':\n';
  contents += spaces.repeat(7) + 'schema:\n'
  contents += spaces.repeat(8) + '$ref: "#components/schemas/Contacts"\n';

  prevPath = path;
}

contents += 'components:\n';
contents += spaces + 'query:\n';
contents += spaces.repeat(2) + 'get:\n';
contents += spaces.repeat(3) + '- name: limit\n';
contents += spaces.repeat(4) + 'in: query\n';
contents += spaces.repeat(4) + 'description: How many items to return at one time (max 100)\n';
contents += spaces.repeat(4) + 'required: false\n';
contents += spaces.repeat(4) + 'schema:\n';
contents += spaces.repeat(5) + 'type: integer\n';
contents += spaces.repeat(5) + 'format: int32\n';
contents += spaces.repeat(3) + '- name: offset\n';
contents += spaces.repeat(4) + 'in: query\n';
contents += spaces.repeat(4) + 'description: How many entries to skip\n';
contents += spaces.repeat(4) + 'required: false\n';
contents += spaces.repeat(4) + 'schema:\n';
contents += spaces.repeat(5) + 'type: integer\n';
contents += spaces.repeat(5) + 'format: int32\n';
contents += spaces.repeat(3) + '- name: orderby\n';
contents += spaces.repeat(4) + 'in: query\n';
contents += spaces.repeat(4) + 'description: "Comma separated list of sort order fields: ie col1,-col2"\n';
contents += spaces.repeat(4) + 'required: false\n';
contents += spaces.repeat(4) + 'schema:\n';
contents += spaces.repeat(5) + 'type: string\n';
contents += spaces.repeat(3) + '- name: fields\n';
contents += spaces.repeat(4) + 'in: query\n';
contents += spaces.repeat(4) + 'description: "Comma separated list of fields to return, ie: col1,col2"\n';
contents += spaces.repeat(4) + 'required: false\n';
contents += spaces.repeat(4) + 'schema:\n';
contents += spaces.repeat(5) + 'type: string\n';
contents += spaces.repeat(3) + '- name: filters\n';
contents += spaces.repeat(4) + 'in: query\n';
contents += spaces.repeat(4) + 'description: "Comma separated list of filter fields: ie col1|Miller,col2|Greg"\n';
contents += spaces.repeat(4) + 'required: false\n';
contents += spaces.repeat(4) + 'schema:\n';
contents += spaces.repeat(5) + 'type: string\n';

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
contents += spaces.repeat(4) + '$ref: "#components/schemas/Contact"\n';

fs.writeFile(file, contents);

console.log(ContactFields, ContactHidden)
