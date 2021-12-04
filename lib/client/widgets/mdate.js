import {MVC} from '/~static/lib/client/core/mvc.js';
import {datetimer} from '/~static/lib/client/core/datetime.js';

class MDate extends MVC {
  constructor() {
    const template = document.getElementById('widget-mdate');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 

    this.modal = new bootstrap.Modal(clone.querySelector('div.widget-mdate-modal'));
    
    document.addEventListener('keydown', this.escape);
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
    // dt must be a datetime object
    if (!dt || !('isDatetime' in dt)) dt = datetimer();
    
    this.modal.show();
    this.model.cal.origDt = datetimer(dt);
    this.model.cal.currDt = datetimer(dt);

    this.cal1Init();
    
    return new Promise(function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(this));
  }

  calDone() {
    this.calHide();
    this.resolve(this.model.cal.currDt);
  }

  abort() {
    this.calHide();
    this.reject();
  }

  escape(ev) {
    if (ev.key == 'Escape') {
      this.abort();
    }
  }

  calHide() {
    this.modal.hide();
  }

  calOpenPane(cal) {
    this.model.cal.cal1 = false;
    this.model.cal.cal2 = false;
    this.model.cal.cal3 = false;

    this.model.cal['cal' + cal] = true;
  }

  /* CAL 1 */
  cal1Init() {
    this.calOpenPane(1);
    this.cal1Display();
  }

  cal1Display() {
    let dt = this.model.cal.currDt;
    let origDt = this.model.cal.origDt;
    let fom = datetimer(dt).date(1);    // create first of the month
    let fomDow = fom.day();             // day of the week on the first
    //let lom = datetimer(fom).add(1,'months').subtract(1,'days').date();   // last day of the month
    let lom = datetimer(fom).date(fom.getDaysInMonth()).date();   // last day of the month
    let plom = datetimer(fom).subtract(1,'days').date();                  // last day of the month of prev month
    let month = dt.format('MMMM');
    let year = dt.format('YYYY');
    let mth = dt.month();
    let yr = dt.year();

    this.model.dateInWords = dt.format('dddd, MMMM D, YYYY');

    let pdt = datetimer(dt).date(1).subtract(1, 'months');
    let pmth = pdt.month();
    let pyr = pdt.year();

    let ndt = datetimer(dt).date(1).add(1, 'months');
    let nmth = ndt.month();
    let nyr = ndt.year();

    // build list of 42 days
    let days = [], classes = [], attrs = [];

    // prior to first of the month
    for (let i=plom-fomDow+1; i<=plom; i++) {
      let klass=['widget-mdate-day', 'widget-mdate-offmonth'];

      days.push(i);
      attrs.push({'year': pyr, 'month': pmth, 'day': i});

      if (datetimer([pyr, pmth, i]).isSame(origDt, 'ymd')) {
        klass.push('widget-mdate-day-chosen');
      }

      classes.push(klass);
    }

    // the month
    for (let i=0; i<lom; i++) {
      let klass=['widget-mdate-day'];

      days.push(i+1);
      attrs.push({'year': yr, 'month': mth, 'day': i+1});

      if (datetimer([yr, mth, i+1]).isSame(origDt, 'ymd')) {
        klass.push('widget-mdate-day-chosen');
      }

      classes.push(klass);
    }

    // after the end of the month
    let dl = 42-days.length;

    for (let i=0; i<dl; i++) {
      let klass=['widget-mdate-day', 'widget-mdate-offmonth'];

      days.push(i+1);
      attrs.push({'year': nyr, 'month': nmth, 'day': i+1});

      if (datetimer([nyr, nmth, i+1]).isSame(origDt, 'ymd')) {
        klass.push('widget-mdate-day-chosen');
      }

      classes.push(klass);
    }

    this.model.cal1.days = days;
    this.model.cal1.classes = classes;
    this.model.cal1.attrs = attrs;
    this.model.cal1.year = year;
    this.model.cal1.month = month;
  }

  cal1PrevYear(ev) {
    this.model.cal.currDt.date(1).subtract(1, 'months');

    this.cal1Display();
  }

  cal1NextYear(ev) {
    this.model.cal.currDt.date(1).add(1, 'months');

    this.cal1Display();
  }

  cal1Year(ev) {
    this.cal3Init(1);
  }

  cal1Month(ev) {
    this.cal2Init();
  }

  cal1DayClicked(ev) {
    let td = ev.target.closest('td');
    let year = td.getAttribute('data-year');
    let month = parseInt(td.getAttribute('data-month'), 10);
    let day = td.getAttribute('data-day');

    this.model.cal.currDt = datetimer([year, month, day]);
    this.calDone();
  }

  /* CAL 2 */
  cal2Init() {
    this.calOpenPane(2);
    this.cal2Display();
  }

  cal2Display() {
    let dt = this.model.cal.currDt;

    this.model.cal2.year = dt.format('YYYY');
  }

  cal2PrevYear(ev) {
    this.model.cal.currDt.subtract(1, 'years');

    this.cal2Display();
  }

  cal2NextYear(ev) {
    this.model.cal.currDt.add(1, 'years');

    this.cal2Display();
  }

  cal2Year(ev) {
    this.cal3Init(2);
  }

  cal2MonthClicked(ev) {
    let month = parseInt(ev.target.closest('td').getAttribute('data-month'), 10);

    this.model.cal.currDt.month(month);
    this.cal1Init();
  }

  /* CAL 3 */
  cal3Init(src) {
    let dt = this.model.cal.currDt;
    let year = '' + dt.year();
    let y = parseInt(year.substr(year.length-1, 1), 10) - 1;
    let first = dt.subtract(y, 'years').year();
    let last = first + 19;

    this.model.cal3.first = first;
    this.model.cal3.last = last;
    this.model.cal3.src = src;

    this.cal3Display();
    this.calOpenPane(3);
  }

  cal3Display() {
    let first = this.model.cal3.first;
    let last = this.model.cal3.last;
    let years = [];

    for (let i=first; i<=last; i++) {
      years.push(i);
    }

    this.model.cal3.years = years;
  }

  cal3PrevDecade(ev) {
    let first = this.model.cal3.first - 20;
    let last = first + 19;

    this.model.cal3.first = first;
    this.model.cal3.last = last;

    this.cal3Display();
  }

  cal3NextDecade(ev) {
    let first = this.model.cal3.first + 20;
    let last = first + 19;

    this.model.cal3.first = first;
    this.model.cal3.last = last;

    this.cal3Display();
  }

  cal3YearClicked(ev) {
    let year = parseInt(ev.target.closest('td').firstChild.innerText, 10);
    this.model.cal.currDt.year(year);

    if (parseInt(this.model.cal3.src, 10) == 1) {
      this.cal1Init();
    }
    else {
      this.cal2Init();
    }
  }
}

export {MDate};