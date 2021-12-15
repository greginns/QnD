import {datetimer} from '/~static/lib/client/core/datetime.js';

let dt = datetimer();
dt.date(1)
console.log(dt.toJSON())
dt.date(0)
console.log(dt.toJSON())
