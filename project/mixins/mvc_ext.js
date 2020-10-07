// Alter MVC by adding new bindings, roles, filters, edits, interfaces, etc.
import {App} from '/~static/lib/client/core/app.js';
import {utils} from '/~static/lib/client/core/utils.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {MDate} from '/~static/lib/client/widgets/mdate.js';
import {MTime} from '/~static/lib/client/widgets/mtime.js';

MVC._addFilter('tag', function(el, value) {
  let outerSpan = document.createElement('span');
  let fmttag = el.getAttribute('mvc-tag-format') || null;
  let fmtfunc = (fmttag) ? this[fmttag] || null : null;

  if (value && fmtfunc) {
    for (let entry of value) {
      outerSpan.appendChild(this[fmttag](entry));
    }
  }

  return outerSpan;
});

MVC._addInterface('date:boot', async function(ev) {
  // user clicked on calendar, model dates are JSON.  Widget is dayjs
  let el = ev.target;
  let dEl = el.closest('div.input-group').querySelector('input');
  let path = dEl.getAttribute('mvc-value');
  let dt = this.$readModel(path);
  let mdt = utils.datetime.makeDayjsDate(dt);
  let m = new MDate();

  try {
    let ret = await m.calendar(mdt);
    this.$updateModel(path, ret.toJSON());
    m = undefined;
  }
  catch(e) {
  }
});

MVC._addInterface('time:boot', async function(ev) {
  // user clicked on clock, model times are JSON.  Widget is dayjs
  let el = ev.target;
  let dEl = el.closest('div.input-group').querySelector('input');
  let path = dEl.getAttribute('mvc-value');
  let dt = this.$readModel(path);
  let mdt = utils.datetime.makeDayjsDate(dt);
  let t = new MTime();

  try {
    let ret = await t.time(mdt);
    this.$updateModel(path, ret.toJSON());
    m = undefined;
  }
  catch(e) {
  }
});

MVC.dateFormat = App.dateFormat;
MVC.timeFormat = App.timeFormat;