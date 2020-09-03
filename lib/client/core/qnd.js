// NEED:
// set csrf token in io

var QnD = {};

QnD.classes = {};
QnD.data = {};
QnD.misc = {};
QnD.pages = [];
QnD.storage = {};
QnD.tableStores = {};
QnD.widgets = {};

QnD.dateFormat = 'YYYY-MM-DD';
QnD.timeFormat = 'h:mm A';

/*
QnD.config.EE = {
	email: 'info@wildanimaltracks.com',
	name: 'Greg Miller',
	apikey: 'c64acb2a-1b52-4fd5-b43a-7fbaa855056d',
	url: 'https://api.elasticemail.com/v2/',
};
*/

/*
window.roam3_updateTitle = function(val) {
  var titles = document.title.split('|');

  setTimeout(function() {   // just in case this goes before the QnD setting the title.
    document.title = val + '|' + titles[titles.length-1];
  }, 250);
}

window.roam3_focusOnMe = function() {
  window.focus();
}

window.roam3_focusOnOpener = function() {
  window.blur();

  try {
    window.open('', window.opener.name);  // works in Chrome
    window.opener.roam3_focusOnMe();
  }
  catch(e) {
    console.log('no opener');
  }
}
*/

export {QnD};