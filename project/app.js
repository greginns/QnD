// App-wide variables
import {MVC} from '/~static/lib/client/core/mvc.js';
import addBindings from '/~static/lib/client/core/mvc-bindings.js';
import addDtBindings from '/~static/lib/client/core/mvc-datetime.js';

addBindings(MVC);
addDtBindings(MVC);

const App = {};

App.dateFormat = 'YYYY-MM-DD';
App.timeFormat = 'h:mm A';
App.USER = {};
App.CSRF = '';
App.reLogin = '';

App.url = 'https://roam3.adventurebooking.com:3011';

MVC.dateFormat = App.dateFormat;
MVC.timeFormat = App.timeFormat;

App.MVC = MVC;

export {App};