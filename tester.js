const root = process.cwd();
const {datetimer} = require(root + '/lib/client/core/datetime.js');
/*
let d1 = new Datetime('2021 121 17:52:21', 'YYYY DDDD HH:mm:ss');
//d.year(2022).month(12).date(30).add(1, 'day').subtract(2, 'years');
console.log(d1.format('dddd, MMMM Do, YYYY @ h:mm:ss A'))
console.log(d1.format('DDDo Wo'))

let d2 = new Datetime(d1);
d2.date(2);
console.log(d2.toJSON())
console.log(d2.format('dddd, MMMM Do, YYYY @ h:mm:ss A'))
console.log('-------------------------')
console.log(d1.isSame(d2, 'year'))
*/

let dt = datetimer('1961-05-01', 'YYYY-M-D')

let fom = datetimer(dt).date(1);    // create first of the month
let fomDow = fom.day();             // day of the week on the first
let lom = datetimer(fom).add(1,'months').subtract(1,'days').date();   // last day of the month
let plom = datetimer(fom).subtract(1,'days').date();                  // last day of the month of prev month
let month = dt.format('MMMM');
let year = dt.format('YYYY');
let mth = dt.month();
let yr = dt.year();

console.log(fom._datetime)
//console.log(fomDow,lom, plom)
console.log(month, year, mth, yr)