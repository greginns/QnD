const root = process.cwd();

const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {datetimer} = require(root+ '/lib/server/utils/datetime.js')
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');

const availModels = require(root + `/apps/avail/models.js`);
const itemModels = require(root + `/apps/items/models.js`);
const resModels = require(root + `/apps/reservations/models.js`);

const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'H:mm A';

const zeroPad = function(num, len) {
  num = String(num);

  while (num.length < len) {
    num = '0' + num;
  }

  return num;
}

const getFilters = function(filters) {
  filters = JSON.parse(filters);

  let fromdate = datetimer(filters.fromdate, dateFormat);
  let todate = datetimer(filters.todate, dateFormat);
  let time = datetimer(filters.time, timeFormat);

  return {fromdate, todate, time};
}

const getActdailys = async function(database, pgschema, user, code, days) {
  let dailys = {}

  let res = await itemModels.Actdaily.select({database, pgschema, user, rec: {activity: code}});

  if (res.status == 200) {
    for (let i=1; i<days+1; i++) {
      dailys[i] = {ress: [], tts: []};
    }

    for (let rec of res.data) {
      let day = rec.dayno;

      if (day <= days) {   // in case more than days worth of actdaily entries were made
        dailys[day].ress.push(rec.actres1, rec.actres2, rec.actres3, res.actres4);
        dailys[day].tts.push(rec.acttot1, rec.acttot2, rec.acttot3, res.acttot4);
      }      
    }
  }

  return dailys;
};

const selectActivities = async function(database, pgschema, user, code, listOfDays) {
  // data: {code, name, dates: {yyyy-mm-dd: {times: {time: {limit, booked, avail, boo, bow}}, res: {}, tts: {}}}}
  let data = {};
  let activity, dailys;

  activity = await itemModels.Activity.selectOne({database, pgschema, user, pks: [code]});
  dailys = await getActdailys(database, pgschema, user, code, activity.days);

  if (activity.status == 200) {
    data.code = code;
    data.name = activity.data.name;
    data.dates = {};
  }
  else {
    return data;
  }

  // Activity
  for (let [yr, mo, days] of listOfDays) {
    // schedule
    let res = await itemModels.Actsched.selectOne({database, pgschema, user, pks: [code, yr, mo]});

    if (res.status == 200) {
      let sched = res.data.sched;

      for (let day of days) {
        let times = sched[day-1] || {};
        let key = `${yr}-${zeroPad(mo, 2)}-${zeroPad(day, 2)}`;

        if (! (key in data.dates)) data.dates[key] = {times: {}};

        for (let time in times) {
          let t = times[time];
          let limit = parseInt(t.limit);

          data.dates[key].times[time] = {limit, boo: t.boo, bow: t.bow, booked: 0, avail: limit};
        }
      }
    }

    // booked
    res = await availModels.Activitybooked.selectOne({database, pgschema, user, pks: [code, yr, mo]});

    if (res.status == 200) {
      let booked = res.data.booked;

      for (let day of days) {
        let times = booked[day-1] || {};
        let key = `${yr}-${zeroPad(mo, 2)}-${zeroPad(day, 2)}`;

        if (! (key in data.dates)) data.dates[key] = {times: {}};

        for (let time in times) {
          let t = times[time];
          let b = parseInt(t.booked);

          if (! (time in data.dates[key].times)) {
            data.dates[key].times[time] = {limit: 0, booked: b, avail: -b};
          }
          else {
            data.dates[key].times[time].booked = b;
            data.dates[key].times[time].avail = data.dates[key].times[time].limit - b;
          }
        }
      }
    }
  }

  // Resources/Times
  // factor in trip length (days) when checking res/tts, baiscally from day 1 to day x+trip.length;

  return data;
}

const selectMeals = async function(database, pgschema, user, code, listOfDays) {
  // data: {code, name, dates: {yyyy-mm-dd: {times: {time: {limit, booked, avail}}}}
  let data = {};
  let meal;

  meal = await itemModels.Meals.selectOne({database, pgschema, user, pks: [code]});

  if (meal.status == 200) {
    data.code = code;
    data.name = meal.data.name;
    data.dates = {};
  }
  else {
    return data;
  }

  for (let [yr, mo, days] of listOfDays) {
    // schedule
    let res = await itemModels.Mealsched.selectOne({database, pgschema, user, pks: [code, yr, mo]});

    if (res.status == 200) {
      let sched = res.data.sched;

      for (let day of days) {
        let times = sched[day-1] || {};
        let key = `${yr}-${zeroPad(mo, 2)}-${zeroPad(day, 2)}`;

        if (! (key in data.dates)) data.dates[key] = {times: {}};

        for (let time in times) {
          let t = times[time];
          let limit = parseInt(t.limit);

          data.dates[key].times[time] = {limit, booked: 0, avail: limit};
        }
      }
    }

    // booked
    res = await availModels.Mealbooked.selectOne({database, pgschema, user, pks: [code, yr, mo]});

    if (res.status == 200) {
      let booked = res.data.booked;

      for (let day of days) {
        let times = booked[day-1] || {};
        let key = `${yr}-${zeroPad(mo, 2)}-${zeroPad(day, 2)}`;

        if (! (key in data.dates)) data.dates[key] = {times: {}};

        for (let time in times) {
          let t = times[time];
          let b = parseInt(t.booked);

          if (! (time in data.dates[key].times)) {
            data.dates[key].times[time] = {limit: 0, booked: b, avail: -b};
          }
          else {
            data.dates[key].times[time].booked = b;
            data.dates[key].times[time].avail = data.dates[key].times[time].limit - b;
          }
        }
      }
    }
  }

  return data;
}

const services = {};

services.avail = {
  cat: async function({database='', pgschema='', user={}, cat='', filters={}}={}) {
    let {fromdate, todate, time} = getFilters(filters);
    let listOfDays = fromdate.listOfDays(todate);
    let data = {}, item, res;

    switch(cat) {
      case 'A':
        res = await itemModels.Activity.select({database, pgschema, user, rec: {active: true}});

        if (res.status == 200) {
          for (let rec of res.data) {
            item = await selectActivities(database, pgschema, user, rec.code, listOfDays);
            data[rec.code] = item;
          }
        }
        else {
          return res;
        }

        break;

      case 'M':
        res = await itemModels.Meals.select({database, pgschema, user, rec: {active: true}});

        if (res.status == 200) {
          for (let rec of res.data) {
            item = await selectMeals(database, pgschema, user, rec.code, listOfDays);
            data[rec.code] = item;
          }
        }
        else {
          return res;
        }

        break;
    }

    let tm = new TravelMessage();
    tm.data = data;

    return tm;   
  },

  group: async function({database='', pgschema='', user={}, cat='', grp='', filters={}}={}) {
    let {fromdate, todate, time} = getFilters(filters);
    let listOfDays = fromdate.listOfDays(todate);
    let data = {}, item, res;

    switch(cat) {
      case 'A':
        res = await itemModels.Activity.select({database, pgschema, user, rec: {actgroup: grp, active: true}});

        if (res.status == 200) {
          for (let rec of res.data) {
            item = await selectActivities(database, pgschema, user, rec.code, listOfDays);
            data[rec.code] = item;
          }
        }

        break;

      case 'M':
        res = await itemModels.Meals.select({database, pgschema, user, rec: {meallocn: grp, active: true}});

        if (res.status == 200) {
          for (let rec of res.data) {
            item = await selectMeals(database, pgschema, user, rec.code, listOfDays);
            data[rec.code] = item;
          }
        }

        break;        
    }

    let tm = new TravelMessage();
    tm.data = data;

    return tm;
  },

  code: async function({database='', pgschema='', user={}, cat='', code='', filters={}}={}) {
    let {fromdate, todate, time} = getFilters(filters);
    let listOfDays = fromdate.listOfDays(todate);
    let data = {}, item;

    switch(cat) {
      case 'A':
        item = await selectActivities(database, pgschema, user, code, listOfDays);

        data[code] = item;
        break;

      case 'M':
        item = await selectActivities(database, pgschema, user, code, listOfDays);

        data[code] = item;
        break;
    }

    let tm = new TravelMessage();
    tm.data = data;

    return tm;
  }
};

module.exports = services