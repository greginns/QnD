import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';

class Navbar extends MVC {
  constructor(element) {
    super(element);
    
    this.init(); //  use if not in router
  }

  init() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
  }

  outView() {
    return true;  
  }

  async logout() {
    let res = await io.delete({}, '/admin/logout');

    if (res.status == 200) {
      location = res.data;
    }
    else {
      QnD.widgets.modal.alert(res);
    }
  })
}

new Navbar('admin-manage-navbar');