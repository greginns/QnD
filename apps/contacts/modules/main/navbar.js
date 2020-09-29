import {Module} from '/~static/lib/client/core/module.js';
import {MVC} from '/~static/lib/client/core/mvc.js';
import {Section} from '/~static/lib/client/core/paging.js';

class Navbar extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.isAdmin = true;

    this.ready(); //  use if not in router
  }

  ready() {
    var self = this;

    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  async inView(params) {
    //document.getElementById('admin-manage-navbar-contacts').classList.add('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.add('disabled');
  }

  outView() {
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('active');
    //document.getElementById('admin-manage-navbar-contacts').classList.remove('disabled');

    return true;  
  }

  setActive(ref) {
    let entry = this._section.querySelectorAll('[ref='+ref+']');

    if (entry.length > 0) {
      entry = entry[0];
      entry.classList.add('active');
      entry.classList.add('disabled');
    }
  }

  setInactive(ref) {
    let entry = this._section.querySelectorAll('[ref='+ref+']');

    if (entry.length > 0) {
      entry = entry[0];
      entry.classList.remove('active');
      entry.classList.remove('disabled');
    }    
  }
}

let mvc1 = new Navbar('contacts-navbar');

Module.navbar = mvc1; 
new Section({mvc: mvc1});