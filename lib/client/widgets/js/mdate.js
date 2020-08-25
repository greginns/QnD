import {QnD} from '/static/v1/static/lib/client/core/qnd.js';
import {MVC} from '/static/v1/static/lib/client/core/mvc.js';

class MDate extends MVC {
  constructor() {
    super('mvc-boot-cal');

    //this.modal = $('#' + this.element);
    this.modal = document.getElementById(this._element);

    this.createModel();
  }

  createModel() {
    this.model.cal = {
      cal1: false,
      cal2: false,
      cal3: false,
      origDt: '',
      currDt: '',
    };

    this.model.cal1 = {
      year: '',
      month: '',
      days: [],
      classes: [],
      attrs: [],
    };

    this.model.cal2 = {
      year: ''
    };

    this.model.cal3 = {
      src: 1,
      first: 0,
      last: 0,
      years: [],
    };

    this.model.dateInWords = '';
    this.model.modalShow = false;
    
    this.resolve = '';
  }

  calendar(dt) {
    // dt must be a moment object
    var self = this;

    if (!moment(dt).isValid()) dt = moment();
    
    this._modalOpen();
    
    this.model.cal.origDt = moment(dt);
    this.model.cal.currDt = moment(dt);

    this.cal1Init();
    
    return new Promise(function(resolve) {
      this.resolve = resolve;
    }.bind(this));
  }

  calOpenPane(cal) {
    this.model.cal.cal1 = false;
    this.model.cal.cal2 = false;
    this.model.cal.cal3 = false;

    this.model.cal['cal' + cal] = true;
  }

  calClose() {
    this.calHide();
    this.resolve(this.model.cal.origDt);
  }

  calDone() {
    this.calHide();
    this.resolve(this.model.cal.currDt);
  }

  calHide() {
    this._modalClose();
  }

  /* CAL 1 */
  cal1Init() {
    this.calOpenPane(1);
    this.cal1Display();
  }

  cal1Display() {
    var dt = this.model.cal.currDt;
    var origDt = this.model.cal.origDt;
    var fom = moment(dt).date(1);    // create first of the month
    var fomDow = fom.day();          // day of the week on the first
    var lom = moment(fom).add(1,'months').subtract(1,'days').date();    // last day of the month
    var plom = moment(fom).subtract(1,'days').date();  // last day of the month of prev month
    var month = dt.format('MMMM');
    var year = dt.format('YYYY');
    var mth = dt.month();
    var yr = dt.year();

    this.model.dateInWords = dt.format('dddd, MMMM Do, YYYY');

    var pdt = moment(dt).subtract(1, 'months');
    var pmth = pdt.month();
    var pyr = pdt.year();

    var ndt = moment(dt).add(1, 'months');
    var nmth = ndt.month();
    var nyr = ndt.year();

    // build list of 42 days
    var days = [], classes = [], attrs = [];

    for (var i=plom-fomDow+1; i<=plom; i++) {
      var klass=['mvc-boot-cal-offmonth'];

      days.push(i);
      attrs.push({'year': pyr, 'month': pmth, 'day': i});

      if (moment([pyr, pmth, i]).isSame(origDt, 'day')) {
        klass.push('text-danger');
      }

      classes.push(klass.join(' '));
    }

    for (var i=0,klass=[]; i<lom; i++) {
      var klass=[];

      days.push(i+1);
      attrs.push({'year': yr, 'month': mth, 'day': i+1});

      if (moment([yr, mth, i+1]).isSame(origDt, 'day')) {
        klass.push('text-danger');
      }

      classes.push(klass.join(' '));
    }

    var dl = 42-days.length;

    for (var i=0; i<dl; i++) {
      var klass=['mvc-boot-cal-offmonth'];

      days.push(i+1);
      attrs.push({'year': nyr, 'month': nmth, 'day': i+1});

      if (moment([nyr, nmth, i+1]).isSame(origDt, 'day')) {
        klass.push('text-danger');
      }

      classes.push(klass.join(' '));
    }

    this.model.cal1.days = days;
    this.model.cal1.classes = classes;
    this.model.cal1.attrs = attrs;
    this.model.cal1.year = year;
    this.model.cal1.month = month;
  }

  cal1PrevYear(ev) {
    this.model.cal.currDt = (this.model.cal.currDt).subtract(1, 'months');
    this.cal1Display();
  }

  cal1NextYear(ev) {
    this.model.cal.currDt = (this.model.cal.currDt).add(1, 'months');
    this.cal1Display();
  }

  cal1Year(ev) {
    this.cal3Init(1);
  }

  cal1Month(ev) {
    this.cal2Init();
  }

  cal1DayClicked(ev) {
    var td = ev.target.closest('td');
    var year = td.getAttribute('data-year');
    var month = td.getAttribute('data-month');
    var day = td.getAttribute('data-day');

    this.model.cal.currDt = moment([year, month, day]);
    this.calDone();
  }

  /* CAL 2 */
  cal2Init() {
    this.calOpenPane(2);
    this.cal2Display();
  }

  cal2Display() {
    var dt = this.model.cal.currDt;

    this.model.cal2.year = dt.format('YYYY');
  }

  cal2PrevYear(ev) {
    this.model.cal.currDt = (this.model.cal.currDt).subtract(1, 'years');

    this.cal2Display();
  }

  cal2NextYear(ev) {
    this.model.cal.currDt = (this.model.cal.currDt).add(1, 'years');

    this.cal2Display();
  }

  cal2Year(ev) {
    this.cal3Init(2);
  }

  cal2MonthClicked(ev) {
    var month = parseInt(ev.target.closest('td').getAttribute('data-month'), 10);

    this.model.cal.currDt = (this.model.cal.currDt).month(month);
    this.cal1Init();
  }

  /* CAL 3 */
  cal3Init(src) {
    var dt = this.model.cal.currDt;
    var year = '' + dt.year();
    var y = parseInt(year.substr(year.length-1, 1), 10) - 1;
    var first = dt.subtract(y, 'years').year();
    var last = first + 19;

    this.model.cal3.first = first;
    this.model.cal3.last = last;
    this.model.cal3.src = src;

    this.cal3Display();
    this.calOpenPane(3);
  }

  cal3Display() {
    var first = this.model.cal3.first;
    var last = this.model.cal3.last;
    var years = [];

    for (var i=first; i<=last; i++) {
      years.push(i);
    }

    this.model.cal3.years = years;
  }

  cal3PrevDecade(ev) {
    var first = this.model.cal3.first - 20;
    var last = first + 19;

    this.model.cal3.first = first;
    this.model.cal3.last = last;

    this.cal3Display();
  }

  cal3NextDecade(ev) {
    var first = this.model.cal3.first + 20;
    var last = first + 19;

    this.model.cal3.first = first;
    this.model.cal3.last = last;

    this.cal3Display();
  }

  cal3YearClicked(ev) {
    var year = parseInt(ev.target.closest('td').firstChild.innerText, 10);
    this.model.cal.currDt = (this.model.cal.currDt).year(year);

    if (parseInt(this.model.cal3.src, 10) == 1) {
      this.cal1Init();
    }
    else {
      this.cal2Init();
    }
  }
  
  _modalOpen() {
    this.modal.className="modal fade show";
    this.modal.style.display = 'block';
    this.modal.style['padding-right'] = '17px';
    
    document.body.className = 'modal-open';
    document.body.style['padding-right'] = '17px';
    
    this.backdropDiv = document.createElement('div');
    this.backdropDiv.className='modal-backdrop fade show';
    document.body.appendChild(this.backdropDiv); 
  }
  
  _modalClose() {
    this.modal.className="modal fade";
    this.modal.style.display = 'none';
    this.modal.style['padding-right'] = '0px';
    
    document.body.style['padding-right'] = '0px'
    document.body.className = '';   
    this.backdropDiv.remove();     
  }      
}

QnD.widgets.mdate = new MDate();

/*  
// await QnD.widgets.mdate.calendar(momentDate);
*/    
