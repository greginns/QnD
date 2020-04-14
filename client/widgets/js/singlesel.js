import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';

class Singlesel extends MVC {
  constructor() {
    super('mvc-boot-singlesel');

    this.modal = document.getElementById(this._element);
  }

  select(title, groups, value) {
    this.model.title = title;
    this.value = value;
    this.model.datalist = [];

    // clean up, enhance groups.
    for (var g=0; g<groups.length; g++) {
      if (!('active' in groups[g])) groups[g].active = true;

      groups[g].klass = (groups[g].active) ? '' : ['text-danger'];

      for (var i=0; i<groups[g].items.length; i++) {
        if (!('active' in groups[g].items[i])) groups[g].items[i].active = true;

        if (!groups[g].active) {
          groups[g].items[i].active = false;
        }

        if (!groups[g].items[i].active) {
          groups[g].items[i].selected = false;
        }
        else if (value == groups[g].items[i].value) {
          groups[g].items[i].selected = true;

        }
        else {
          groups[g].items[i].selected = false;
        }

        groups[g].items[i].klass = (groups[g].items[i].active) ? (groups[g].items[i].value == value) ? 'active' : '' : ['disabled', 'text-danger'];
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

  iclick(ev) {
    var el = ev.target;
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
    for (var g=0; g<this.model.groups.length; g++) {
      for (var i=0; i<this.model.groups[g].items.length; i++) {
        if (this.model.groups[g].items[i].active) {
          if (this.model.groups[g].items[i].value == value) {
            if (this.model.groups[g].items[i].selected) {
              this.model.groups[g].items[i].selected = false;
              this.model.groups[g].items[i].klass = '';
            }
            else {
              this.model.groups[g].items[i].selected = true;
              this.model.groups[g].items[i].klass = 'active';
            }
          }
          else {
            this.model.groups[g].items[i].selected = false;
            this.model.groups[g].items[i].klass = '';
          }
        }
      }
    };
  }

  accept() {
    var res = '';

    // extract values
    for (var g=0; g<this.model.groups.length; g++) {
      for (var i=0; i<this.model.groups[g].items.length; i++) {
        if (this.model.groups[g].items[i].selected) {
          res = this.model.groups[g].items[i].value;
          break;
        }
      }
    };

    this.close();
    this.resolve(res);
  }

  cancel() {
    this.close();
    this.resolve(this.value);
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

QnD.widgets.singlesel = new Singlesel();

/*
  QnD.widgets.singlesel.select(title, groups, values)
*/