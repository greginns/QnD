const fs = require("fs");
const path = 'zaplets';
const contacts = {};

for (let file of fs.readdirSync(`${__dirname}/${path}`)) {
  let name = file.split('.')[0];

  contacts[name] = require(`./${path}/${file}`);
}

module.exports = {contacts};

// cycle through apps, accumating zaps[app][subapp]
// read all in zapsubs and call zouter
// tenant.app.subapp.event, gm.contacts.contact.create