// App-wide variables
import {MVC} from '/~static/lib/client/core/mvc.js';
import addBindings from '/~static/lib/client/core/mvc-bindings.js';
import addDtBindings from '/~static/lib/client/core/mvc-datetime.js';
import addDB4Functions from '/~static/lib/client/core/mvc-db4.js';

addBindings(MVC);
addDtBindings(MVC);
addDB4Functions(MVC);

const App = {};

App.dateFormat = 'YYYY-MM-DD';
App.timeFormat = 'h:mm A';
App.USER = {};
App.CSRF = '';
App.reLogin = '';

App.url = 'https://roam3.adventurebooking.com:3011';

App.MVC = class extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model._params = {};
    this.model._badMessage = '';
    this.model._errors = {};
  }

  async inView(params) {
    this.model._params = params;
  }
};

App.MVC.dateFormat = App.dateFormat;
App.MVC.timeFormat = App.timeFormat;

export {App};