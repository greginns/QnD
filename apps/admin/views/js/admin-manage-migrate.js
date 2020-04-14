import {QnD} from '/static/apps/static/js/qnd.js';
import {MVC} from '/static/apps/static/js/mvc.js';
import {Page, Section} from '/static/apps/static/js/router.js';

class Migrate extends MVC {
  constructor(element) {
    super(element);
    
    //this.init(); //  use if not in router
  }

  createModel() {
    this.model.tenant = {};
    this.model.runAll = false;
    this.model.errors = {
      message: '',
      _verify: []
    }
  }

  init() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
    document.getElementById('admin-manage-navbar-migrate').classList.add('active');
    document.getElementById('admin-manage-navbar-migrate').classList.add('disabled');
    //$('#admin-manage-navbar-migrate').addClass('active disabled');
    //$('#admin-migrate-toast1').toast('hide');
  }

  outView() {
    document.getElementById('admin-manage-navbar-migrate').classList.remove('active');
    document.getElementById('admin-manage-navbar-migrate').classList.remove('disabled');
    //$('#admin-manage-navbar-migrate').removeClass('active disabled');

    return true;  
  }

  async migrateOne(ev) {
    var self = this;
    var idx = ev.target.querySelector('div.row').getAttribute('data-index');
    var tenants = this.model.tenants;
    var code = tenants[idx].code;

    QnD.widgets.modal.spinner.show();
    
    await this.migrate(code, idx);

    QnD.widgets.modal.spinner.hide();
  }
  
  async migrateAll() {
    var tenants = this.model.tenants;
    var res = await QnD.widgets.modal.confirm('Are you sure that you want to run ALL migrations?');

    if (res != '0') return;

    this.model.runAll = true;
    QnD.widgets.modal.spinner.show();
    
    for (var i=0; i<tenants.length; i++) {
      await this.migrate(tenants[i].code, i);
      
      if (!this.model.runAll) break;
    }

    this.model.runAll = false;
    QnD.widgets.modal.spinner.hide();
  }
  
  async migrate(code, idx) {
    var err;
    
    let res = await io.post({code}, '/admin/migrate');

    if (res.status == 200) {
      err = 'Success';
    }
    else {
      err = res.errors._verify;
    }
  
    this.model.errors[idx] = err;
  }
  
  abortAll() {
    this.model.runAll = false;
  }
  
  displayErrors(res) {
    if ('data' in res && 'errors' in res.data) {
      for (let key of Object.keys(res.data.errors)) {
        if (key == 'message') {
          QnD.widgets.modal.alert(res.data.errors.message);  
        }
        else {
          for (let k of res.data.errors[key]) {
            this.model.errors[key][k] = v;
          };  
        }
      }
    }
    
    this.model.errors._verify = res.errors._verify;
  }
  
  clearErrors() {
    for (let key of Object.keys(this.model.errors)) {
      if (errors[key] instanceof Object) {
        for (let key2 of Object.keys(this.model.errors[key])) {
          this.model.errors[key][key2] = '';
        }
      }
      else {
        this.model.errors[key] = '';
      }
    }
  }
}

// instantiate MVCs
let mvc= new Migrate('admin-manage-migrate-section');

// hook them up to sections that will eventually end up in a page (done in module)
let section1 = new Section({mvc});
let el = document.getElementById('admin-manage-migrate');   // page html
let page = new Page({el, path: 'migrations', title: 'Migrations', sections: [section1]});
    
QnD.pages.push(page);

/*

    migrateOne: async function(ev) {
      var self = this;
      var idx = $(ev.target).closest('div.row').attr('data-index');
      var tenants = this.$get('tenants');
      var code = tenants[idx].code;

      QnD.widgets.modal.spinner.show();
      
      await this.migrate(code, idx);

      QnD.widgets.modal.spinner.hide();
    },
    
    migrateAll: async function() {
      var self = this;
      var tenants = this.$get('tenants');
      
      var res = await QnD.widgets.modal.confirm('Are you sure that you want to run ALL migrations?');
      if (res != '0') return;

      this.$set('runAll', true);      
      QnD.widgets.modal.spinner.show();
      
      for (var i=0; i<tenants.length; i++) {
        await this.migrate(tenants[i].code, i);
        
        if (!this.$get('runAll')) break;
      }

      this.$set('runAll', false);
      QnD.widgets.modal.spinner.hide();
    },
    
    migrate: function(code, idx) {
      var err;
      
      return new Promise(function(resolve) {
        io.post({code}, '/admin/migrate')
        .then(function(res) {
          if (res.status == 200) {
            err = 'Success';
          }
          else {
            err = res.errors._verify;
          }
          
          this.$set('errors[' + idx + ']', err);
        })
        .finally(function() {
          resolve();          
        });
      });
    },
    
    abortAll: function() {
      this.$set('runAll', false);
    },
    
    timer: function(msecs) {
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve();
        }, msecs);     
      })
    },
    
    displayErrors: function(res) {
      var self = this;
      
      if ('data' in res && 'errors' in res.data) {
        Object.keys(res.data.errors).forEach(function(key) {
          if (key == 'message') {
            QnD.widgets.modal.alert(res.data.errors.message);  
          }
          else {
            _.forOwn(res.data.errors[key], function(v, k) {
              self.$set('errors.' + key + '.' + k, v);  
            });  
          }
        })
      }
      
      this.$set('errors._verify', this.$get('errors._verify'));
    },
    
    clearErrors: function() {
      var self = this;
      var errors = this.$get('errors');
      
      Object.keys(errors).forEach(function(key) {
        if (errors[key] instanceof Object) {
          Object.keys(errors[key]).forEach(function(key2) {
            self.$set('errors.' + key + '.' + key2, '');
          })          
        }
        else {
          self.$set('errors.' + key, '');
        }
      })
    },
  },

  watch: {
  }
}
*/