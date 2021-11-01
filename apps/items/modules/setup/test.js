import {MVC} from '/~static/lib/client/core/mvc.js';

class C extends MVC {
  constructor(el) {
    super(el);
  }

  createModel() {
    this.model.lodging = {
      unitized: false,
      bookbeds: true
    }
  }
}

new C('test');