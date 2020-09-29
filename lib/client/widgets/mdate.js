import {MVC} from '/~static/lib/client/core/mvc.js';

class MDate extends MVC {
  constructor() {
    const template = document.getElementById('widget-mdate');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 

    this.modal = clone.querySelector('div.widget-mdate-modal');
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
    // dt must be a dayjs object
    if (!dayjs(dt).isValid()) dt = dayjs();
    
    this._modalOpen();
    this.model.cal.origDt = dayjs(dt);
    this.model.cal.currDt = dayjs(dt);

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
    let dt = this.model.cal.currDt;
    let origDt = this.model.cal.origDt;
    let fom = dayjs(dt).date(1);    // create first of the month
    let fomDow = fom.day();          // day of the week on the first
    let lom = dayjs(fom).add(1,'months').subtract(1,'days').date();    // last day of the month
    let plom = dayjs(fom).subtract(1,'days').date();  // last day of the month of prev month
    let month = dt.format('MMMM');
    let year = dt.format('YYYY');
    let mth = dt.month();
    let yr = dt.year();

    this.model.dateInWords = dt.format('dddd, MMMM D, YYYY');

    let pdt = dayjs(dt).subtract(1, 'months');
    let pmth = pdt.month();
    let pyr = pdt.year();

    let ndt = dayjs(dt).add(1, 'months');
    let nmth = ndt.month();
    let nyr = ndt.year();

    // build list of 42 days
    let days = [], classes = [], attrs = [];

    for (let i=plom-fomDow+1; i<=plom; i++) {
      let klass=['widget-mdate-offmonth'];

      days.push(i);
      attrs.push({'year': pyr, 'month': pmth, 'day': i});

      if (dayjs([pyr, pmth+1, i]).isSame(origDt, 'day')) {
        klass.push('text-danger');
      }

      classes.push(klass.join(' '));
    }

    for (let i=0; i<lom; i++) {
      let klass=[];

      days.push(i+1);
      attrs.push({'year': yr, 'month': mth, 'day': i+1});

      if (dayjs([yr, mth+1, i+1]).isSame(origDt, 'day')) {
        klass.push('text-danger');
      }

      classes.push(klass.join(' '));
    }

    let dl = 42-days.length;

    for (let i=0; i<dl; i++) {
      let klass=['mvc-boot-cal-offmonth'];

      days.push(i+1);
      attrs.push({'year': nyr, 'month': nmth, 'day': i+1});

      if (dayjs([nyr, nmth+1, i+1]).isSame(origDt, 'day')) {
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
    let td = ev.target.closest('td');
    let year = td.getAttribute('data-year');
    let month = parseInt(td.getAttribute('data-month'), 10);
    let day = td.getAttribute('data-day');

    this.model.cal.currDt = dayjs([year, month+1, day]);
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
    let month = parseInt(ev.target.closest('td').getAttribute('data-month'), 10);

    this.model.cal.currDt = (this.model.cal.currDt).month(month);
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

export {MDate};