var ga;
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
QnD.utils = {object: {}};
QnD.widgets = {};

QnD.dateFormat = 'YYYY-MM-DD';
QnD.timeFormat = 'h:mm A';

/*
QnD.constants.dateFormat = {
	moment: 'YYYY-MM-DD',
	QnD:  'YYYY-MM-DD',
	nice: 'MMM Do, YYYY',
	long: 'dddd, MMMM Do, YYYY',
	time: 'h:mm A',
};

QnD.config.EE = {
	email: 'info@wildanimaltracks.com',
	name: 'Greg Miller',
	apikey: 'c64acb2a-1b52-4fd5-b43a-7fbaa855056d',
	url: 'https://api.elasticemail.com/v2/',
};
*/

QnD.utils.escapeRegExp = function(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

QnD.utils.camelCase = function(string) {
  return string.substr(0,1).toUpperCase() + string.substr(1);
};

QnD.utils.object.isObject = function(a) {
  if (!a) return false;
    return (a) && (a.constructor === Object);
};
    
QnD.utils.object.diff = function(obj1, obj2) {
  // old vs new, return diffs
  var diffs = {};
  
  Object.keys(obj1).forEach(function(k) {
    if (! (k in obj2)) {
      diffs[k] = '';
    }
    else if (obj1[k] != obj2[k]) {
      diffs[k] = obj2[k];
    }
  })
  
  Object.keys(obj2).forEach(function(k) {
    if (! (k in obj1)) diffs[k] = obj2[k];
  })
  
  return diffs;
};

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