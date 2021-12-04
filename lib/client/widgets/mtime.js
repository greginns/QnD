import {MVC} from '/~static/lib/client/core/mvc.js';
import {datetimer} from '/~static/lib/client/core/datetime.js';

class MTime extends MVC {
  constructor() {
    const template = document.getElementById('widget-mtime');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 

    this.modal = new bootstrap.Modal(clone.querySelector('div.widget-mtime-modal'));

    document.addEventListener('keydown', this.escape);
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
    // tm must be datetimer
    if (!tm || !('isDatetime' in tm)) tm = datetimer();

    this.timeVal = datetimer(tm);
    this.origVal = datetimer(tm);

    this.modal.show();
    this.timeVal.seconds(0);
    this.timeVal.milliseconds(0);

    this.displayTime();
    
    return new Promise(function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(this));
  }

  hourClicked(ev) {
    let hh = parseInt(ev.target.closest('td,th').getAttribute('data-hour'));

    this.timeVal = this.timeVal.hours(hh);

    this.displayTime();
  }

  minuteClicked(ev) {
    let mm = parseInt(ev.target.closest('td,th').getAttribute('data-minute'));

    this.timeVal = this.timeVal.minutes(mm);

    this.displayTime();
  }

  escape(ev) {
    if (ev.key == 'Escape') {
      this.abort();
    }
  }

  accept() {
    this.timeHide();
    this.resolve(this.timeVal);
  }

  abort() {
    this.timeHide();
    this.reject();
  }

  timeHide() {
    this.modal.hide();
  }

  displayTime() {
    let hour = this.timeVal.hours();
    let minute = this.timeVal.minutes();
    let ohour = this.origVal.hours();
    let ominute = this.origVal.minutes();

    // clear classes
    for (let i=0; i<24; i++) {
      this.model.hourClasses[i] = '';
    }

    for (let i=0; i<60; i++) {
      this.model.minuteClasses[i] = '';
    }

    // highlight original time
    this.model.hourClasses[ohour] = 'text-danger';
    this.model.minuteClasses[ominute] = 'text-danger'

    // highlight selected time
    this.model.hourClasses[hour] = 'bg-info';
    this.model.minuteClasses[minute] = 'bg-info';

    this.model.timeInWords = this.timeVal.format('h:mm A');
  }
}

export {MTime}