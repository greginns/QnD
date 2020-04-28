const fs = require("fs");
const path = 'zaplets';
const contacts = {};

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  let name = file.split('.')[0];

  contactss[name] = require(`./${path}/${file}`);
}

module.exports = {contacts};
