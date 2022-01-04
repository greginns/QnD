const root = process.cwd();
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {ModelService} = require(root + '/lib/server/utils/services.js');
const {datetimer} = require(root + '/lib/server/utils/datetime.js');
const {Transaction} = require(root + '/lib/server/utils/db.js');
const {CSRF} = require(root + '/apps/login/models.js');
const app = getAppName(__dirname);
const models = require(root + `/apps/${app}/models.js`);
const itemModels = require(root + `/apps/items/models.js`);
const availModels = require(root + `/apps/avail/models.js`);

const services = {};
const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'h:mm A';
const timeFormatPG = 'HH:mm:SS';

const makeCSRF = async function(database, pgschema, user) {
  var CSRFToken = uuidv1();
      
  // create CSRF record
  var rec = new CSRF({token: CSRFToken, user: user});

  await rec.insertOne({database, pgschema});

  return CSRFToken;
}

const getHighestItemSeq = async function(database, pgschema, user, rsvno) {
  let recs = await models.Item.select({database, pgschema, user, rec: {rsvno}});
  if (!recs.status == 200) return -1;
  
  let data = recs.data;

  return (data.length == 0) ? 1 : parseInt(data[data.length-1].seq1) + 1;
}

const rollback = async function(trans, tm) {
  await trans.rollback();
  await trans.release();

  return tm;
}

class Item {
  constructor(database, pgschema, user) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
  }

  async create(rec) {
    let inst; 

    switch (rec.cat) {
      case 'A':
        inst = new Activity(this.database, this.pgschema, this.user);
        break;

      case 'M':
        inst = new Meal(this.database, this.pgschema, this.user);
        break;
    }

    return await inst.create(rec);
  }

  async update(rec) {
    let inst; 

    switch (rec.cat) {
      case 'A':
        inst = new Activity(this.database, this.pgschema, this.user);
        break;

      case 'M':
        inst = new Meal(this.database, this.pgschema, this.user);
        break;
    }

    return await inst.update(rec);
  } 
  
  async delete(pks) {
    let drec = {rsvno: pks.rsvno, seq1: pks.seq1}
    let irec = new models.Item(drec);

    let tm = await irec.selectOne({database: this.database, pgschema: this.pgschema, user: this.user});

    if (tm.status != 200) return tm;

    let inst; 
    let rec = tm.data;

    switch (rec.cat) {
      case 'A':
        inst = new Activity(this.database, this.pgschema, this.user);
        break;

      case 'M':
        inst = new Meal(this.database, this.pgschema, this.user);
        break;
    }

    return await inst.delete(rec);    
  }
}

class Booker {
  constructor(database, pgschema, user) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
  }

  async create(rec) {
    let tm = new TravelMessage();
    let tmKeep, res;

    this.trans = new Transaction(this.database);

    rec.seq1 = await getHighestItemSeq(this.database, this.pgschema, this.user, rec.rsvno);
    rec.snapshot.seq1 = rec.seq1;

    res = await this.trans.begin();
    if (res.status != 200) return res;

    // Start Specific
    try {
      // save activity
      tm = await this.saveItem(rec);
      if (tm.status != 200) return rollback(this.trans, tm);

      tmKeep = tm;

      // Done, Commit
      tm = await this.trans.commit();
      if (tm.status != 200) return rollback(this.trans, tm);
    }
    catch(err) {
console.log(err)            
      tm.status = 500;
      tm.type = 'text';
      tm.message = String(err);

      return rollback(this.trans, tm);
    }

    this.trans.release();
    // End Specific
   
    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tmKeep;    
  }

  async update(rec) {
    // Update row
    // We want to keep the 'Item' tm, if all good.  But return whichever tm, if bad.
    let tm = new TravelMessage();
    let tmKeep, res;

    this.trans = new Transaction(this.database);

    res = await this.trans.begin();
    if (res.status != 200) return res;

    // Start Specific
    try {
      // Start by deleting everything
      let drec = {rsvno: rec.rsvno, seq1: rec.seq1}

      tm = await this.deleteItem(drec);
      if (tm.status != 200) return rollback(this.trans, tm);

      tmKeep = tm;

      // Re-save it all
      tm = await this.saveItem(rec);
      if (tm.status != 200) return rollback(this.trans, tm);

      // Done, Commit
      tm = await this.trans.commit();

      if (tm.status != 200) return rollback(this.trans, tm);
    }
    catch(err) {
console.log(err)            
      tm.status = 500;
      tm.type = 'text';
      tm.message = String(err);

      return rollback(this.trans, tm);
    }

    this.trans.release();
    // End Specific
    
    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tmKeep;    
  }

  async delete(pks) {
    // Delete row
    let tm = new TravelMessage();
    let tmKeep, res;

    this.trans = new Transaction(this.database);

    res = await this.trans.begin();
    if (res.status != 200) return res;

    // Start Specific
    try {
      // Start by deleting everything
      let drec = {rsvno: pks.rsvno, seq1: pks.seq1}
      tm = await this.deleteItem(drec);
      if (tm.status != 200) return rollback(this.trans, tm);

      tmKeep = tm;

      // Done, Commit
      tm = await this.trans.commit();
      if (tm.status != 200) return rollback(this.trans, tm);
    }
    catch(err) {
console.log(err)      
      tm.status = 500;
      tm.type = 'text';
      tm.message = String(err);

      return rollback(this.trans, tm);
    }

    this.trans.release();
    // End Specific
    
    //if (tm.isGood()) {
    //  zapPubsub.publish(`${pgschema.toLowerCase()}.${app}.${subapp}.create`, tm.data);
    //}

    return tmKeep;    
  }
}

class Activity extends Booker{
  async saveItem(rec) {
    // Item Insert
    let tobj = new models.Item(rec);
    let tm = await tobj.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

    if (tm.status != 200) return tm;
    let tmKeep = tm;

    // Actinclude insert
    rec.seq2 = 1;
console.log(rec)
    let tobj2 = new models.Actinclude(rec);
    tm = await tobj2.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

    if (tm.status != 200) return tm;

    // Actdaily
    let dur = rec.dur;
    let date = datetimer(rec.date, dateFormat);

    for (let day=1; day<=dur; day++) {
      let daily = {};

      daily.rsvno = rec.rsvno;
      daily.seq1 = rec.seq1;
      daily.seq2 = rec.seq2;
      daily.day = day;
      daily.date = date.format(dateFormat);
      daily.ppl = rec.ppl;
      daily.qty = rec.qty;
      daily.activity = rec.code;
      daily.time = (rec.times.length > day-1) ? rec.times[day-1] : null;  // day time or null

      let tobj3 = new models.Actdaily(daily);
      tm = await tobj3.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

      if (tm.status != 200) return tm;

      tm = await this.updateActivityBooked(daily);
      if (tm.status != 200) return tm;

      date.add(1, 'day');
    }

    return tmKeep;
  }

  async deleteItem(rec) {
    let tm = await models.Actdaily.select({database: this.database, pgschema: this.pgschema, user: this.user, rec}, this.trans);
    if (tm.status != 200) return tm;
  
    for (let daily of tm.data) {
      let drec = new models.Actdaily(daily);
  
      tm = await drec.deleteOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
      if (tm.status != 200) return tm;
  
      tm = await this.removeActivityBooked(daily);
      if (tm.status != 200 && tm.status != 400) return tm;
    }
  
    tm = await models.Actinclude.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: rec}, this.trans);
    if (tm.status != 200) return tm;
  
    let irec = new models.Item(rec);
    tm = await irec.deleteOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
  
    return tm;    
  }

  async updateActivityBooked(daily) {
    // update Activitybooked based on a daily record
    // adding only
    // an updated daily record will remove then add
    let {rsvno, seq1, seq2, day, ppl, qty, activity} = daily;
    let date = datetimer(daily.date, dateFormat);  
    
    let year = date.year();
    let month = date.month();
    let dd = date.date() - 1;
    
    let booked = new Array({date: 1}, {date: 2}, {date: 3}, {date: 4}, {date: 5}, {date: 6}, {date: 7}, {date: 8}, {date: 9}, {date: 10}, {date: 11}, {date: 12}, {date: 13}, {date: 14}, {date: 15}, {date: 16},
      {date: 17}, {date: 18}, {date: 19}, {date: 20}, {date: 21}, {date: 22}, {date: 23}, {date: 24}, {date: 25}, {date: 26}, {date: 27}, {date: 28}, {date: 29}, {date: 30}, {date: 31});
    let bobj = {rsvno, seq1, seq2, day, ppl, qty};

    daily.time = daily.time || '';

    let tm = await availModels.Activitybooked.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [activity, year, month]}, this.trans);
    if (tm.status != 200 && tm.status != 400) return tm;

    if (tm.status == 200) {
      booked = tm.data.booked;
    }

    if (! (daily.time in booked[dd])) {
      booked[dd][daily.time] = {booked: ppl, qty, daily: [bobj]};
    }
    else {
      booked[dd][daily.time].booked += ppl;
      booked[dd][daily.time].qty += qty;
      booked[dd][daily.time].daily.push(bobj)
    }

    let rec = {activity, year, month, booked};
    let tobj = new availModels.Activitybooked(rec);

    // insert
    if (tm.data.length == 0) {
      tm = await tobj.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
    }
    else {
      // update
      tm = await tobj.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
    }

    return tm;
  }

  async removeActivityBooked(daily) {
    // remove daily entry from Activitybooked
    // removing only
    let {rsvno, seq1, seq2, day, activity} = daily;
    let date = datetimer(daily.date);
    
    let year = date.year();
    let month = date.month();
    let dd = date.date() - 1;
    
    daily.time = daily.time || '';

    let tm = await availModels.Activitybooked.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [activity, year, month]}, this.trans);
    if (tm.status != 200) return tm;  // not there, nothing to remove

    let booked = tm.data.booked;

    if (! (daily.time in booked[dd])) {
      return tm; // not there
    }

    // accum ppl, qty from all the other entries.  Find index from needed entry
    let pplTot = 0, qtyTot = 0, dIdx = -1;

    for (let idx=0; idx<booked[dd][daily.time].daily.length; idx++) {
      let entry = booked[dd][daily.time].daily[idx];

      if (entry.rsvno == rsvno && entry.seq1 == seq1 && entry.seq2 == seq2 && entry.day == day) {
        dIdx = idx; // the one to remove
      }
      else {
        pplTot += entry.ppl;  // add up ppl
        qtyTot += entry.qty;  // add up qty
      }
    }

    booked[dd][daily.time].booked = pplTot;
    booked[dd][daily.time].qty = qtyTot;
    if (dIdx > -1) booked[dd][daily.time].daily.splice(dIdx,1);

    let rec = {activity, year, month, booked};
    let tobj = new availModels.Activitybooked(rec);

    // update
    tm = await tobj.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

    return tm;
  }
}

class Meal extends Booker {
  async saveItem(rec) {
    // Item Insert
    let tobj = new models.Item(rec);
    let tm = await tobj.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

    if (tm.status != 200) return tm;
    let tmKeep = tm;

    // Mealinclude insert
    rec.seq2 = 1;

    let tobj2 = new models.Mealinclude(rec);
    tm = await tobj2.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

    if (tm.status != 200) return tm;

    // Mealdaily
    let dur = rec.dur;
    let date = datetimer(rec.date, dateFormat);

    for (let day=1; day<=dur; day++) {
      let daily = {};

      daily.rsvno = rec.rsvno;
      daily.seq1 = rec.seq1;
      daily.seq2 = rec.seq2;
      daily.day = day;
      daily.date = date.format(dateFormat);
      daily.ppl = rec.ppl;
      daily.qty = rec.qty;
      daily.meal = rec.code;
      daily.time = (rec.times.length > day-1) ? rec.times[day-1] : null;  // day time or null

      let tobj3 = new models.Mealdaily(daily);
      tm = await tobj3.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

      if (tm.status != 200) return tm;

      tm = await this.updateMealBooked(daily);
      if (tm.status != 200) return tm;

      date.add(1, 'day');
    }

    return tmKeep;
  }

  async deleteItem(rec) {
    let tm = await models.Mealdaily.select({database: this.database, pgschema: this.pgschema, user: this.user, rec}, this.trans);
    if (tm.status != 200) return tm;
  
    for (let daily of tm.data) {
      let drec = new models.Mealdaily(daily);
  
      tm = await drec.deleteOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
      if (tm.status != 200) return tm;
  
      tm = await this.removeMealBooked(daily);
      if (tm.status != 200 && tm.status != 400) return tm;
    }
  
    tm = await models.Mealinclude.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: rec}, this.trans);
    if (tm.status != 200) return tm;
  
    let irec = new models.Item(rec);
    tm = await irec.deleteOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
  
    return tm;    
  }

  async updateMealBooked(daily) {
    // update Mealbooked based on a daily record
    // adding only
    // an updated daily record will remove then add
    let {rsvno, seq1, seq2, day, ppl, qty, meal} = daily;
    let date = datetimer(daily.date, dateFormat);  
    
    let year = date.year();
    let month = date.month();
    let dd = date.date() - 1;
    
    let booked = new Array({date: 1}, {date: 2}, {date: 3}, {date: 4}, {date: 5}, {date: 6}, {date: 7}, {date: 8}, {date: 9}, {date: 10}, {date: 11}, {date: 12}, {date: 13}, {date: 14}, {date: 15}, {date: 16},
      {date: 17}, {date: 18}, {date: 19}, {date: 20}, {date: 21}, {date: 22}, {date: 23}, {date: 24}, {date: 25}, {date: 26}, {date: 27}, {date: 28}, {date: 29}, {date: 30}, {date: 31});
    let bobj = {rsvno, seq1, seq2, day, ppl, qty};

    daily.time = daily.time || '';

    let tm = await availModels.Mealbooked.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [meal, year, month]}, this.trans);
    if (tm.status != 200 && tm.status != 400) return tm;

    if (tm.status == 200) {
      booked = tm.data.booked;
    }

    if (! (daily.time in booked[dd])) {
      booked[dd][daily.time] = {booked: ppl, qty, daily: [bobj]};
    }
    else {
      booked[dd][daily.time].booked += ppl;
      booked[dd][daily.time].qty += qty;
      booked[dd][daily.time].daily.push(bobj)
    }

    let rec = {meal, year, month, booked};
    let tobj = new availModels.Mealbooked(rec);

    // insert
    if (tm.data.length == 0) {
      tm = await tobj.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
    }
    else {
      // update
      tm = await tobj.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
    }

    return tm;
  }

  async removeMealBooked(daily) {
    // remove daily entry from Mealbooked
    // removing only
    let {rsvno, seq1, seq2, day, meal} = daily;
    let date = datetimer(daily.date);
    
    let year = date.year();
    let month = date.month();
    let dd = date.date() - 1;
    
    daily.time = daily.time || '';

    let tm = await availModels.Mealbooked.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [meal, year, month]}, this.trans);
    if (tm.status != 200) return tm;  // not there, nothing to remove

    let booked = tm.data.booked;

    if (! (daily.time in booked[dd])) {
      return tm; // not there
    }

    // accum ppl, qty from all the other entries.  Find index from needed entry
    let pplTot = 0, qtyTot = 0, dIdx = -1;

    for (let idx=0; idx<booked[dd][daily.time].daily.length; idx++) {
      let entry = booked[dd][daily.time].daily[idx];

      if (entry.rsvno == rsvno && entry.seq1 == seq1 && entry.seq2 == seq2 && entry.day == day) {
        dIdx = idx; // the one to remove
      }
      else {
        pplTot += entry.ppl;  // add up ppl
        qtyTot += entry.qty;  // add up qty
      }
    }

    booked[dd][daily.time].booked = pplTot;
    booked[dd][daily.time].qty = qtyTot;
    if (dIdx > -1) booked[dd][daily.time].daily.splice(dIdx,1);

    let rec = {meal, year, month, booked};
    let tobj = new availModels.Mealbooked(rec);

    // update
    tm = await tobj.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

    return tm;
  }
}

class ItemService extends ModelService {
  async create({database = '', pgschema = '', user = {}, rec = {}} = {}) {
    let inst = new Item(database, pgschema, user);
    
    return await inst.create(rec);
  }

  async update({database = '', pgschema = '', user = {}, rec= {}} = {}) {
    let inst = new Item(database, pgschema, user);

    return await inst.create(rec);
  }
  
  async delete({database = '', pgschema = '', user = {}, pks = {}} = {}) {
    let inst = new Item(database, pgschema, user);

    return await inst.delete(pks);
  }  
}

// Model services
services.main = new ModelService({model: models.Main});
services.item = new ItemService({model: models.Item});

services.discount = new ModelService({model: models.Discount});
services.cancreas = new ModelService({model: models.Cancreas});

// Any other needed services
services.query = function({database = '', pgschema = '', query = '', values = []}) {
  return jsonQueryExecify({database, pgschema, query, app, values});
}

services.output = {
  main: async function(req) {
    // main admin manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/reservations/modules/res/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.main = models.Main.getColumnDefns();

      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.USER = JSON.stringify(req.session.user);

      try {
        tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
        tm.type = 'html';
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    }
    catch(err) {
      tm.status = 500;
      tm.message = err.toString();
    }

    return tm;
  },

  setup: async function(req) {
    // main setup manage page.  Needs a user so won't get here without one
    const tm = new TravelMessage();

    try {
      let ctx = {};
      let tmpl = 'apps/reservations/modules/setup/module.html';

      ctx.CSRFToken = await makeCSRF(req.session.data.database, req.session.data.pgschema, req.session.user.code);
      ctx.discount = models.Discount.getColumnDefns();
      ctx.cancreas = models.Cancreas.getColumnDefns();

      ctx.dateFormat = dateFormat;
      ctx.timeFormat = timeFormat;
      ctx.USER = JSON.stringify(req.session.user);

      try {
        tm.data = await nunjucks.render({path: [root], opts: {autoescape: true}, filters: [], template: tmpl, context: ctx});
        tm.type = 'html';
      }
      catch(err) {
        tm.status = 500;
        tm.message = err.toString();
      }
    }
    catch(err) {
      tm.status = 500;
      tm.message = err.toString();
    }

    return tm;
  },
};

services.calc = {
  pricing: async function({database = '', pgschema = '', user = {}, rec = {}} = {}) {
    // to calc price
    // cat, code, date, duration, qty, hours, times[], infants-seniors.
    
    let p = new Pricing(database, pgschema, user, rec);

    return await p.calcIt();
  },

  discount: async function({database = '', pgschema = '', user = {}, rec = {}} = {}) {
    let d = new Discount(database, pgschema, user, rec);

    return await d.calcIt();
  }
}

class Discount {
  constructor(database, pgschema, user, pobj) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.pobj = pobj;

    this.tm = new TravelMessage();
    this.discRecord = {};
  }

  async calcIt() {
    // disccode, discamt (if allowed), ppl, dur, charges
    //
    // Flat, %, per person, per person day, 
    await this.getDiscount();
    let discount = this.calc();

    if (this.discRecord.maxdisc != 0) discount = Math.min(discount, this.discRecord.maxdisc);

    this.tm.data = (Math.round(discount*100)/100).toFixed(2);

    return this.tm;
  }

  calc() {
    let amt = parseFloat(this.discRecord.amount) || parseFloat(this.pobj.discamt);    // override 0 amount in setup with entered amount
    let basis = this.discRecord.basis;
    let ppl = parseInt(this.pobj.ppl);
    let dur = parseInt(this.pobj.dur);

    if (! ('basis' in this.discRecord)) return 0;
    if (!this.discRecord.active) return 0;

    switch (basis) {
      case 'F':
        return amt;

      case '%':
        return (amt/100) * parseFloat(this.pobj.charges);

      case 'P':
        return ppl*amt;

      case 'D':
        return ppl*amt*dur;

      default:
        return 0;
    }
  }

  async getDiscount() {
    let res = await models.Discount.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [this.pobj.disccode]});
    if (res.status == 200) {
      this.discRecord = res.data;
    }
  }

}

class Pricing {
  // Flat, Per Person, Combined.
  // PP is adult, youth, etc.
  // Flat is qty plus (ppl - addlppl + 1)
  // Combined is qty, plus adults, youth, etc.
  // may need a 4th: qty + (ppl - (maxppl * qty))
  //
  // Regular, Tiered, Tiered A/Y.
  // Regular is find matching desc
  // Tiered is find slot based on ppl/qty (if flat)
  // Tiered A/Y is strictly adult/youth

  constructor(database, pgschema, user, pobj) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.pobj = pobj;

    this.tm = new TravelMessage();
    this.rate = '';
    this.plevel = '';
    this.errMsg = '';
    this.dateFormat = dateFormat;
    this.timeFormat = timeFormatPG;

    this.infantList = ['infant', 'infants', 'baby', 'babies'];
    this.childList = ['child', 'children', 'kid', 'kids'];
    this.youthList = ['youth', 'youths', 'teen', 'teens', 'adolescent', 'adolescents', 'son', 'sons', 'daughter', 'daughters', 'student', 'students'];
    this.adultList = ['adult', 'adults', 'father', 'fathers', 'mother', 'mothers', 'supervisor', 'supervisors', 'teacher', 'teachers', 'parent', 'parents'];
    this.seniorList = ['senior', 'seniors', 'aged', 'old folks'];

    this.data = {pdesc: ['','','','','','','','Complimentary'], pqty: [0,0,0,0,0,0,0,0], price: [0,0,0,0,0,0,0,0], pextn: [0,0,0,0,0,0,0,0]}

    switch(pobj.cat) {
      case 'A':
        this.ratesModel = 'Actrates';
        this.priceModel = 'Actprices';
        break;

      case 'L':
        this.ratesModel = 'Lodgrates';
        this.priceModel = 'Lodgprices';
        break;

      case 'M':
        this.ratesModel = 'Mealrates';
        this.priceModel = 'Mealprices';
        break;
    }
  }

  async calcIt() {
    await this.getBasicData();

    this.setPriceDescs();
    this.setQtys();
    await this.getPrices();
    this.calcExtn();
    this.formatPrices();

    this.tm.data = this.data;

    return this.tm;
  }

  async getBasicData() {
    let rate = await itemModels[this.ratesModel].selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [this.pobj.code, this.pobj.rateno]});
    if (rate.status != 200) return rate;

    this.rate = rate.data;

    let plevel = await itemModels.Pricelevel.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [this.rate.pricelevel]});
    if (plevel.status != 200) return plevel;

    this.plevel = plevel.data;
  }

  async getPrices() {
    let timeno = -1, price;
    let code = this.pobj.code, rateno = this.pobj.rateno, times = this.pobj.times || [''];
    let dur = parseInt(this.pobj.dur) || 1;
    let startDate = datetimer(this.pobj.date, this.dateFormat);
    let endDate = datetimer(startDate).add(dur-1, 'days');
    let prices = [0,0,0,0,0,0,0,0];

    let lod = startDate.listOfDays(endDate);
    
    for (let [yr, mo, days] of lod) {
      for (let day of days) {
        timeno++;
        
        let time = (timeno > times.length) ? times[0] : times[timeno];

        if (time) {
          let time1 = datetimer(time, this.timeFormat);
          let hh = time1.hours(), mm = time1.minutes();

          price = await itemModels[this.priceModel].selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [code, rateno, yr, mo, hh, mm]});
  
          if (price.status != 200) {
            price = await itemModels[this.priceModel].selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [code, rateno, yr, mo, 0, 0]});
            }
        }
        else {
          price = await itemModels[this.priceModel].selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [code, rateno, yr, mo, 0, 0]});
        }

        if (price.status == 200) {
          let priceData = price.data.prices;
          let slot = priceData[day-1];

          for (let i=0; i<7; i++) {
            prices[i] += parseFloat(slot[i]) || 0;
          }
        }

        if (this.rate.ratebase2 != 'D') {
          break;
        }
      }
    }

    this.data.price = prices;
  }

  calcExtn() {
    for (let i=0; i<7; i++) {
      this.data.pextn[i] = Math.round(this.data.pqty[i] * this.data.price[i] * 1000)/1000;
    }
  }

  formatPrices() {
    for (let i=0; i<this.data.price.length; i++) {
      this.data.price[i] = this.data.price[i].toFixed(2);
      this.data.pextn[i] = this.data.pextn[i].toFixed(2);
    }
  }

  setPriceDescs() {
    for (let i=0; i<6; i++) {
      this.data.pdesc[i] = this.plevel['desc'+(i+1)] || '';
    }

    this.data.pdesc[6] = this.plevel.addl || '';
  }

  setQtys() {
    switch(this.rate.ratebase1) {
      case 'P':   // per person
        switch(this.plevel.type) {
          case 'R':
            this.mapISToQty();
            break;

          case 'T1':
            this.doTier1()
            break;

          case 'T2':
            this.doTier2()
            break;
        }
        
        break;

      case 'F':   // flat     1 into slot 0, addl ppl into 7
        this.doAddl() 
        break;

      case 'C':   // combined (flat and pp)  qty into slot 1, ppl into 2-6
        this.mapISToQty();

        this.data.pqty[0] = this.pobj.qty;
        break;
    }
  }

  doTier1() {
    // simply slot ppl/qty into one slot.
    // can be ppl or qty
    let ppl, msg;

    if (this.rate.ratebase1 == 'P') {
      ppl = parseInt(this.pobj.ppl);
      msg = 'Group Size ';
    }
    else {
      ppl = parseInt(this.pobj.qty);
      msg = 'Quantity ';
    }
    
    let pl = this.plevel;
    let max = Math.max(pl.tier1max, pl.tier2max, pl.tier3max, pl.tier4max, pl.tier5max, pl.tier6max);

    if (ppl < pl.tier1min) {
      this.errMsg = `${msg} of ${ppl} is less than the minimum required of ${pl.tier1min}`;
      return;
    }

    if (ppl > max) {
      this.errMsg = `${msg} of ${ppl} is more than the maximum of ${max}`;
      return;
    }

    if (ppl >= pl.tier1min && ppl < pl.tier1max) {
      this.data.pqty[0] = ppl;
    }
    else if (ppl >= pl.tier2min && ppl < pl.tier2max) {
      this.data.pqty[1] = ppl;
    }
    else if (ppl >= pl.tier3min && ppl < pl.tier3max) {
      this.data.pqty[2] = ppl;
    }
    else if (ppl >= pl.tier4min && ppl < pl.tier4max) {
      this.data.pqty[3] = ppl;
    }
    else if (ppl >= pl.tier5min && ppl < pl.tier5max) {
      this.data.pqty[4] = ppl;
    }
    else {
      this.data.pqty[5] = ppl;
    }
  }

  doTier2() {
    // Adults into one of first three slots, Youth into last 3 slots
    // No qty
    let adults = parseInt(this.pobj.adults) + parseInt(this.pobj.seniors);
    let youth = parseInt(this.pobj.infants) + parseInt(this.pobj.children) + parseInt(this.pobj.youth);
    let pl = this.plevel;
    let maxa = Math.max(pl.tier1max, pl.tier2max, pl.tier3max);
    let maxy = Math.max(pl.tier4max, pl.tier5max, pl.tier6max);

    if (adults < pl.tier1min) {
      this.errMsg = `Adult size of ${adults} is less than the minimum required of ${pl.tier1min}`;
      return;
    }

    if (adults > maxa) {
      this.errMsg = `Adult size of ${ppl} is more than the maximum of ${maxa}`;
      return;
    }

    if (youth < pl.tier4min) {
      this.errMsg = `Youth size of ${youth} is less than the minimum required of ${pl.tier4min}`;
      return;
    }

    if (youth > maxy) {
      this.errMsg = `Youth size of ${youth} is more than the maximum of ${maxy}`;
      return;
    }    

    if (adults >= pl.tier1min && adults < pl.tier1max) {
      this.data.pqty[0] = adults;
    }
    else if (adults >= pl.tier2min && adults < pl.tier2max) {
      this.data.pqty[1] = adults;
    }
    else {
      this.data.pqty[2] = adults;
    }

    if (youth >= pl.tier3min && youth < pl.tier3max) {
      this.data.pqty[3] = youth;
    }
    else if (youth >= pl.tier4min && youth < pl.tier4max) {
      this.data.pqty[4] = youth;
    }
    else {
      this.data.pqty[5] = youth;
    }
  }

  doAddl() {
    // fgure out how many addl there are.
    let addlppl = parseInt(this.rate.addlppl);  // starting level
    let ppl = parseInt(this.pobj.ppl);

    this.data.pqty[6] = Math.max(ppl-addlppl+1, 0);
  }

  mapISToQty() {
    // map infants-seniors qty to proper pricing slot.
    let list1 = {infants: [this.infantList, this.childList, this.youthList], 'children': [this.childList, this.youthList, this.infantList], 'youth': [this.youthList, this.childList, this.infantList]};
    let list2 = {adults: [this.adultList, this.seniorList], seniors: [this.seniorList, this.adultList]};

    for (let age in list1) {
      let qty = parseInt(this.pobj[age]) || 0;

      if (qty > 0) {
        let spot = -1;

        for (let list of list1[age]) {

          for (let i=1; i<7; i++) {
            if (list.indexOf(this.plevel['desc'+i].toLowerCase()) > -1) {
              spot = i-1;
              break;
            }
          }

          if (spot != -1) break;
        }

        if (spot == -1) spot = (this.rate.ratebase1 == 'C') ? 1 : 0;

        this.data.pqty[spot] += qty;
      }
    }

    for (let age in list2) {
      let qty = parseInt(this.pobj[age]) || 0;

      if (qty > 0) {
        let spot = -1;
  
        for (let list of list2[age]) {
          for (let i=1; i<7; i++) {
            if (list.indexOf(this.plevel['desc'+i].toLowerCase()) > -1) {
              spot = i-1;
              break;
            }
          }

          if (spot != -1) break;
        }

        if (spot == -1) spot = (this.rate.ratebase1 == 'C') ? 1 : 0;

        this.data.pqty[spot] += qty;
      }
    }
  }
}

module.exports = services;