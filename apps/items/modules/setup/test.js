import {MVC} from '/~static/lib/client/core/mvc.js';

class C extends MVC {
  constructor(el) {
    super(el);
  }

  createModel() {
    this.model.range = {
      prices: [[45, 52]],
      names: {
        first: 'Greg'
      }
    }
  }

  show() {
    console.log(this.model.range.toJSON())
  }
}

new C('test');