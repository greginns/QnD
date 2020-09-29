import {QnD} from '/static/lib/client/core/qnd.js';
import {MVC} from '/static/lib/client/core/mvc.js';
import {utils} from '/static/lib/client/core/utils.js';
import {Page, Section} from '/static/lib/client/core/paging.js';
import {TableView} from '/static/lib/client/core/data.js';

class Tenants extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.tenant = {};
    this.model.tenantOrig = {};
    this.model.tenantPk = '';
    this.model.tenants = [];
    this.model.errors = {
      tenant: {},
      message: '',
      _verify: []
    }

    this.model.goodMessage = '';
    this.model.baddMessage = '';

    this.$addWatched('tenantPK', this.tenantSelected.bind(this));

    this.defaults = {};

    // wait until common data access is going.
    document.getElementById('qndPages').addEventListener('tablestoreready', async function() {
      let tenants = new TableView({proxy: this.model.tenants});

      QnD.tableStores.tenant.addView(tenants);
    
      this.defaults.tenant = await QnD.tableStores.tenant.getDefault();
    }.bind(this), {once: true});

    //this.ready(); //  use if not in router
  }

  ready() {
    this.clearIt();

    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
    document.getElementById('admin-manage-navbar-tenants').classList.add('active');
    document.getElementById('admin-manage-navbar-tenants').classList.add('disabled');
  }

  outView() {
    document.getElementById('admin-manage-navbar-tenants').classList.remove('active');
    document.getElementById('admin-manage-navbar-tenants').classList.remove('disabled');

    return true;  
  }
  async save() {
    var tenant = this.model.tenant.toJSON();
    var tenantOrig = this.model.tenantOrig.toJSON();
    var tenantPK = this.model.tenantPK;
    var diffs;

    this.clearErrors();

    if (tenantPK) {
      diffs = utils.object.diff(tenantOrig, tenant);
      
      if (Object.keys(diffs).length == 0) {
        QnD.widgets.modal.alert('Nothing to update');
        return;
      }
    }      

    QnD.widgets.modal.spinner.show();
    // new (post) or old (put)?
    let res = (tenantPK) ? await QnD.tableStores.tenant.update(tenantPK, {tenant: diffs}) : await QnD.tableStores.tenant.insert({tenant});

    if (res.status == 200) {
      this.setGoodMessage('Tenant Saved');

      this.model.tenantOrig = this.$copy(this.model.tenant);
    }
    else {
      this.displayErrors(res);
    }
    
    QnD.widgets.modal.spinner.hide();
  }
  
  async delete() {
    var tenantPK = this.model.tenantPK;      
    
    if (!tenantPK) return;
    
    var ret = await QnD.widgets.modal.confirm('Are you sure that you wish to delete this Tenant?')
    if (ret != 0) return;
    
    this.clearErrors();
    QnD.widgets.modal.spinner.show();
    
    let res = await QnD.tableStores.tenant.delete(tenantPk);

    if (res.status == 200) {
      this.setGoodMessage('Tenant Deleted');

      this.clearit();
    }
    else {
      this.displayErrors(res);
    }

    QnD.widgets.modal.spinner.hide();
  }
  
  async clear() {
    if (await this.canClear()) {
      this.clearIt();
    }
  }
  
  async newTenant() {
    if (await this.canClear()) {
      this.clearIt(); 
    }
  }
  
  async canClear() {
    var tenant = this.model.tenant.toJSON();
    var orig = this.model.tenantOrig.toJSON();
    var diffs = utils.object.diff(orig, tenant);
    var ret;

    if (Object.keys(diffs).length > 0) {
      ret = await QnD.widgets.modal.confirm('Abandon changes?');
      if (ret != 0) return false;
    }

    return true;
  }
  
  clearIt() {
    this.clearErrors();
    this.setDefaults();
  }
  
  tenantSelected(nv) {
    // new tenant select from list
    if (nv) {
      this.setTenant(nv);  
    }
  }

  async getTenantFromList(pk) {
    return (pk) ? await QnD.tableStores.tenant.getOne(pk) : {};
  }
  
  async setTenant(pk) {
    this.clearErrors();

    this.model.tenant = await this.getTenantFromList(pk);
    this.model.tenantOrig = this.$copy(this.model.tenant);
  }
  
  setDefaults() {
    var dflts = this.defaults.tenant;
    
    for (var k in dflts) {
      this.model['tenant.'+k] = dflts[k];
    }
    
    this.model.tenantPK = '';
    this.model.tenantOrig = this.$copy(this.model.tenant);
  }
  
  displayErrors(res) {
    if ('data' in res && 'errors' in res.data) {
      for (let key of Object.keys(res.data.errors)) {
        if (key == 'message') {
          this.setBadMessage(res.data.errors.message);  
        }
        else {
          for (let k in res.data.errors[key]) {
            this.model.errors[key][k] = res.data.errors[key][k];
          };  
        }
      }
    }
    
    this.model.errors._verify = res.data.errors._verify;
  }
  
  clearErrors() {
    for (let key of Object.keys(this.model.errors)) {
      if (this.model.errors[key] instanceof Object) {
        for (let key2 of Object.keys(this.model.errors[key])) {
          this.model.errors[key][key2] = '';
        }
      }
      else {
        this.model.errors[key] = '';
      }
    }

    this.setBadMessage('');
  }

  setGoodMessage(msg) {
    this.model.goodMessage = msg;

    setTimeout(function() {
      this.model.goodMessage = '';
    }.bind(this), 5000);
  }

  setBadMessage(msg) {
    this.model.badMessage = msg;
  }

  async migrate() {
    var tenantPK = this.model.tenantPK;      
    
    if (!tenantPK) return;
    
    var ret = await QnD.widgets.modal.confirm("Are you sure you wish to run the migration for this Tenant?")
    if (ret != 0) return;
        
    this.clearErrors();
    QnD.widgets.modal.spinner.show();
    
    let res = await QnD.io.post({code: tenantPK}, '/admin/migrate');

    if (res.status == 200) {
      this.setGoodMessage('Tenant Migrated');
    }
    else {
      this.displayErrors(res);
    }
    
    QnD.widgets.modal.spinner.hide();
  }
}

// instantiate MVCs
let mvc = new Tenants('admin-manage-tenants-section');

// hook them up to sections that will eventually end up in a page (done in module)
let section1 = new Section({mvc});
let el = document.getElementById('admin-manage-tenants');   // page html
let page = new Page({el, path: '/tenants', title: 'Tenants', sections: [section1]});
    
QnD.pages.push(page);

/*
App.mvcObjs.admin_manage_tenants = {
  model: {
    tenant: {},
    tenantOrig: {},
    tenantPK: '',
    
    defaults: {
      tenant: {
        code: '',
        coname: '',
        first: '',
        last: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        phone: '',
        email: '',
        active: {{tenant.active.default}},
      },
    },
    
    errors: {
      tenant: {},
      message: '',
      _verify: [],
    }
  },

  lifecycle: {
    created: function() {
      var self = this;
      
      App.subs.data.subscribe('/admin/tenant', function(data) {
        self.$set('tenants', data);
      })

      return new Promise(function(resolve) {
        resolve();
      })
    },

    ready: function() {
      this.setDefaults();
    },

    inView: function(params) {
      var self = this;

      $('#admin-manage-navbar-tenants').addClass('active disabled');
      $('#admin-tenants-toast1').toast('hide');
    },

    outView: function() {
      $('#admin-manage-navbar-tenants').removeClass('active disabled');
    }
  },

  controllers: {
    save: async function(ev) {
      var self = this;
      var tenant = this.$get('tenant');
      var tenantPK = this.$get('tenantPK');
      var orig, diffs;
      var url = '/admin/tenant';

      this.clearErrors();
            
      // new (post) or old (put)?
      if (tenantPK) {
        // old, PUT differences
        orig = this.getTenantFromList(tenantPK);
        diffs = App.utils.object.diff(orig, tenant);
        
        if (Object.keys(diffs).length == 0) {
          App.modals.alert('Nothing to update');
          return;
        }
      }      
      else {
        tenant.code = tenant.code.replace(/\s/g,'');
        
        if (!tenant.code) {
          App.modals.alert('Tenant code cannot be blank');
          return;
        }
        
        orig = this.getTenantFromList(tenant.code);
        
        if (Object.keys(orig).length > 0) {
          App.modals.alert('Tenant code is in use');
          return;
        }
      }
      
      App.modals.spinner.show();

      ((tenantPK) ? io.put({tenant: diffs}, url + '/' + tenantPK) : io.post({tenant: tenant}, url))
      .then(function(res) {
        if (res.status == 200) {
          self.$set('toastMessage', 'Tenant ' + (tenantPK) ? 'Created' : 'Updated');
          $('#admin-manage-tenants-toast1').toast('show');

          self.clearIt();
        }
        else {
          self.displayErrors(res);
        }
      })
      .finally(function() {
        App.modals.spinner.hide();
      })
    },
    
    delete: async function() {
      var self = this;
      var tenantPK = this.$get('tenantPK');      
      
      if (!tenantPK) return;
      
      var res = await App.modals.confirm("Are you sure that you wish to delete this tenant?")
      if (res != 0) return;

      this.clearErrors();
      App.modals.spinner.show();
      
      io.delete({}, '/admin/tenant/' + tenantPK)
      .then(function(res) {
        if (res.status == 200) {
          self.$set('toastMessage', 'Tenant Deleted');
          $('#admin-manage-tenants-toast1').toast('show');
          
          self.clearIt();
        }
        else {
          self.displayErrors(res);
        }
      })
      .finally(function() {
        App.modals.spinner.hide();
      })
    },
    
    migrate: async function() {
      var self = this;
      var tenantPK = this.$get('tenantPK');      
      
      if (!tenantPK) return;
      
      var res = await App.modals.confirm("Are you sure you wish to run the migration for this Tenant?")
      if (res != 0) return;
          
      this.clearErrors();
      App.modals.spinner.show();
      
      io.post({code: tenantPK}, '/admin/migrate')
      .then(function(res) {
        if (res.status == 200) {
          self.$set('toastMessage', 'Tenant Migrated');
          $('#admin-manage-tenants-toast1').toast('show');
        }
        else {
          self.displayErrors(res);
        }
      })
      .finally(function() {
        App.modals.spinner.hide();
      })
    },
    
    
    clear: async function() {
      if (await this.canClear()) {
        this.clearIt();
      }
    },
    
    newTenant: async function() {
      if (await this.canClear()) {
        this.clearIt(); 
      }
    },
    
    canClear: async function() {
      var tenant = this.$get('tenant');
      var orig = this.$get('tenantOrig');
      var diffs = App.utils.object.diff(orig, tenant);
      var ret;

      if (Object.keys(diffs).length > 0) {
        ret = await App.modals.confirm('Abandon changes?');
        if (ret != 0) return false;
      }

      return true;
    },
    
    clearIt: function() {
      this.clearErrors();
      this.setDefaults();
    },
    
    getTenantFromList: function(pk) {
      var self = this;
      var tenants = this.$get('tenants') || [];
      var tenret = {};

      if (pk) {      
        tenants.forEach(function(ten) {
          if (ten.code == pk) {
            tenret = ten;
          }
        })
      }
      
      return tenret;
    },
    
    setTenant: function(pk) {
      this.clearErrors();
      
      this.$set('tenant', this.getTenantFromList(pk));
      this.$set('tenantOrig', this.$get('tenant'));
    },
    
    setDefaults: function() {
      var dflts = this.$get('defaults.tenant');
      
      for (var k in dflts) {
        this.$set('tenant.'+k, dflts[k]);
      }
      
      this.$set('tenantPK', '');
      this.$set('tenantOrig', this.$get('tenant'));
    },
    
    displayErrors: function(res) {
      var self = this;
      
      if ('data' in res && 'errors' in res.data) {
        Object.keys(res.data.errors).forEach(function(key) {
          if (key == 'message') {
            App.modals.alert(res.data.errors.message);  
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
      
      this.$set('errors._verify', []);
    },
  },

  watch: {
    'tenantPK': async function(nv, ov) {
      if (nv) {
        if (await this.canClear()) {
          this.setTenant(nv);
        }
        else {
          this.$set('tenantPK', ov, true);
        }
      }
    }
  }
}
*/