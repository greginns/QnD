import {App} from '/~static/project/app.js';
import {Module} from '/~static/lib/client/core/module.js';
import {db4init} from '/~static/lib/client/core/db4init.js';

App.database = '{{database}}';
App.workspace = '{{workspace}}';

Module.mvcs.Db4MVC = class extends App.MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.temp = [
      {name: 'Greg', 'qty': 5},
      {name: 'Fred', 'qty': 10},
      {name: 'Wilma', 'qty': 69}
    ];

    this.model.total = 0;

    this.model.test = 'New MVC Test'

    this.model.choices = [
      {text: 'Choice 1', value: '1'},
      {text: 'Choice 2', value: '2'},
      {text: 'Choice 3', value: '3'},
      {text: 'Choice 4', value: '4'},
      {text: 'Choice 5', value: '5'},
    ]

//    setTimeout(function() {
//      console.log(this._watchedPaths)
//    }.bind(this), 5000)
    
  }

  async ready() {
    var self = this;
    return new Promise(async function(resolve) {
      resolve();

      setTimeout(function() {
        self.model.choices = [
          {text: 'Choice 1a', value: '1'},
          {text: 'Choice 2a', value: '2'},
          {text: 'Choice 3a', value: '3'},
          {text: 'Choice 4a', value: '4'},
          {text: 'Choice 5a', value: '5'},
          {text: 'Choice 6a', value: '6'},
        ]
      }, 10000)
    }.bind(this));
  }

  showTemp() {
    this.model.temp[0].qty = 99;

    setTimeout(function() {
      this.model.temp.pop();
      console.log(this._watchedPaths)
    }.bind(this), 1000)
  }

  async readRec() {
    let res = await Module.table['eKVExJHhzJCpvxRC7Fsn8W'].getOne('3');
    this.model.contact = res;
  }
};

window.onload = function() {
  db4init();
}