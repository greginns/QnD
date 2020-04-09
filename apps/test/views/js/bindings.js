import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';
import {Page, Section} from '/static/apps/static/js/router.js';

class Bindings extends MVC {
  constructor(element) {
    super(element);
    
    //this.init(); //  use if not in router
  }

  init() {
    this.createModel();
    
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView(){
  }

  outView() {
    return true;  
  }

  createModel() {
    this.model.value1 = 'Greg';
    this.model.value2 = 'Miller';
    this.model.checkbox = true;
    this.model.radio = 'B';
    this.model.radioSel = [
      {value: 'A', text: 'Choice-A'},
      {value: 'B', text: 'Choice-B'},
      {value: 'C', text: 'Choice-C'}
    ]
    this.model.class = ['class1'];
    this.model.attr = {'value': '43'};
    this.model.optgroup = [
      {
        label: 'Group-1', 
        items: [
          {value: '11', text: 'Item-11'}, 
          {value: '12', text: 'Item-12'}, 
          {value: '13', text: 'Item-13'}
        ]
      },
      {
        label: 'Group-2', 
        items: [
          {value: '21', text: 'Item-21'}, 
          {value: '22', text: 'Item-22'}, 
          {value: '23', text: 'Item-23'}
        ]
      },
      {
        label: 'Group-3', 
        items: [
          {value: '31', text: 'Item-31'}, 
          {value: '32', text: 'Item-32'}, 
          {value: '33', text: 'Item-33'}
        ]
      }
    ];
    this.model.opt = '22';

    this.$addWatched('value1', this.watcher.bind(this));
    this.$addWatched('value2', this.watcher.bind(this));

    this.$addCalculated('fullname', "this.model.value1 + ' ' + this.model.value2");
  }

  watcher(nv, ov) {
    console.log(nv)
  }

  showModel() {
    this.$display(this.model);
  }

  showAttr(ev) {
    console.log(ev.target.getAttribute('data-value'));
  }
}

class Bindings2 extends MVC {
  constructor(element) {
    super(element);
    
    //this.init(); //  use if not in router
  }

  init() {
    this.createModel();
    
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView(){
  }

  outView() {
    return true;  
  }

  createModel() {
    this.model.showJS = true;
    this.model.showHTML = false;
    this.model.js = Bindings.toString().replace(/\t/g,'');
    this.model.html =  document.getElementById('bindings1').innerHTML;                 
  }

  showJS() {
    this.model.showJS = true;
    this.model.showHTML = false;
  }

  showHTML() {
    this.model.showJS = false;
    this.model.showHTML = true;
  }    
}

let t1 = new Bindings('bindings1');
let section1 = new Section({mvc: t1});

let t2 = new Bindings2('bindings2');
let section2 = new Section({mvc: t2});

let el = document.getElementById('bindings');
let page = new Page({el, path: 'bindings', title: 'Bindings', sections: [section1, section2]});

QnD.pages.push(page);