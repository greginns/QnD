import {QnD} from '/static/lib/client/core/qnd.js';
import {MVC} from '/static/lib/client/core/mvc.js';

class Multisel extends MVC {
  constructor() {
    super('mvc-boot-multisel');

    this.modal = document.getElementById(this._element);
  }

  select(title, groups, values) {
    this.model.title = title;
    this.values = values;
    this.model.datalist = [];

    // clean up, enhance groups.
    for (var g=0; g<groups.length; g++) {
      if (!('active' in groups[g])) groups[g].active = true;

      groups[g].selected = false;
      groups[g].klass = (groups[g].active) ? '' : ['text-danger'];

      for (var i=0; i<groups[g].items.length; i++) {
        if (!('active' in groups[g].items[i])) groups[g].items[i].active = true;

        if (!groups[g].active) {
          groups[g].items[i].active = false;
        }

        if (!groups[g].items[i].active) {
          groups[g].items[i].selected = false;
        }
        else if (values.indexOf(groups[g].items[i].value) > -1) {
          groups[g].items[i].selected = true;
        }
        else {
          groups[g].items[i].selected = false;
        }

        groups[g].items[i].klass = (groups[g].items[i].active) ? (values.indexOf(groups[g].items[i].value) > -1) ? 'active' : '' : ['disabled', 'text-danger'];
      }
    }

    this.model.groups = groups;

    // make datalist
    for (var g=0; g<groups.length; g++) {
      for (var i=0; i<groups[g].items.length; i++) {
        if (groups[g].items[i].active) {
          this.model.datalist.push({value: `[${groups[g].items[i].value}] ${groups[g].items[i].text}`, dval: groups[g].items[i].value});
        }
      }
    }

    this._modalOpen();
    
    return new Promise(function(resolve) {
      this.resolve = resolve;
    }.bind(this));
  }

  gclick(ev) {
    var el = ev.target.closest('span');
    var idx = el.getAttribute('data-index');
    var selected = this.model.groups[idx].selected;

    if (!this.model.groups[idx].active) return;

    selected = !selected;

    // mark group
    this.model.groups[idx].selected = selected;
    this.model.groups[idx].klass = (selected) ? 'active' : '';

    // mark entries
    for (var i=0; i<this.model.groups[idx].items.length; i++) {
      if (this.model.groups[idx].items[i].active) {
        this.model.groups[idx].items[i].selected = selected;
        this.model.groups[idx].items[i].klass = (selected) ? 'active' : '';
      }
    }
  }

  iclick(ev) {
    var el = ev.target.closest('li');
    var value = el.getAttribute('data-value');

    this.selectByValue(value);
  }

  search() {
    var sch = this.model.search;
    var value;

    if (!sch) return;

    for (var i=0; i<this.model.datalist.length; i++) {
      if (this.model.datalist[i].value == sch) {
        value = this.model.datalist[i].dval;
        break;
      }
    }

    if (!value) return;

    this.selectByValue(value);
    this.model.search = '';
  }

  selectByValue(value) {
    // find appropriate entry, update.
    for (var g=0; g<this.model.groups.length; g++) {
      for (var i=0; i<this.model.groups[g].items.length; i++) {
        if (this.model.groups[g].items[i].value == value) {
          if (this.model.groups[g].items[i].selected == true) {
            this.model.groups[g].items[i].selected = false;
            this.model.groups[g].items[i].klass = '';
          }
          else {
            this.model.groups[g].items[i].selected = true;
            this.model.groups[g].items[i].klass = 'active';
          }
        }
      }
    };
  }

  accept() {
    var res = [];

    // extract values
    for (var g=0; g<this.model.groups.length; g++) {
      for (var i=0; i<this.model.groups[g].items.length; i++) {
        if (this.model.groups[g].items[i].selected) res.push(this.model.groups[g].items[i].value);
      }
    };

    this.close();
    this.resolve(res);
  }

  cancel() {
    this.close();
    this.resolve(this.values);
  }

  close() {
    this._modalClose();
  }

  _modalOpen() {
    this.modal.className="modal fade show";
    this.modal.style.display = 'block';
    this.modal.style['padding-right'] = '17px';

    document.body.className = 'modal-open';
    document.body.style['padding-right'] = '17px';

    this.backdropDiv = document.createElement('div');
    this.backdropDiv.className='modal-backdrop fade show';
    document.body.appendChild(this.backdropDiv);
  }

  _modalClose() {
    this.modal.className="modal fade";
    this.modal.style.display = 'none';
    this.modal.style['padding-right'] = '0px';

    document.body.style['padding-right'] = '0px'
    document.body.className = '';
    this.backdropDiv.remove();
  }
}

QnD.widgets.multisel = new Multisel();

/*
  QnD.widgets.multisel.select(title, groups, values)
*/