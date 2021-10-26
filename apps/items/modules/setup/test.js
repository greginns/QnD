import {MVC} from '/~static/lib/client/core/mvc.js';

class C extends MVC {
  constructor(el) {
    super(el);
  }

  createModel() {
    this.model.statelist = [
      {text: 'Alberta', value: 'AB'},
      {text: 'Nova Scotia', value: 'NS'},
      {text: 'Maine', value: 'ME'},
      {text: 'Alberta', value: 'A1'},
      {text: 'Nova Scotia', value: 'A2'},
      {text: 'Maine', value: 'A3'},
      {text: 'Alberta', value: 'A4'},
      {text: 'Nova Scotia', value: 'A5'},
      {text: 'Maine', value: 'A6'},
    ];

    this.model.states = ['NS'];
  }
}

new C('test');