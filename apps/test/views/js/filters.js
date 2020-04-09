import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';
import {Page, Section} from '/static/apps/static/js/router.js';

class Filters extends MVC {
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
    this.model.value1='Greg';
    this.model.pass='Password';
    this.model.date = new Date().toJSON();
    this.model.time = new Date().toJSON();
    this.model.step = 4;
    this.model.integer = 5;
    this.model.floatpos = 42.7;
    this.model.float = -14.5;
    this.model.dollar = 1.475;
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


class Filters2 extends MVC {
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
    this.model.js = Filters.toString().replace(/\t/g,'');   
    this.model.html =  document.getElementById('filters1').innerHTML;           
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

let t1 = new Filters('filters1');
let section1 = new Section({mvc: t1});

let t2 = new Filters2('filters2');
let section2 = new Section({mvc: t2});

let el = document.getElementById('filters');
let page = new Page({el, path: 'filters', title: 'Filters, Edits, and Roles', sections: [section1, section2]});
    
QnD.pages.push(page);    