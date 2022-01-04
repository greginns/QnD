// Alter MVC by adding new bindings, roles, filters, edits, interfaces, etc.
import {utils} from '/~static/lib/client/core/utils.js';
import {Module} from '/~static/lib/client/core/module.js';
//import {MDate} from '/~static/lib/client/widgets/mdate.js';
import {MTime} from '/~static/lib/client/widgets/mtime.js';

let addMVCBindings;

export default addMVCBindings = function(MVC) {
  MVC._addInterface('date:boot', async function(ev) {
    // user clicked on calendar, model dates are YYYY-MM-DD, widget is Datetime
    let el = ev.target;
    let dEl = el.closest('div.input-group').querySelector('input');
    let path = dEl.getAttribute('mvc-value');
    let dt = this.$readModel(path);
    let mdt = utils.datetime.pgDateToDatetime(dt);

    try {
      let ret = await Module.widgets.MDateModal.calendar(mdt);
      ret = utils.datetime.datetimeToPGDate(ret);

      this.$updateModel(path, ret);

      if (ret != dt) dEl.dispatchEvent(new Event('change'));
    }
    catch(e) {
      console.log(e)
    }
  });

  MVC._addInterface('date:abs', async function(ev) {
    // user clicked on calendar, model dates are YYYY-MM-DD, widget is Datetime
    let el = ev.target;
    let dEl = el.closest('div.input-group').querySelector('input');
    let path = dEl.getAttribute('mvc-value');
    let dt = this.$readModel(path);
    let mdt = utils.datetime.pgDateToDatetime(dt);
    let modal = Module.widgets.MDateModal;
    let dialog = modal._section.querySelector('div.modal-dialog');
    let rect = dEl.getBoundingClientRect();
    let wrect = document.body.getBoundingClientRect();
    let bottom = wrect.bottom - rect.top + 4;

    try {
      dialog.style.position = 'absolute';
      dialog.style.left = rect.left + 'px';
      dialog.style.bottom = bottom + 'px';

      let ret = await modal.calendar(mdt);
      ret = utils.datetime.datetimeToPGDate(ret);

      this.$updateModel(path, ret);

      if (ret != dt) dEl.dispatchEvent(new Event('change'));
    }
    catch(e) {
      console.log(e)
    }
  });

  MVC._addInterface('time:boot', async function(ev) {
    // user clicked on clock, model times are HH:MM:SS.mmm.  Widget is Datetime
    let el = ev.target;
    let dEl = el.closest('div.input-group').querySelector('input');
    let path = dEl.getAttribute('mvc-value');
    let tm = this.$readModel(path);
    let mtm = utils.datetime.pgTimeToDatetime(tm);
    let t = new MTime();

    try {
      let ret = await t.time(mtm);
      ret = utils.datetime.datetimeToPGTime(ret)

      this.$updateModel(path, ret);

      if (ret != tm) dEl.dispatchEvent(new Event('change'));

      t = undefined;
    }
    catch(e) {
      console.log(e)
    }
  });
}