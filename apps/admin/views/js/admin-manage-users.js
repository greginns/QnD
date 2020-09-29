import {QnD} from '/static/lib/client/core/qnd.js';
import {MVC} from '/static/lib/client/core/mvc.js';
import {utils} from '/static/lib/client/core/utils.js';
import {Page, Section} from '/static/lib/client/core/paging.js';
import {TableView} from '/static/lib/client/core/data.js';

class Users extends MVC {
  constructor(element) {
    super(element);
  }

  createModel() {
    this.model.user = {};
    this.model.userOrig = {};
    this.model.userPk = '';
    this.model.users = [];
    this.model.errors = {
      user: {},
      message: ''
    }

    this.model.goodMessage = '';
    this.model.badMessage = '';

    this.$addWatched('userPK', this.userSelected.bind(this));
        
    this.defaults = {};

    document.getElementById('qndPages').addEventListener('tablestoreready', async function() {
      let users = new TableView({proxy: this.model.users});

      QnD.tableStores.user.addView(users);
    
      this.defaults.user = await QnD.tableStores.user.getDefault();      
    }.bind(this), {once: true})    

    //this.ready(); //  use if not in router
  }

  ready() {
    return new Promise(function(resolve) {
      resolve();
    })          
  }
  
  inView() {
    document.getElementById('admin-manage-navbar-users').classList.add('active');
    document.getElementById('admin-manage-navbar-users').classList.add('disabled');
  }

  outView() {
    document.getElementById('admin-manage-navbar-users').classList.remove('active');
    document.getElementById('admin-manage-navbar-users').classList.remove('disabled');

    return true;  
  }

  async save() {
    var user = this.model.user.toJSON();
    var userOrig = this.model.userOrig.toJSON();
    var userPK = this.model.userPK;
    var diffs;

    this.clearErrors();
          
    if (userPK) {
      diffs = utils.object.diff(userOrig, user);
      
      if (Object.keys(diffs).length == 0) {
        QnD.widgets.modal.alert('Nothing to update');
        return;
      }
    }      

    QnD.widgets.modal.spinner.show();

    // new (post) or old (put)?
    let res = (userPK) ? await QnD.tableStores.user.update(userPK, {user: diffs}) : await QnD.tableStores.user.insert({user});

    if (res.status == 200) {
      this.setGoodMessage('User Saved');
    
      this.model.userOrig = this.$copy(this.model.user);
    }
    else {
      this.displayErrors(res);
    }
    
    QnD.widgets.modal.spinner.hide();
  }
  
  async delete() {
    var userPK = this.model.userPK;      
    
    if (!userPK) return;
    
    var ret = await QnD.widgets.modal.confirm('Are you sure that you wish to delete this User?')
    if (ret != 0) return;
    
    this.clearErrors();
    QnD.widgets.modal.spinner.show();
    
    let res = await QnD.tableStores.user.delete(userPk);

    if (res.status == 200) {
      this.setGoodMessage('User Deleted');

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
  
  async newUser() {
    if (await this.canClear()) {
      this.clearIt(); 
    }
  }
  
  async canClear() {
    var user = this.model.user.toJSON();
    var orig = this.model.userOrig.toJSON();
    var diffs = utils.object.diff(orig, user);
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
  
  userSelected(nv) {
    // new user select from list
    if (nv) {
      this.setUser(nv);  
    }
  }

  async getUserFromList(pk) {
    return (pk) ? await QnD.tableStores.user.getOne(pk) : {};
  }
  
  async setUser(pk) {
    this.clearErrors();

    this.model.user = await this.getUserFromList(pk);
    this.model.userOrig = this.$copy(this.model.user);
  }
  
  setDefaults() {
    var dflts = this.defaults.user;
    
    for (var k in dflts) {
      this.model['user.'+k] = dflts[k];
    }
    
    this.model.userPK = '';
    this.model.userOrig = this.$copy(this.model.user);
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

    this.model.badMessage = '';
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
}

// instantiate MVCs
let mvc= new Users('admin-manage-users-section');

// hook them up to sections that will eventually end up in a page (done in module)
let section1 = new Section({mvc});
let el = document.getElementById('admin-manage-users');   // page html
let page = new Page({el, path: '/users', title: 'Users', sections: [section1]});
    
QnD.pages.push(page);

/*
App.mvcObjs.admin_manage_users = {
  model: {
    user: {},
    userOrig: {},
    userPK: '',
    
    defaults: {
      user: {
        code: '',
        name: '',
        email: '',
        password: '',
        active: {{user.active.default}},
      },
    },
    
    errors: {
      user: {},
      message: '',
    }
  },

  lifecycle: {
    created: function() {
      var self = this;
      
      App.subs.data.subscribe('/admin/user', function(data) {
        self.$set('users', data);
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

      $('#admin-manage-navbar-users').addClass('active disabled');
      $('#admin-users-toast1').toast('hide');
    },

    outView: function() {
      $('#admin-manage-navbar-users').removeClass('active disabled');
    }
  },

  controllers: {
    save: async function(ev) {
      var self = this;
      var user = this.model.user');
      var userPK = this.model.userPK');
      var url = '/admin/user';

      QnD.widgets.modal.spinner.show();
      this.clearErrors();
            
      // new (post) or old (put)?
      if (userPK) {
        // old, PUT differences
        var orig = this.getUserFromList(userPK);
        var diffs = App.utils.object.diff(orig, user);
        
        if (Object.keys(diffs).length == 0) {
          QnD.widgets.modal.spinner.hide();
          
          QnD.widgets.modal.alert('Nothing to update');
          return;
        }
      }      

      ((userPK) ? io.put({user: diffs}, url + '/' + userPK) : io.post({user: user}, url))
      .then(function(res) {
        if (res.status == 200) {
          self.$set('toastMessage', 'User Saved');
          $('#admin-manage-users-toast1').toast('show');
        
          self.clearIt();
        }
        else {
          self.displayErrors(res);
        }
      })
      .finally(function() {
        QnD.widgets.modal.spinner.hide();
      })
    },
    
    delete: async function() {
      var self = this;
      var userPK = this.model.userPK');      
      
      if (!userPK) return;
      
      var res = await QnD.widgets.modal.confirm('Are you sure that you wish to delete this User?')
      if (res != 0) return;
      
      this.clearErrors();
      QnD.widgets.modal.spinner.show();
      
      io.delete({}, '/admin/user/' + userPK)
      .then(function(res) {
        if (res.status == 200) {
          self.$set('toastMessage', 'User Deleted');
          $('#admin-manage-users-toast1').toast('show');

          self.clearit();
        }
        else {
          self.displayErrors(res);
        }
      })
      .finally(function() {
        QnD.widgets.modal.spinner.hide();
      })
    },
    
    clear: async function() {
      if (await this.canClear()) {
        this.clearIt();
      }
    },
    
    newUser: async function() {
      if (await this.canClear()) {
        this.clearIt(); 
      }
    },
    
    canClear: async function() {
      var user = this.model.user');
      var orig = this.model.userOrig');
      var diffs = App.utils.object.diff(orig, user);
      var ret;

      if (Object.keys(diffs).length > 0) {
        ret = await QnD.widgets.modal.confirm('Abandon changes?');
        if (ret != 0) return false;
      }

      return true;
    },
    
    clearIt: function() {
      this.clearErrors();
      this.setDefaults();
    },
    
    getUserFromList: function(pk) {
      var self = this;
      var users = this.model.users');
      var tenret = {};
      
      if (pk) {
        users.forEach(function(ten) {
          if (ten.code == pk) {
            tenret = ten;
          }
        })        
      }

      return tenret;
    },
    
    setUser: function(pk) {
      this.clearErrors();

      this.$set('user', this.getUserFromList(pk));
      this.$set('userOrig', this.model.user'));
    },
    
    setDefaults: function() {
      var dflts = this.model.defaults.user');
      
      for (var k in dflts) {
        this.$set('user.'+k, dflts[k]);
      }
      
      this.$set('userPK', '');
      this.$set('userOrig', this.model.user'));
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
      
      this.$set('errors._verify', this.model.errors._verify'));
    },
    
    clearErrors: function() {
      var self = this;
      var errors = this.model.errors');
      
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
    'userPK': async function(nv, ov) {
      if (nv) {
        if (await this.canClear()) {
          this.setUser(nv);  
        }
        else {
          this.$set('userPK', ov, true);
        }
      }
    }
  }
}
*/