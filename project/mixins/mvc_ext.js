import {App} from '/~static/lib/client/core/app.js';
import {MVC} from '/~static/lib/client/core/mvc.js';

MVC._addFilter('tag', function(el, value) {
  let outerSpan = document.createElement('span');
  let tagfunc = el.getAttribute('mvc-tag-delete') || null;
  let delfunc = (tagfunc) ? this[tagfunc] || null : null;

  if (value) {
    for (let entry of value) {
      let span = document.createElement('span');
      let textspan = document.createElement('span');
      let xspan = document.createElement('span');
      let dt = moment(entry.date);
      let dtx = dt.format(App.dateFormat);
      let tmx = dt.format(App.timeFormat);

      xspan.classList.add('tagx');
      xspan.innerHTML = '&times;';
      xspan.addEventListener('click', delfunc.bind(this));

      textspan.classList.add('tagtext');
      textspan.innerText = entry.tag;

      span.classList.add('tag');
      span.title = dtx + ' ' + tmx;
      span.setAttribute('data-tag', entry.tag);
      span.setAttribute('data-toggle', 'tooltip');
      span.setAttribute('data-placement', 'top');
      span.appendChild(textspan);
      span.appendChild(xspan);
      $(span).tooltip('enable');

      outerSpan.appendChild(span);
    }
  }

  return outerSpan;
});
