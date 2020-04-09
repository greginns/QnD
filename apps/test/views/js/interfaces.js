import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';
import {Page, Section} from '/static/apps/static/js/router.js';

class Interfaces extends MVC {
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
    this.model.date = (new Date).toJSON();
    this.model.time = (new Date).toJSON();
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
  }

  async multi() {
    let ret = await QnD.widgets.multisel.select('Multi Select Example', this.model.optgroup, []);
    console.log('returned',ret);
  }

  async single() {
    let ret = await QnD.widgets.singlesel.select('Single Select Example', this.model.optgroup, '');
    console.log('returned',ret)
  }

  async alert() {
    let ret = await QnD.widgets.modal.alert('Yo!');
    console.log(ret)
  }

  async confirm() {
    let ret = await QnD.widgets.modal.confirm('Yo!');
    console.log(ret)
  }

  async prompt() {
    try {
      let ret = await QnD.widgets.modal.prompt('Yo!');
      console.log(ret)
    }
    catch(err) {
      console.log('rejected', err)
    }
  }
}

class Interfaces2 extends MVC {
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
    this.model.js = Interfaces.toString().replace(/\t/g,'');
    this.model.html =  document.getElementById('interfaces1').innerHTML;     
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

let t1 = new Interfaces('interfaces1');
let section1 = new Section({mvc: t1});

let t2 = new Interfaces2('interfaces2');
let section2 = new Section({mvc: t2});

let el = document.getElementById('interfaces');
let page = new Page({el, path: 'interfaces', title: 'Interfaces', sections: [section1, section2]});
    
QnD.pages.push(page);    
