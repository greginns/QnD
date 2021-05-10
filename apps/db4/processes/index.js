const actionGroups = {};

actionGroups.smtp2go = require('./smtp2go.js');
actionGroups.elastic = require('./elastic.js');
actionGroups.mailmerge = require('./mailmerge.js');
actionGroups.io_int = require('./io_int.js');
actionGroups.io_ext = require('./io_ext.js');
actionGroups.micro_services = require('./micro_services.js');

let {_initial, _final} = require('./_.js');
actionGroups._initial = _initial;
actionGroups._final = _final;

module.exports = {actionGroups}