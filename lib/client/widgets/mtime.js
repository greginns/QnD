import {MVC} from '/~static/lib/client/core/mvc.js';

class MTime extends MVC {
  // Accept dayjs datetime.  Manipulate.  Return dayjs datetime
  constructor() {
    const template = document.getElementById('widget-mtime');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 

    this.modal = new bootstrap.Modal(clone.querySelector('div.widget-mtime-modal'));
  }

  createModel() {
    this.model.timeInWords = '';
    this.model.hourClasses = [];
    this.model.minuteClasses = [];
    
    this.resolve = '';
    this.reject = '';
    this.timeVal = '';
    this.origVal = '';
  }

  time(tm) {
    // tm must be dayjs
    if (!dayjs(tm).isValid()) tm = dayjs();

    this.timeVal = tm;     // dayJS format
    this.origVal = dayjs(tm);

    this.modal.show();

    this.displayTime();
    
    return new Promise(function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(this));
  }

  hourClicked(ev) {
    let hh = parseInt(ev.target.closest('td,th').getAttribute('data-hour'));

    this.timeVal = this.timeVal.set('hour', hh);

    this.displayTime();
  }

  minuteClicked(ev) {
    let mm = parseInt(ev.target.closest('td,th').getAttribute('data-minute'));

    this.timeVal = this.timeVal.set('minute', mm);

    this.displayTime();
  }

  accept() {
    this.timeHide();
    this.resolve(this.timeVal);
  }

  abort() {
    this.timeHide();
    this.reject();
  }

  displayTime() {
    let [hour, minute] = this.dayjsToHHMM(this.timeVal);
    let [ohour, ominute] = this.dayjsToHHMM(this.origVal);

    // clear classes
    for (let i=0; i<24; i++) {
      this.model.hourClasses[i] = '';
    }

    for (let i=0; i<60; i++) {
      this.model.minuteClasses[i] = '';
    }

    // highlight original time
    this.model.hourClasses[parseInt(ohour)] = 'text-danger';
    this.model.minuteClasses[parseInt(ominute)] = 'text-danger'

    // highlight selected time
    this.model.hourClasses[parseInt(hour)] = 'bg-info';
    this.model.minuteClasses[parseInt(minute)] = 'bg-info';

    this.model.timeInWords = this.timeVal.format('h:mm A');
  }

  timeHide() {
    this.modal.hide();
  }

  dayjsToHHMM(tm) {
    let hour = tm.get('hour');
    let minute = tm.get('minute');
    
    if (String(minute).length == 1) minute = '0' + minute;

    return [hour, minute];
  }
}

export {MTime}