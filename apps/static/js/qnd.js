// NEED:
// set csrf token in io

//;window['QnD'] = {};
//import {MVC} from '/static/apps/static/js/mvc.js';
//import {Router, Pages, Page, Section} from '/static/apps/static/js/router.js';
//import {WSDataComm, TableStore, TableView} from '/static/apps/static/js/data.js';
//import {io} from '/static/apps/static/js/iofetch.js';
//import {utils} from '/static/apps/static/js/utils.js';

var QnD = {};

QnD.classes = {};
//QnD.config = {};
//QnD.constants = {};
//QnD.dataStore = {};
//QnD.defaults = {};
//QnD.helpers = {};
QnD.misc = {};
//QnD.module = '';
//QnD.modals = {};
QnD.pages = [];
//QnD.schemas = {};
//QnD.storage = {};
//QnD.subs = {};
//QnD.tables = {};
//QnD.tableData = {};
QnD.widgets = {};

QnD.dateFormat = 'YYYY-MM-DD';
QnD.timeFormat = 'h:mm A';

/*
QnD.classes.MVC = MVC;
QnD.classes.Router = Router;
QnD.classes.Pages = Pages;
QnD.classes.Page = Page;
QnD.classes.Section = Section;
QnD.classes.WSDataComm = WSDataComm;
QnD.classes.TableStore = TableStore;
QnD.classes.TableView = TableView;
QnD.io = io;
QnD.utils = utils;
*/

/*
QnD.config.EE = {
	email: 'info@wildanimaltracks.com',
	name: 'Greg Miller',
	apikey: 'c64acb2a-1b52-4fd5-b43a-7fbaa855056d',
	url: 'https://api.elasticemail.com/v2/',
};
*/

//var nwio = {{nwio}}
//console.log(nwio.fred())

/* Data fetching theories:
  tables: Needed tables are specified QnD wide  
            QnD.wsdc.setTables([])  main page 
          Each page subscribes to individual tables, as needed  
            QnD.subs.data.subscribe(url, cb)  pages
          Server publishes a change to tables  
            QnD.subs.data.publish(url, data)  WSDatacom
          
  subsets: 
          Specified as needed in each page  
            QnD.wsdc.addSubset({table, filter})    page
            QnD.subs.data.subscribe(url, cb)  (get handle to remove)  page
          Any rtn using a subset publishes a change to server  
            QnD.wsdc.publishSubsetChanges(table, filter) page
          Server publishes changes  
            QnD.subs.data.publish(url, data)  WSDatacom
          (the table change itself would also trigger a publish on server)

  removal/subscribe to subset          
      var ef = this.$get('empworkFilter');
      var pempcode = this.$get('previousFilter');
      
      if (ef) {
        ef.remove();
        QnD.wsdc.removeSubset({table: 'empwork', filter: pempcode});
      }

      QnD.wsdc.addSubset({table: 'empwork', filter: empcode});
      ef = QnD.subs.data.subscribe('/tenant/empwork/' + empcode, function(data) {
        console.log('subset',data)
      })      
      
      // Save sub removal
      this.$set('empworkFilter', ef);
      this.$set('previousFilter', empcode);          
*/



//QnD.subs.data = new QnD.Pubsub();
//QnD.subs.general = new QnD.Pubsub();


//MVC.config({prefix: 'mvc'});
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