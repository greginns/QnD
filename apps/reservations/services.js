const root = process.cwd();
const { inOperator } = require('nunjucks/src/lib');
const uuidv1 = require('uuid/v1');

const nunjucks = require(root + '/lib/server/utils/nunjucks.js');
const {TravelMessage} = require(root + '/lib/server/utils/messages.js');
const {getAppName} = require(root + '/lib/server/utils/utils.js');
const {jsonQueryExecify} = require(root + '/lib/server/utils/sqlUtil.js');
const {ModelService} = require(root + '/lib/server/utils/services.js');
const {datetimer} = require(root + '/lib/server/utils/datetime.js');
const {Transaction, exec} = require(root + '/lib/server/utils/db.js');
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
  if (recs.status != 200) return -1;
  
  let data = recs.data;

  return (data.length == 0) ? 1 : parseInt(data[data.length-1].seq1) + 1;
}

const rollback = async function(trans, tm) {
  await trans.rollback();
  await trans.release();

  return tm;
}

class ItemService extends ModelService {
  // Main entry into getting/updating items.
  async getOne({database = '', pgschema = '', user = {}, rec = {}} = {}) {
    // Get specific row
    let pks = [rec.rsvno, rec.seq1];
    let process = new Process(database, pgschema, user);

    return await process.gatherOne(pks);
  }

  async getMany({database='', pgschema = '', user = {}, rec={}, cols=['*'], where='', values=[], limit, offset, orderby} = {}) {
    let process = new Process(database, pgschema, user);

    return await process.gatherMany(rec);
  }

  async create({database = '', pgschema = '', user = {}, rec = {}} = {}) {
    let process = new Process(database, pgschema, user);

    return await process.create(rec);
  }

  async update({database = '', pgschema = '', user = {}, rec= {}} = {}) {
    let process = new Process(database, pgschema, user);

    return await process.update(rec);
  }
  
  async delete({database = '', pgschema = '', user = {}, pks = {}} = {}) {
    let process = new Process(database, pgschema, user);

    return await process.delete(pks);
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

class Process {
  /*
    Save, Retrieves, Deletes, and Calculates rsv items
    All DB IO within a transaction.
    Any calcs for new/updated items are done after the item has been saved.
    - this is to get the data saved asap, then worry about $
  */  
  constructor(database, pgschema, user) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.cats = ['A', 'M'];
  }

  // Entry points
  async gatherOne(pks) {
    // get one main item record + includes
    // pks will have [rsvno,seq1]
    // No Transaction
    let tm = await this.getItemRecord(pks);
    if (tm.status != 200) return tm;

    let item = tm.data;

    return await this.gatherIncludeRecords(item);
  }

  async gatherMany(rec) {
    // Gather include records into one big main item record
    // rec will have {rsvno}
    // No Transaction
    let tmRet = new TravelMessage();
    let data = [];

    let tm = await models.Item.select({database: this.database, pgschema: this.pgschema, user: this.user, rec});
    if (tm.status != 200) return tm;

    for (let item of tm.data) {   // for each main item 
      item.includes = [];
      tm = await this.gatherIncludeRecords(item);

      if (tm.status != 200) break;

      data.push(tm.data);
    }

    if (tm.status != 200) return tm;

    tmRet.data = data;
    return tmRet;
  }

  // Transactions
  async create(rec) {
    // get seq1 before transaction so that it doesn't get rolled back
    // seq are wasted if trans fails
    let tm = await this.getSeq1(rec.rsvno);   
    if (tm.status != 200) return tm;

    let seq1 = tm.data[0].seq;

    this.trans = new Transaction(this.database);

    tm = await this.trans.begin();
    if (tm.status != 200) return tm;

    rec.seq1 = seq1;
    rec.snapshot.seq1 = seq1;

    tm = await this.createIt(rec);

    if (tm.status == 200) {
      tm = await this.calcIt(rec.rsvno, seq1);
    }

    if (tm.status == 200) {
      // Success
      this.trans.commit();
      this.trans.release();

      return tm;
    }

    return rollback(this.trans, tm);
  }

  async update(rec) {
    this.trans = new Transaction(this.database);
        
    let res = await this.trans.begin();
    if (res.status != 200) return res;

    let tm = await this.deleteIt(rec);

    if (tm.status == 200) {
      tm = await this.createIt(rec);
    }

    if (tm.status == 200) {
      tm = await this.calcIt(rec.rsvno, rec.seq1);
    }
    
    if (tm.status == 200) {
      // Success
      this.trans.commit();
      this.trans.release();

      return tm;
    }

    return rollback(this.trans, tm);
  }

  async delete(rec) {
    this.trans = new Transaction(this.database);
        
    let res = await this.trans.begin();
    if (res.status != 200) return res;

    let tm = this.deleteIt(rec);

    if (tm.status == 200) {
      // Success
      this.trans.commit();
      this.trans.release();

      return tm;
    }

    return rollback(this.trans, tm);    
  }

  async calcOne(rec) {
    // recalc one item
    this.trans = new Transaction(this.database);
        
    let res = await this.trans.begin();
    if (res.status != 200) return res;

    let tm = await this.calcIt(rec.rsvno, rec.seq1);
    
    if (tm.status == 200) {
      // Success
      this.trans.commit();
      this.trans.release();

      return tm;
    }

    return rollback(this.trans, tm);
  }

  async calcRsv(rec) {
    // recalc all items
    // how many items?
    let tm = await models.Item.select({database: this.database, pgschema: this.pgschema, user: this.user, rec});
    if (tm.status != 200) return tm;

    this.trans = new Transaction(this.database);
        
    let res = await this.trans.begin();
    if (res.status != 200) return res;    

    for (let item of tm.data) {
      tm = await this.calcIt(item.rsvno, item.seq1);
      if (tm.status != 200) break;
    }

    if (tm.status == 200) {
      // Success
      this.trans.commit();
      this.trans.release();

      return tm;
    }

    return rollback(this.trans, tm);
  }

// lower level, must be already within a transaction
  async getItemRecord(pks) {
    // pks: [rsvno, seq1]
    let tmRet = new TravelMessage();

    let tm = await models.Item.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks}, this.trans);
    if (tm.status != 200) return tm;

    let item = tm.data;
    item.includes = [];

    tmRet.data = item;
    return tmRet;
  }

  async gatherIncludeRecords(item) {
    // get main item include
    let tmRet = new TravelMessage();
    let alrmostp = this.getItemInst(item.cat);
    let pks = {rsvno: item.rsvno, seq1: item.seq1};

    let tm = await alrmostp.gather(pks);
    if (tm.status != 200) return tm;

    Process.merge(tm.data[0], item);

    // get included items
    for (let cat of this.cats) {
      if (cat != item.cat) {    // this precludes included items of the same type. Solution: go by seq2 != 1
        let alrmostp = this.getItemInst(cat);

        tm = await alrmostp.gather(pks);
        if (tm.status != 200) break;

        item.includes.push(...tm.data);
      }
    }

    if (tm.status != 200) return tm;

    tmRet.data = item;
    
    return tmRet;
  }

  async createIt(rec) {
    let seq2;
    let tm = new TravelMessage();
    let tmKeep;

    // save Item
    try {
      // Save Main Item
      let tobj = new models.Item(rec);
      tmKeep = await tobj.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

      if (tmKeep.status != 200) return tmKeep;

      // save Main Item details
      seq2 = 1;
      let alrmostp = this.getItemInst(rec.cat);
      tm = await alrmostp.create(rec, seq2);

      if (tm.status != 200) return tm;

      // save include items
      // don't delete as the original delete removed everything
      for (let incl of rec.includes) {
        incl.rsvno = rec.rsvno;
        incl.seq1 = rec.seq1;
        seq2++;
        let incl_alrmostp = this.getItemInst(incl.cat);
        tm = await incl_alrmostp.create(incl, seq2);

        if (tm.status != 200) break;
      }

      if (tm.status != 200) return tm;
    }      
    catch(err) {
      console.log(err)            
      tm.status = 500;
      tm.type = 'text';
      tm.message = String(err);

      return tm;
    }

    return tmKeep;
  }
    
  async deleteIt(rec) {
    // this deletes everything for seq1=x, ie all children for seq1.  Main item and includes
    let tm = new TravelMessage();
    let drec = {rsvno: rec.rsvno, seq1: rec.seq1};

    try {
      // delete Item specific
      for (let cat of this.cats) {
        let alrmostp = this.getItemInst(cat);
        tm = await alrmostp.delete(drec);
        if (tm.status != 200) break;
      }

      if (tm.status != 200) return tm;

      // delete the main item
      let irec = new models.Item(drec);
      tm = await irec.deleteOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);      
    }      
    catch(err) {
      console.log(err)            
      tm.status = 500;
      tm.type = 'text';
      tm.message = String(err);
    }

    return tm;
  }

  async calcIt(rsvno, seq1) {
    // charges, comped, discount all get divvied from item
    // tip, taxes get summed from includes
    // comm is caclulated per include, summed up into item
    // taxes are calculated on charges - comped - discount - comm, not on tip
    // sales = charges + tip - comped - discount - comm
    // total = sales + taxes
    // DO NOT RELY ON THIS RETURNING A FULLY FORMED data ELEMENT.  Save, then re-select records.
    // TO DO - Rounding divvied items.
    //         Sumup GLs and Taxes for Rsv and Item
    /*
      charges -   done
      tip -       done
      comped -    done
      discount -  done
      comm -      done
      comm3 -     done
      sales -     done
      taxes -     done
      total -     done
    */

    const includeTaxes = {};
    const listOfGls = [];

    const getRatingInfo = function(rec) {
      let obj = {};
    
      ['cat', 'code', 'rateno', 'dur', 'times', 'ppl', 'infants', 'children', 'youth', 'adults', 'seniors'].forEach(function(fld) {
        obj[fld] = rec[fld];
      })

      obj.date = datetimer(rec.date).format('YYYY-MM-DD');
    
      return obj;
    }

    const getInclTable = function(cat) {
      let table;

      switch (cat) {
        case 'A':
          table = 'Actinclude';
          break;

        case 'M':
          table = 'Mealinclude';
          break;

        case 'L':
          table = 'Lodginclude';
          break;
      }

      return table
    }

    // calculate finances of one item
    // get rsv info
    let tm = await this.getRsvInfo([rsvno]);
    if (tm.status != 200) return tm;

    let rsvInfo = tm.data[0];

    // Get item
    tm = await this.getItemRecord([rsvno, seq1]);
    if (tm.status != 200) return tm;

    let item = tm.data;

    // get included
    tm = await this.gatherIncludeRecords(item);
    if (tm.status != 200) return tm;

    // do it ------------
    let data = tm.data;  // item + includes
    let actualCharged = data.charges;
    let actualComped = data.comped;
    let actualDiscount = data.discount;
    
    let salesInst = new SalesGL(this.database, this.pgschema, this.user, this.trans);
    let taxInst = new Taxes(this.database, this.pgschema, this.user, this.trans);
    let commInst = new Commission(this.database, this.pgschema, this.user, this.trans);    
    let tipInst = new Tip(this.database, this.pgschema, this.user, this.trans);     

    let [tipamt, tipgl] = await tipInst.calc(data);  // accumulate for item record 'tip' is main item record, acc_tip is include records
    let tip = tipamt;

    if (tipamt !=0 && tipgl) listOfGls.push(['1', tipamt, tipgl]);

    let fixedTotal = 0;
    let itemCharges = [];   // [v|f, charges, discount, comped]

    // main item values
    if (actualCharged != 0) {
      let pobj = getRatingInfo(data);
      let p1 = await services.calc.pricing({database: this.database, pgschema: this.pgschema, user: this.user, rec: pobj})
      if (p1.status != 200) return p1;

      itemCharges.push(['v', p1.data.charges, 0, 0]);
    }
    else {
      itemCharges.push(['v', 0, 0, 0]);
    }

    // Included item values
    for (let incl of data.includes) {
      if (actualCharged != 0) {
        let pobj = getRatingInfo(incl);
        let p1 = await services.calc.pricing({database: this.database, pgschema: this.pgschema, user: this.user, rec: pobj})
        if (p1.status != 200) return p1;

        itemCharges.push(['f', p1.data.charges, 0, 0]);
        fixedTotal += p1.data.charges;

        let [tipamt, tipgl] = await tipInst.calc(incl);
        tip += tipamt;

        if (tipamt !=0 && tipgl) listOfGls.push([incl.seq2, tipamt, tipgl]);
      }
      else {
        itemCharges.push(['f', 0, 0, 0]);
        fixedTotal += 0;
      }
    }

    // fixed have their values, variables need calculating.
    // toDivvy is actualCharged minus money given to fixeds
    // calculated variable is: item charge/actualCharged * toDivvy
    // discount & comped amount is divided up by included's value vs item value
    let toDivvy = actualCharged - fixedTotal;

    for (let item of itemCharges) {
      if (item[0] == 'v') {
        item[1] = (actualCharged != 0) ? Math.round(toDivvy * item[1]/actualCharged * 100, 2) / 100 : 0;
      }

      item[2] = (actualCharged != 0) ? Math.round(actualDiscount * item[1]/actualCharged * 100, 2) / 100 : 0;
      item[3] = (actualCharged != 0) ? Math.round(actualComped * item[1]/actualCharged * 100, 2) / 100 : 0;
    }

    // save acc_* in each include record, tip, taxes in item record
    // main item include values
    let [fv, acc_charges, acc_discount, acc_comped] = [...itemCharges[0]];
    data.acc_charges = acc_charges;
    data.acc_comped = acc_comped;
    data.acc_discount = acc_discount;

    let [acc_taxes, taxDtls] = await taxInst.calc(data, rsvInfo);
    let [acc_comm, acc_comm3, commgl] = await commInst.calc(data, rsvInfo);

    let acc_sales = acc_charges + parseFloat(data.acc_tip) - acc_discount - acc_comped - acc_comm;
    let acc_total = acc_sales + acc_taxes;
    let taxes = acc_taxes;  // accumulate taxes
    let comm = acc_comm;
    let comm3 = acc_comm3;

    let iid = data.seq2;

    includeTaxes[iid] = taxDtls;
    if (commgl && acc_comm+acc_comm3 != 0) listOfGls.push([iid, acc_comm + acc_comm3, commgl]);

    let sgls = await salesInst.calc(data);

    for (let sgl of sgls) {
      listOfGls.push([iid, sgl[0], sgl[1]]);
    }

    for (let td of taxDtls) {
      listOfGls.push([iid, td[1], td[2]]);
    }
    
    // update include record
    let rec = {rsvno, seq1, seq2: data.seq2, acc_charges, acc_comped, acc_discount, acc_comm, acc_comm3, acc_sales, acc_taxes, acc_total};    
    let itable = getInclTable(data.cat);
    let inst = new models[itable](rec);

    tm = await inst.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
    if (tm.status != 200) return tm;

    // included items
    let idx = 0;
    for (let incl of data.includes) {
      idx++;

      let [fv, acc_charges, acc_discount, acc_comped] = [...itemCharges[idx]];
      data.acc_charges = acc_charges;
      data.acc_comped = acc_comped;
      data.acc_discount = acc_discount;

      let [acc_taxes, taxDtls] = await taxInst.calc(incl, rsvInfo);
      let [acc_comm, acc_comm3, commgl] = await commInst.calc(incl, rsvInfo);
      
      let acc_sales = acc_charges + parseFloat(incl.acc_tip) - acc_discount - acc_comped - acc_comm;
      let acc_total = acc_sales + acc_taxes;
      taxes += acc_taxes;
      comm += acc_comm;
      comm3 += acc_comm3;

      let iid = incl.seq2;

      includeTaxes[iid] = taxDtls;

      if (commgl && acc_comm+acc_comm3 != 0) listOfGls.push([iid, acc_comm + acc_comm3, commgl]);
      
      let sgls = await salesInst.calc(incl);

      for (let sgl of sgls) {
        listOfGls.push([iid, sgl[0], sgl[1]]);
      }

      for (let td of taxDtls) {
        listOfGls.push([iid, td[1], td[2]]);
      }

      // update include record
      let rec = {rsvno, seq1, seq2: incl.seq2, acc_charges, acc_comped, acc_discount, acc_comm, acc_comm3, acc_sales, acc_taxes, acc_total};
      let itable = getInclTable(incl.cat);
      let inst = new models[itable](rec);

      tm = await inst.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
      if (tm.status != 200) break;
    }

    if (tm.status != 200) return tm;

    // set tip, taxes, sales, total on item
    data.tip = tip;
    data.comm = comm;
    data.comm3 = comm3;
    data.taxes = taxes;

    let sales = parseFloat(data.charges) + parseFloat(tip) - parseFloat(data.comped) - parseFloat(data.discount) - parseFloat(comm);
    let total = sales + parseFloat(taxes);
    
    data.sales = sales;
    data.total = total;

    let irec = {rsvno, seq1, tip, sales, comm, comm3, taxes, total};
    let iinst = new models.Item(irec);

    tm = await iinst.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
    if (tm.status != 200) return tm;

    // Save Include & Item GLs and Taxes --------------------------------------------------------------------------
    // first remove all taxes/gls from includes and item (seq1)
    let drec = {rsvno, seq1};

    tm = await models.Includetaxes.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: drec}, this.trans);
    if (tm.status != 200) return tm;

    tm = await models.Includegls.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: drec}, this.trans);
    if (tm.status != 200) return tm;
    
    tm = await models.Itemtaxes.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: drec}, this.trans);
    if (tm.status != 200) return tm;

    tm = await models.Itemgls.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: drec}, this.trans);
    if (tm.status != 200) return tm;

    // sumup by tax, gl
    let sumupGL = {}, sumupGLi = {};
    let sumupTax = {}, sumupTaxi = {};

    // sumup taxes
    for (let seq2 in includeTaxes) {
      sumupTax[seq2] = {};

      if (includeTaxes[seq2].length > 0) {
        for (let dtls of includeTaxes[seq2]) {
          let [taxcode, amt, gl] = [...dtls];

          if (taxcode && amt != 0) {
            if (!(taxcode in sumupTax[seq2])) sumupTax[seq2][taxcode] = 0;
            sumupTax[seq2][taxcode] += parseFloat(amt);
          }

          if (!(taxcode in sumupTaxi)) sumupTaxi[taxcode] = 0;
          sumupTaxi[taxcode] += parseFloat(amt);
        }        
      }
    }

    // sumup GLs
    for (let [seq2, amt, gl] of listOfGls) {
      if (! (seq2 in sumupGL)) sumupGL[seq2] = {};
      if (! (gl in sumupGL[seq2])) sumupGL[seq2][gl] = 0;

      sumupGL[seq2][gl] += amt;

      if (! (gl in sumupGLi)) sumupGLi[gl] = 0;
      sumupGLi[gl] += amt;
    }

    // save taxes
    for (let seq2 in sumupTax) {
      for (let taxcode in sumupTax[seq2]) {
        let amount = sumupTax[seq2][taxcode];

        let trec = {rsvno, seq1, seq2, taxcode, amount};
        let iinst = new models.Includetaxes(trec);
        tm = await iinst.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
        if (tm.status != 200) break;
      }

      if (tm.status != 200) break;
    }

    if (tm.status != 200) return tm;

    for (let taxcode in sumupTaxi) {
      let amount = sumupTaxo[taxcode];

      let trec = {rsvno, seq1, taxcode, amount};
      let iinst = new models.ITemtaxes(trec);
      tm = await iinst.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
      if (tm.status != 200) break;
    }

    if (tm.status != 200) return;

    // save GLs
    for (let seq2 in sumupGL) {
      for (let glcode in sumupGL[seq2]) {
        let amount = sumupGL[seq2][glcode];

        let trec = {rsvno, seq1, seq2, glcode, amount};
        let iinst = new models.Includegls(trec);
        tm = await iinst.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
        if (tm.status != 200) break;
      }

      if (tm.status != 200) break;
    }

    if (tm.status != 200) return tm;

    for (let glcode in sumupGLi) {
      let amount = sumupGLi[glcode];

      let trec = {rsvno, seq1, glcode, amount};
      let iinst = new models.Itemgls(trec);
      tm = await iinst.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
      if (tm.status != 200) break;
    }
    
    if (tm.status != 200) return;    

    // Save Rsv GLs and Taxes --------------------------------------------------------------------------
    // first remove all taxes/gls from rsv
    let rrec = {rsvno};
    tm = await models.Maintaxes.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: drec}, this.trans);
    if (tm.status != 200) return tm;

    tm = await models.Maingls.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: drec}, this.trans);
    if (tm.status != 200) return tm;

    tm = await models.Itemtaxes.select({database: this.database, pgschema: this.pgschema, user: this.user, rrec}, this.trans);
    if (tm.status != 200) return tm;

    let mtaxes = tm.data;

    tm = await models.Itemgls.select({database: this.database, pgschema: this.pgschema, user: this.user, rrec}, this.trans);
    if (tm.status != 200) return tm;

    let mgls = tm.data;

    // sumup by tax, gl
    let sumupGLm = {};
    let sumupTaxm = {};

    // sumup taxes
    for (let mtax in mtaxes) {
      if (! (mtax.taxcode in sumupTaxm)) sumupTaxm[mtax.taxcode] = 0;
      sumupTaxm[mtax.taxcode] += mtax.amount;
    }

    // sumup GLs
    for (let mgl in mgls) {
      if (! (mgl.gl in sumupGLm)) sumupGLm[mgl.gl] = 0;
      sumupGLm[mgl.gl] += mgl.amount;
    }

    // save taxes
    for (let taxcode in sumupTaxm) {
      let amount = sumupTaxm[taxcode];

      let trec = {rsvno, taxcode, amount};
      let iinst = new models.Maintaxes(trec);
      tm = await iinst.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
      if (tm.status != 200) break;
    }

    if (tm.status != 200) return tm;

    // save GLs
    for (let glcode in sumupGLm) {
      let amount = sumupGLm[glcode];

      let trec = {rsvno, glcode, amount};
      let iinst = new models.Maingls(trec);
      tm = await iinst.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

      if (tm.status != 200) break;
    }

    if (tm.status != 200) return tm;    

    // update reservation ----------------------------------------------------------------------
    rec = {rsvno};
    tm = await models.Item.select({database: this.database, pgschema: this.pgschema, user: this.user, rec}, this.trans);
    if (tm.status != 200) return tm;

    let rcharges = 0, rtip = 0, rcomped = 0, rdiscount = 0, rcomm = 0, rcomm3 = 0, rsales = 0, rtaxes = 0, rtotal = 0;

    for (let item of tm.data) {
      rcharges += parseFloat(item.charges);
      rtip += parseFloat(item.tip);
      rcomped += parseFloat(item.comped);
      rdiscount += parseFloat(item.discount);
      rcomm += parseFloat(item.comm);
      rcomm3 += parseFloat(item.rcomm3);
      rsales += parseFloat(item.sales);
      rtaxes += parseFloat(item.taxes);
      rtotal += parseFloat(item.total);
    }

    let rrec = {rsvno, charges: rcharges, tip: rtip, comped: rcomped, discount: rdiscount, comm: rcomm, comm3: rcomm3, sales: rsales, taxes: rtaxes, total: rtotal};
    let rinst = new models.Main(rrec);

    tm = await rinst.updateOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
    if (tm.status != 200) return tm;

    tm.data = data;
    return tm;    
  }

  async getSeq1(rsvno) {
    let text = `UPDATE "${this.pgschema}"."reservations_Main" SET seq = seq + 1 WHERE rsvno = $1 RETURNING seq`;
    let values = [rsvno];

    return await exec(this.database, {text, values});
  }

  getItemInst(cat) {
    // return an item specific data saver/deleter
    let inst; 

    switch (cat) {
      case 'A':
        inst = new Activity(this.database, this.pgschema, this.user, this.trans);
        break;

      case 'M':
        inst = new Meal(this.database, this.pgschema, this.user, this.trans);
        break;
    }

    return inst;
  }

  async getRsvInfo(values) {
    let query = {
      reservations_Main: {
        columns: ['*'],
        leftJoin: [
          {contacts_Contact: {
            columns: ['*'],
            fkname: 'contact'
          }}
        ],

        where: `"reservations_Main"."rsvno" = $1`
      }
    };

    return jsonQueryExecify({database: this.database, pgschema: this.pgschema, query, app: 'reservations', values});
  }
  
  static merge(source, dest) {
    // merge source into dest
    for (let k in source) {
      if (! (k in dest)) {
        dest[k] = source[k];
      }
    }
  }
}

class Booker {
  // parent of individual item types.
  constructor(database, pgschema, user, trans) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.trans = trans;
  }

  async create(rec, seq2) {
    // Save info
    return await this.save(rec, seq2);
  }

  async delete(pks) {
    // Delete info
    let drec = {rsvno: pks.rsvno, seq1: pks.seq1}
    return await this.delete(drec);
  }
}

class Activity extends Booker{
  async gather(rec) {
    // get all include records
    return models.Actinclude.select({database: this.database, pgschema: this.pgschema, user: this.user, rec}, this.trans);
  }

  async save(rec, seq2) {
    // Actinclude insert
    rec.seq2 = seq2;

    let tobj2 = new models.Actinclude(rec);
    let tm = await tobj2.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
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

    // success
    return tm;
  }

  async delete(rec) {
    let tm = await models.Actdaily.select({database: this.database, pgschema: this.pgschema, user: this.user, rec}, this.trans);
    if (tm.status != 200) return tm;
  
    for (let daily of tm.data) {
      let drec = new models.Actdaily(daily);
  
      tm = await drec.deleteOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);
      if (tm.status != 200) return tm;
  
      tm = await this.removeActivityBooked(daily);
      if (tm.status != 200 && tm.status != 400) return tm;
    }
  
    return await models.Actinclude.delete({database: this.database, pgschema: this.pgschema, user: this.user, obj: rec}, this.trans);
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
  async gather(rec) {
    // get all include records
    return models.Mealinclude.select({database: this.database, pgschema: this.pgschema, user: this.user, rec});
  }

  async save(rec, seq2) {
    // Mealinclude insert
    rec.seq2 = seq2;

    let tobj2 = new models.Mealinclude(rec);
    let tm = await tobj2.insertOne({database: this.database, pgschema: this.pgschema, user: this.user}, this.trans);

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

    // success
    return tm;
  }

  async delete(rec) {
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
    let bd = await this.getBasicData();
    if (bd.status != 200) return bd;

    this.setPriceDescs();
    this.setQtys();

    bd = await this.getPrices();
    if (bd.status != 200) return bd;

    this.calcExtn();
    this.calcCharges();
    this.formatPrices();

    this.tm.data = this.data;

    return this.tm;
  }

  async getBasicData() {
    let rate = await itemModels[this.ratesModel].selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [this.pobj.code, this.pobj.rateno]});
    if (rate.status != 200) return rate;

    this.data.rate = rate.data;

    let plevel = await itemModels.Pricelevel.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [this.data.rate.pricelevel]});
    if (plevel.status != 200) return plevel;

    this.plevel = plevel.data;

    return new TravelMessage();
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
        else {
          return price;
        }

        if (this.data.rate.ratebase2 != 'D') {
          break;
        }
      }
    }

    this.data.price = prices;

    return new TravelMessage();
  }

  calcExtn() {
    for (let i=0; i<7; i++) {
      this.data.pextn[i] = Math.round(this.data.pqty[i] * this.data.price[i] * 1000)/1000;
    }
  }

  calcCharges() {
    let charges = 0;

    for (let i=0; i<7; i++) {   // 8 is comped
      charges += this.data.pextn[i];
    }

    this.data.charges = charges;
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
    switch(this.data.rate.ratebase1) {
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

    if (this.data.rate.ratebase1 == 'P') {
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
      this.errMsg = `Adult size of ${adults} is more than the maximum of ${maxa}`;
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
    let addlppl = parseInt(this.data.rate.addlppl);  // starting level
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

        if (spot == -1) spot = (this.data.rate.ratebase1 == 'C') ? 1 : 0;

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

        if (spot == -1) spot = (this.data.rate.ratebase1 == 'C') ? 1 : 0;

        this.data.pqty[spot] += qty;
      }
    }
  }
}

class SalesGL {
  // calculate sales gl on one item.  Charges-comped-discount
  constructor(database, pgschema, user, trans) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.trans = trans;

    this.breakdown = [];
  }

  async calc(data) {
    let itable = this.getItemTable(data.cat);
    let charges = parseFloat(data.acc_charges) - parseFloat(data.acc_comped) - parseFloat(data.acc_discount);
    let sum = 0;
    this.breakdown = [];

    // get item
    let tm = await itable.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [data.code]}, this.trans);
    if (tm.status != 200) return this.breakdown;

    let item = tm.data;

    for (let i=1; i<5; i++) {
      let gl = item['gl' + i];

      if (!gl) continue;

      let amt = item['gl' + i + 'amt'];
      let perc = item['gl' + i + 'perc'];
      let calced = (perc) ? Math.round(charges * (amt/100) * 100) / 100 : amt;

      sum += calced;

      this.breakdown.push([calced, gl]);
    }

    if (sum != charges) {
      let diff = charges-sum;

      this.breakdown[0][0] += diff;
    }

    return this.breakdown;
  }

  getItemTable(cat) {
    if (cat == 'A') return itemModels.Activity;
    if (cat == 'L') return itemModels.Lodging;
    if (cat == 'M') return itemModels.Meals;
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
        return (amt/100) * (parseFloat(this.pobj.charges) - parseFloat(this.pobj.comped));

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

class Commission {
  // calculate commission on one item.  Charges-comped-discount
  constructor(database, pgschema, user, trans) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.trans = trans;
  }

  async calc(data, rsvData) {
    let comm = 0, comm3 = 0, commgl = '';
    let commrate = parseFloat(rsvData.commrate);

    if (commrate == 0) return [comm, comm3, commgl];
    commrate = commrate/100;

    let itable = this.getItemTable(data.cat);

    // get item
    let tm = await itable.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [data.code]}, this.trans);
    if (tm.status != 200) return [comm, comm3, commgl];

    let item = tm.data;

    commgl = item.commgl;

    if (!commgl) return [comm, comm3, ''];
    let commable = parseFloat(data.acc_charges) - parseFloat(data.acc_comped) - parseFloat(data.acc_discount);
    let net = Math.round(commable * commrate * 100) / 100;

    (rsvData.contact.id == rsvData.agent) ? comm = net : comm3 = net;   // comm is guest=agent, comm3 is a 3rd party commission agent

    return [comm, comm3, commgl];
  }

  getItemTable(cat) {
    if (cat == 'A') return itemModels.Activity;
    if (cat == 'L') return itemModels.Lodging;
    if (cat == 'M') return itemModels.Meals;
  }
}

class Tip {
  // gather tip and GL
  constructor(database, pgschema, user, trans) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.trans = trans;
  }

  async calc(data) {
    if (data.cat != 'M') return [0, ''];

    let tip = parseFloat(data.acc_tip);

    let itable = this.getItemTable(data.cat);

    // get item
    let tm = await itable.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [data.code]}, this.trans);
    if (tm.status != 200) return [tip, ''];

    let item = tm.data;
    let tipgl = item.tipgl;

    return [tip, tipgl];
  }

  getItemTable(cat) {
    if (cat == 'A') return itemModels.Activity;
    if (cat == 'L') return itemModels.Lodging;
    if (cat == 'M') return itemModels.Meals;
  }
}

class Taxes {
  // calculate taxes on one item
  constructor(database, pgschema, user, trans) {
    this.database = database;
    this.pgschema = pgschema;
    this.user = user;
    this.trans = trans;
  }

  async calc(data, rsvData) {
    let tax = 0, taxes = [];
    let taxable = rsvData.taxable;
    let bookdate = rsvData.cr8date || new Date();
    let arrdate = rsvData.arrdate || new Date();

    let itable = this.getItemTable(data.cat);

    // get item
    let tm = await itable.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [data.code]}, this.trans);
    if (tm.status != 200) return [tax, taxes];

    let item = tm.data;

    for (let idx=1; idx<5; idx++) {
      let taxcode = item['tax' + idx];
      if (!taxcode) continue;

      let tm = await itemModels.Tax.selectOne({database: this.database, pgschema: this.pgschema, user: this.user, pks: [taxcode]}, this.trans);
      if (tm.status != 200) continue;
      let taxData = tm.data;
      let rateDate = (taxData.effwhen == 'A') ? arrdate : bookdate;

      if (taxable || !taxData.exemptable) {
        let [amt, gl] = this.calcIt(data, taxData, rateDate);
        tax += amt;
        taxes.push([taxcode, amt, gl]);
      }
    }

    return [tax, taxes];
  }

  calcIt(data, taxData, rateDate) {
    let taxableAmt = parseFloat(data.acc_charges) - parseFloat(data.acc_comped) - parseFloat(data.acc_discount);
    let amt = 0, gl = taxData.gl, basis = taxData.base;
    let [rate, tierbase] = this.getTaxRate(taxData, rateDate, taxableAmt);

    switch(basis) {
      case '%':
        amt = taxableAmt * rate/100;
        break;

      case 'P':
        amt = parseFloat(data.ppl) * rate;
        break;

      case 'U':
        amt = parseFloat(data.ppl) * parseFloat(data.dur) * rate;
        break;

      case 'Q':
        amt = parseFloat(data.qty) * rate;
        break;

      case 'N':
        amt = parseFloat(data.qty) * parseFloat(data.dur) * rate;
        break;

      case 'F':
        amt = rate;
        break;

      case 'X':
        amt = tierbase + (taxableAmt * (rate/1000))
        break;

      case 'Y':
        amt = tierbase + rate;
        break;

      case 'Z':
        amt = tierbase + (taxableAmt * rate/100)
        break;
    }

    amt = Math.round(amt*100)/100;

    return [amt, gl];
  }

  getTaxRate(taxData, rateDate, taxableAmt) {
    // find proper rate based on date and possibly tier
    let lowDate = new Date(1961, 4, 1).valueOf();
    let rate = 0, tierbase = 0, basis = taxData.basis;

    for (let history of taxData.history) {
      let hdate = new Date(history.date).valueOf();

      if (hdate > lowDate && hdate <= rateDate) {
        if (basis == 'X' || basis == 'Y' || basis == 'Z') {
          tierbase = history.tierbase;

          if (taxableAmt < taxData.tier1min) {
            rate = 0;
          }
          else if (taxableAmt <= taxData.tier1max) {
            rate = history.tier1;
          }
          else if (taxableAmt <= taxData.tier2max) {
            rate = history.tier2;
          }
          else if (taxableAmt <= taxData.tier3max) {
            rate = history.tier3;
          }
          else {
            rate = history.tier4;
          }
        }
        else {
          rate = history.rate;
        }
      }

      lowDate = hdate;
    }

    return [rate, tierbase];
  }

  getItemTable(cat) {
    if (cat == 'A') return itemModels.Activity;
    if (cat == 'L') return itemModels.Lodging;
    if (cat == 'M') return itemModels.Meals;
  }
}

module.exports = services;