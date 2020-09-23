import {MVC} from '/~static/lib/client/core/mvc.js';

class MTime extends MVC {
  constructor() {
    const template = document.getElementById('widget-mtime');
    const clone = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(clone);

    super(clone); 

    this.modal = this._section.getElementsByClassName('widget-mtime-modal');
  }

  createModel() {
    this.model.timeInWords = '';
    this.model.orig = '';
    this.model.hour = ''
    this.model.minute = '';
    this.model.ampm = '';
    this.model.time = '';

    this.model.hourClasses = [];
    this.model.minuteClasses = [];
    
    this.resolve = '';
  }

  time(tm) {
    // tm must be Date.toJSON
    var hour, minute, ampm;
    
    if (!moment(tm).isValid()) tm = moment();

    this.model.orig = moment(tm);

    this._modalOpen();

    [hour, minute, ampm] = this.momentToAMPM(this.model.orig);

    this.model.hour = hour;
    this.model.minute = minute;
    this.model.ampm = ampm;

    this.makeTime();
    
    return new Promise(function(resolve) {
      this.resolve = resolve;
    }.bind(this));
  }

  hourClicked(ev) {
    var hr = ev.target.closest('td,th').getAttribute('data-hour');
    
    if (!hr) return;
    
    this.model.ampm = hr.substr(2);
    this.model.hour = hr.substr(0,2);

    this.makeTime();
  }

  minuteClicked(ev) {
    this.model.minute = ev.target.closest('td,th').getAttribute('data-minute');

    this.makeTime();
  }

  accept() {
    var hour = this.model.hour;
    var minute = this.model.minute;
    var ampm = this.model.ampm;
    var tm, cb;

    if (!hour) {
      this.timeClosed();
      return;
    }

    if (!minute) minute = '00';

    tm = hour + ':' + minute + ' ' + ampm;
    tm = moment(tm, 'hh:mm A');

    this.timeHide();
    this.resolve(tm);
  }

  makeTime() {
    var hour = this.model.hour;
    var minute = this.model.minute;
    var ampm = this.model.ampm;
    var ohour, ominute, oampm;

    for (var i=0; i<24; i++) {
      this.model.hourClasses[i] = '';
    }

    for (var i=0; i<60; i++) {
      this.model.minuteClasses[i] = '';
    }

    if (hour) this.model.timeInWords = hour + ':' + minute + ' ' + ampm;

    // highlight original time
    var orig = this.model.orig;

    if (orig) {
      [ohour, ominute, oampm] = this.momentToAMPM(orig);

      if (ohour == 12) ohour = 0;
      if (oampm == 'PM') ohour += 12;

      this.model.hourClasses[ohour] = 'text-danger';
      this.model.minuteClasses[ominute] = 'text-danger';
    }

    // highlight selected time
    if (hour) {
      var ohour = parseInt(hour, 10);
      var ominute = parseInt(minute, 10);

      if (ohour == 12) ohour = 0;
      if (ampm == 'PM') ohour += 12;

      this.model.hourClasses[ohour] = 'bg-warning';
      this.model.minuteClasses[ominute] = 'bg-warning';
    }
  }

  timeClose() {
    var cb = this.model.callback;
    var orig = this.model.orig;

    if (cb) cb(orig);

    this.timeHide();
  }

  timeHide() {
    this._modalClose();
  }

  momentToAMPM(tm) {
    var hour = tm.hour();
    var minute = tm.minute();
    var ampm = 'AM';

    if (hour > 11) {
      hour = hour-12;
      ampm = 'PM';
    }

    if (minute.length == 1) minute = '0' + minute;

    return [hour, minute, ampm];
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

export {MTime}

/*
// await QnD.widgets.mtime.time(momentDate);
*/