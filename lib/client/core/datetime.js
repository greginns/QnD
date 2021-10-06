const langs = {
  en: {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthShortNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayShortNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ordinals: [
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', //  1-20
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 21-40
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 41-60
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 61-80
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 81-100
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 101-120
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 121-140
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 141-160
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 161-180
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 181-200
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 201-220
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 221-240
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 241-260
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 261-280
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 281-300
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 301-320
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 321-340
      'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', // 341-360
      'st', 'nd', 'rd', 'th', 'th'                                                                                            // 361-365
    ],
  }
}

class Datetime {
  constructor(val, fmt, lang) {
    // dt is a date in some 'fmt'
    // use fmt to break up the date into pieces then create a js Date() object with those pieces
    lang = lang || 'en';

    this._TOKENS = 'aAdDeEgGhHkmMNoQsSWyYxXzZ';      // all special characters
    this._monthNames = langs[lang].monthNames;
    this._monthShortNames = langs[lang].monthShortNames;
    this._dayNames = langs[lang].dayNames;
    this._dayShortNames = langs[lang].dayShortNames;
    this._ordinals = langs[lang].ordinals;
    this._daysInMonth = [31, 28, 31, 30, 31, 30, 30, 31, 30, 31, 30, 31];
    this.isInvalid = false;
    this.isValid = true;
    this.isDatetime = true;

    if (fmt) {
      this._tokenList = this._parseFormat(fmt);
      this._assignTokenValues(val);

      if (val) this._makeDatetime();
    }
    else if (val) {
      if (typeof val == 'object' && 'isDatetime' in val) {
        // clone existing Datetime
        this._datetime = new Date(val.year(), val.month()-1, val.date(), val.hours(), val.minutes(), val.seconds(), val.milliseconds());
      }
      else if (Array.isArray(val)) {
        let [yr, mo, dy, h, m, s, ms] = val;

        this._datetime = new Date(yr || 1961, (mo || 6) -1, dy || 1, h || 0, m || 0, s || 0, ms || 0);
      }
      else {
        this._datetime = new Date(val);
      }
    }
    else {
      this._datetime = new Date();
    }
  }
  
  format(fmt) {
    let fmtList = this._parseFormat(fmt);
    let os = '';
    
    for (let entry of fmtList) {
      if (entry.type == 'sep') {
        os += entry.sep;
        continue;
      }

      if (entry.type == 'token') {
        switch(entry.token) {
          // Year
          case 'YY':    // 21, 22
            os += (''+this.year()).substr(2);
            break;

          case 'YYYY':  // 2021, 2022
            os += this.year();
            break;

          // Month
          case 'M':   // 1, 2
            os += parseInt(this.month());
            break;

          case 'Mo':  // 1st, 2nd
            os += this._ordinalize(this.month());
            break;

          case 'MM':  // 01, 02
            os += this._zeroPad(this.month(), 2);
            break;

          case 'MMM':   // Jan, Feb
            os += this._monthShortNames[this.month()-1];
            break;

          case 'MMMM':  // January, February
            os += this._monthNames[this.month()-1];
            break;

            // Day of the week
          case 'd':   // 0, 1
            os += this.day();
            break;

          case 'do':  // 0th, 1st
            os += this._ordinalize(this.day());
            break;

          case 'dd':  // Su, Mo
            os += this._dayShortNames[this.day()].substr(0,2);
            break;
  
          case 'ddd':   // Sun, Mon
            os += this._dayShortNames[this.day()];
            break;

          case 'dddd':  // Sunday, Monday
            os += this._dayNames[this.day()];
            break;       

          // Day of the Month
          case 'D':   // 1,2
            os += parseInt(this.date());
            break;
  
          case 'DD':  // 01, 02
            os += this._zeroPad(this.date(), 2);
            break;
      
          case 'Do':  // 1st, 2nd
            os += this._ordinalize(this.date());
            break;
  
          // Day of the Year
          case 'DDD': // 1,2
            os += this._getDayOfYear();
            break;

          case 'DDDo':  // 1st, 2nd
            os += this._ordinalize(this._getDayOfYear());
            break;   

          case 'DDDD':  // 001, 002
            os += this._zeroPad(this._getDayOfYear(), 3);
            break;
  
          // Week of Year
          case 'W': // 1, 2
            os += this._getWeekOfYear();
            break;

          case 'Wo':  // 1st, 2nd
            os += this._ordinalize(this._getWeekOfYear());
            break;

          case 'WW':  // 01, 02
            os += this._zeroPad(this._getWeekOfYear(), 2);
            break;     
            
          // Hours
          case 'H':
            os += parseInt(this.hours());
            break;

          case 'HH':
            os += this._zeroPad(this.hours(), 2);
            break;

          case 'h':
            os += this._24to12(this.hours());
            break;

          case 'hh':
            os += this._zeroPad(this._24to12(this.hours()), 2);
            break;            

          case 'A':
            os += (this.hours() > 11) ? 'PM' : 'AM';
            break;

          case 'a':
            os += (this.hours() > 11) ? 'pm' : 'am';
            break;            

          // Minutes
          case 'm':
            os += parseInt(this.minutes());
            break;

          case 'mm':
            os += this._zeroPad(this.minutes(), 2);
            break;  
            
          // Seconds
          case 's':
            os += parseInt(this.seconds());
            break;

          case 'ss':
            os += this._zeroPad(this.seconds(), 2);
            break;  

          // Milliseconds
          case 'S':
            os += parseInt(this.milliseconds());
            break;

          case 'SS':
            os += this._zeroPad(this.milliseconds(), 2);
            break;                          

          case 'SSS':
            os += this._zeroPad(this.milliseconds(), 3);
            break;                                      
        }
      }
    }

    return os;
  }

  day() {
    return this._datetime.getDay();
  }

  year(y) {
    if (y != undefined) {
      this._datetime.setFullYear(y);
      return this;
    }

    return this._datetime.getFullYear();
  }

  month(m) {
    if (m != undefined) {
      this._datetime.setMonth(m-1);
      return this;  
    }
    
    return this._datetime.getMonth() + 1;
  }

  date(d) {
    if (d != undefined) {
      this._datetime.setDate(d);
      return this
    }

    return this._datetime.getDate();
  }

  hours(h) {
    if (h != undefined) {
      this._datetime.setHours(h);
      return this;
    }

    return this._datetime.getHours();
  }

  minutes(m) {
    if (m != undefined) {
      this._datetime.setMinutes(m);
      return this;
    }

    return this._datetime.getMinutes();
  }

  seconds(s) {
    if (s != undefined) {
      this._datetime.setSeconds(s);
      return this;
    }

    return this._datetime.getSeconds();
  }

  milliseconds(m) {
    if (m != undefined) {
      this._datetime.setMilliseconds(m);
      return this;
    }

    return this._datetime.getMilliseconds();
  }

  toJSON() {
    return this._datetime.toJSON();
  }

  isSame(dt, asWhat) {
    if (asWhat.toLowerCase() == 'ymd') return (dt['year']() == this['year']() && dt['month']() == this['month']() && dt['date']() == this['date']()); 

    return dt[asWhat]() == this[asWhat]();
  }

  add(num, toWhat) {
    switch (toWhat.toLowerCase()) {
      case 'year':
      case 'years':
        this.year(this.year() + num);
        break;

      case 'month':
      case 'months':
        this.month(this.month() + num);
        break;

      case 'day':
      case 'days':
        this.date(this.date() + num);
        break;

      case 'hour':
      case 'hours':
        this.hours(this.hours() + num);
        break;

      case 'minute':
      case 'minutes':
        this.minutes(this.minutes() + num);    
        break;

      case 'second':
      case 'seconds':
        this.seconds(this.seconds() + num);    
        break;

      case 'millisecond':
      case 'milliseconds':
        this.milliseconds(this.milliseconds() + num);    
        break;        
    }

    return this;
  }

  subtract(num, toWhat) {
    return this.add(-num, toWhat);
  }

/******* Internal methods  *******/
  _parseFormat(fmt) {
    // build list of tokens and separators
    let list = [];
    let fml = fmt.length;
    let inToken = false;
    let inSep = true;
    let token = '';
    let sep = '';

    for (let p=0; p<fml; p++) {
      let char = fmt.substr(p,1);

      if (this._TOKENS.indexOf(char) == -1) {
        // separator
        if (inToken) {
          if (token) list.push({type: 'token', token});
        }

        inSep = true;
        inToken = false;
        token = '';
        sep += char;
      }
      else {
        // token
        if (inSep) {
          if (sep) list.push({type: 'sep', sep});
        }

        inSep = false;
        inToken = true;
        sep = '';
        token += char;
      }
    }

    if (inToken) {
      if (token) {
        list.push({type: 'token', token});
        list.push({type: 'sep', sep: ''});
      }
    }
    else {
      if (sep) list.push({type: 'sep', sep});
    }    

    return list;
  }

  _assignTokenValues(value) {
    // go through value and get token values based on separators
    let start = 0, idx = -1;

    for (let entry of this._tokenList) {
      idx++;

      if (entry.type == 'sep') {
        let end = value.indexOf(entry.sep, start);

        if (end == -1 || entry.sep == '') end = value.length + 1;

        let val = value.substring(start, end);
        if (idx > 0) this._tokenList[idx-1].value = val;

        start = end + entry.sep.length;
      }
    }
  }

  _makeDatetime() {
    let defaultDate = new Date();

    let year = defaultDate.getFullYear();
    let month = defaultDate.getMonth() + 1;
    let day = defaultDate.getDate();
    let hour = defaultDate.getHours();
    let minute = defaultDate.getMinutes();
    let second = defaultDate.getSeconds();
    let millisecond = defaultDate.getMilliseconds();
    let ampm = 'AM';

    for (let iter=0; iter<2; iter++) {  // loop twice in order to get 'look ahead' data.  ie "DDD YYYY", day of the year and year - need to know year for days to work properly, ie leap year
      for (let entry of this._tokenList) {
        switch(entry.token) {
          case 'YY':
          case 'YYYY':
            year = parseInt(entry.value);
            break;

          case 'M':
          case 'Mo':
          case 'MM':
            month = parseInt(entry.value) - 1;
            break;

          case 'MMM':
          case 'MMMM':
            month = this._wordyMonthToNumber(entry.value);
            break;

          case 'D':
          case 'Do':
          case 'DD':
            day = parseInt(entry.value);
            break;

          case 'DDD':
          case 'DDDo':
          case 'DDDD':
            [month, day] = this._daynoToMonthDay(year, entry.value);
            break;
                
          case 'A':
          case 'a':
            ampm = entry.value.toUpperCase();
            break;

          case 'H':
          case 'HH':
            hour = parseInt(entry.value);
            break;

          case 'h':
          case 'hh':
            hour = this._12to24(entry.value, ampm);
            break;

          case 'm':
          case 'mm':
            minute = parseInt(entry.value);
            break;

          case 's':            
          case 'ss':
            second = parseInt(entry.value);
            break;

          case 'S':
          case 'SS':
          case 'SSS':
            millisecond = parseInt(entry.value);
            break;
        }
      }
    }

    this._datetime = new Date(year, month, day, hour, minute, second, millisecond);

    this.isInvalid = (this._datetime == 'Invalid Date') ? true : false;
    this.isValid = (this._datetime == 'Invalid Date') ? false : true;
  }

  _ordinalize(num) {
    return num + this._ordinals[num-1];
  }

  _zeroPad(num, len) {
    num = String(num);

    while (num.length < len) {
      num = '0' + num;
    }

    return num;
  }

  _isLeapYear(yr) {
    // evenly divisible by 4, not by 100, by 400.
    yr = yr || this._datetime.getFullYear();

    return (yr % 4 != 0 || (yr % 100 == 0 && yr % 400 == 0)) ? false : true;
  }

  _leapYearAddition(yr) {
    return (this._isLeapYear(yr)) ? 1 : 0;
  }

  _getDayOfYear() {
    let mo = this.month()-1;
    let day = this._datetime.getDate();
    let days = 0;

    for (let m = 0; m<mo; m++) {
      days += this._daysInMonth[m];
    }

    days += day;
    if (mo > 1) days += this._leapYearAddition();

    return days;
  }

  _getWeekOfYear() {
    let d = new Date(Date.UTC(this._datetime.getFullYear(), this.month()-1, this._datetime.getDate()));
    let dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));

    return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
  }

  _wordyMonthToNumber(wm) {
    if (!wm) return null;

    wm = wm.toLowerCase();

    for (let i=0; i<12; i++) {
      if (this._monthNames[i].toLowerCase() == wm) return i+1;
      if (this.monthShortNames[i].toLowerCase() == wm) return i+1;
    }

    return 1;
  }

  _daynoToMonthDay(year, day) {
    let mo,dsim;

    for (mo=0; mo<12; mo++) {
      dsim = this._daysInMonth[mo];

      if (mo == 1) dsim += this._leapYearAddition(year);

      if (day < dsim) break;

      day -= dsim;
    }

    return [mo, day];
  }

  _12to24(h, ampm) {
    h = parseInt(h);

    return (h < 12 && ampm == 'PM') ? h + 12 : h;
  }

  _24to12(hrs) {
    return (hrs > 12) ? hrs-12 : hrs;
  }
}

const datetimer = function(val, fmt, lang) {
  return new Datetime(val, fmt, lang);
}

export {Datetime, datetimer}
//module.exports = {Datetime, datetimer}