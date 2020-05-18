import {QnD} from '/static/v1/lib/client/core/qnd.js';
import {MVC} from '/static/v1/lib/client/core/mvc.js';

class Multisel extends MVC {
  constructor() {
    super('mvc-boot-multisel');

    this.modal = $('#'+this._element);
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

    this.modal.modal('show');
    
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
    this.modal.modal('hide');
  }
}

QnD.widgets.multisel = new Multisel();

/*
    var title = 'test'
    var groups = [
      { 
        label: 'Group 1', 
        items: [{text: 'Item 1.1', value: '11'}, {text: 'Item 1.2', value: '12'}],
      },
      {
        label: 'Group 2',
        items: [{text: 'Item 2.1', value: '21'}, {text: 'Item 2.2', value: '22'}]
      }
    ];

    var value = ['12'];

    let res = await QnD.widgets.multisel.select(title, groups, value);
*/