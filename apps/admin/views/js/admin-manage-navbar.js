import {QnD} from '/static/lib/client/core/qnd.js';
import {MVC} from '/static/lib/client/core/mvc.js';

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

    if (res.status == 302) {
      location = res.data;
    }
    else {
      QnD.widgets.modal.alert(res);
    }
  })
}

new Navbar('admin-manage-navbar');