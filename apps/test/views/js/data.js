import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';
import {Page, Section} from '/static/apps/static/js/router.js';
import {TableView} from '/static/apps/static/js/data.js';

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
    this.model.bothData = [];

    let sortFunc = function(a,b) {
      return (a.last < b.last) ? -1 : (a.last > b.last) ? 1 : 0;
    };

    let filterFunc = function(x) {
      return x.first.length > 3;
    }

    // setup data/view stores
    let viewSorted = new TableView({proxy: this.model.sortedData, sortFunc});
    let viewFiltered = new TableView({proxy: this.model.filteredData, filterFunc});
    let viewBoth = new TableView({proxy: this.model.bothData, filterFunc, sortFunc});

    // QnD.tableStores.testdata setup in module.js
    QnD.tableStores.testdata.addView(viewSorted);
    QnD.tableStores.testdata.addView(viewFiltered);
    QnD.tableStores.testdata.addView(viewBoth);
  }

  async addDrew() {
    let row = {_pk: 'DK', first: 'Drew', last: 'Carey'};
    let res = await QnD.tableStores.testdata.insert(row);
    console.log(res)
  }

  async changeMerv() {
    let row = {_pk: '456', first: 'Perv', last: 'Griffin'};
    let res = await QnD.tableStores.testdata.update('456', row);
    console.log(res)
  }

  async deleteAlex() {
    let res = await QnD.tableStores.testdata.delete('123');
    console.log(res)
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

// hook them up to sections that will eventually end up in a page (done in module)
let section1 = new Section({mvc: t1});
let section2 = new Section({mvc: t2});
let el = document.getElementById('data');   // page html
let page = new Page({el, path: 'data', title: 'Data', sections: [section1, section2]});
    
QnD.pages.push(page);  