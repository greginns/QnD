import {MVC} from '/~static/lib/client/core/mvc.js';

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