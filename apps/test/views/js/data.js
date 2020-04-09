import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';
import {Page, Section} from '/static/apps/static/js/router.js';
import {TableStore, TableView} from '/static/apps/static/js/data.js';

class Data extends MVC {
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
    this.model.sortedData = [];
    this.model.filteredData = [];

    let sortFunc = function(a,b) {
      return (a.last < b.last) ? -1 : (a.last > b.last) ? 1 : 0;
    };

    let filterFunc = function(x) {
      return x.first.length > 3;
    }

    // setup data/view stores
    this.testdataStore = new TableStore({url: '/test/testdata', safemode: false});
    let viewSorted = new TableView({proxy: this.model.sortedData, sortFunc});
    let viewFiltered = new TableView({proxy: this.model.filteredData, filterFunc});

    this.testdataStore.addView(viewSorted);
    this.testdataStore.addView(viewFiltered);

    // get some data
    this.testdataStore.getAll();
  }

  async addDrew() {
    let row = {_pk: 'DK', first: 'Drew', last: 'Carey'};
    let res = await this.testdataStore.insert(row);
  }

  async changeMerv() {
    let row = {_pk: '456', first: 'Perv', last: 'Griffin'};
    let res = await this.testdataStore.update('456', row);
  }

  async deleteAlex() {
    let res = await this.testdataStore.delete('123');
  }
}

class Data2 extends MVC {
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
    this.model.js = Data.toString().replace(/\t/g,'');
    this.model.html = document.getElementById('data1').innerHTML;     
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

// instantiate MVCs
let t1 = new Data('data1');
let t2 = new Data2('data2');

// hook them up to router
let section1 = new Section({mvc: t1});
let section2 = new Section({mvc: t2});

let el = document.getElementById('data');
let page = new Page({el, path: 'data', title: 'Data', sections: [section1, section2]});
    
QnD.pages.push(page);  