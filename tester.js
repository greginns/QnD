const root = process.cwd();

const {exec} = require(root + '/lib/server/utils/db.js');
const {datetimer} = require(root+ '/lib/server/utils/datetime.js')
const services = require(root + '/apps/reservations/services.js');

const database = 'qnd';
const pgschema = 'gm';
const user = {};

const getRatingInfo = function(rec) {
  let obj = {};

  obj.cat = rec.cat;
  obj.code = rec.code;
  obj.rateno = rec.rateno;
  obj.date = datetimer(rec.date).format('YYYY-MM-DD');
  obj.dur = rec.dur;
  obj.times = rec.times;
  obj.ppl = rec.ppl;
  obj.infants = rec.infants;
  obj.children = rec.children;
  obj.youth = rec.youth;
  obj.adults = rec.adults;
  obj.seniors = rec.seniors;

  return obj;
}

const test = async function() {
  let res = await services.item.getOne({database, pgschema, user, rec: {rsvno: 8, seq1: 1}})
  let data = res.data;
  let actualCharged = 0;
  let fixedTotal = 0;
  let itemCharges = [];
  
  actualCharged = data.charges;

  // main item values
  let pobj = getRatingInfo(data);
  let p1 = await services.calc.pricing({database, pgschema, user, rec: pobj})
  if (p1.status != 200) process.exit();

  itemCharges.push(['v', p1.data.charges]);

  // Included item values
  for (let incl of data.includes) {
    let pobj = getRatingInfo(incl);
    let p1 = await services.calc.pricing({database, pgschema, user, rec: pobj})

    if (p1.status != 200) process.exit();

    itemCharges.push(['f', p1.data.charges]);
    fixedTotal += p1.data.charges;
  }

  // fixed have their values, variables need calculating.
  // toDivvy is actualCharged - money given to fixeds
  // calculated item charge/actualCharged * toDivvy
  let toDivvy = actualCharged - fixedTotal;

  for (let item of itemCharges) {
    if (item[0] == 'v') {
      item[1] = Math.round(toDivvy * item[1]/actualCharged * 100, 2) / 100;
    }
  }

  console.log(itemCharges)

}

test();

/*
(async function() {
  let sql = "SELECT * FROM information_schema.columns WHERE table_schema = 'gm' AND table_name = 'documents_Docsetup'";

  let res = await exec('qnd',sql)

  console.log(res)
})()
*/