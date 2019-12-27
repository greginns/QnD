App.mvcObjs.admin_manage_users = {
  model: {
    admin_user: {},
    userOrig: {},
    userPK: '',
    
    defaults: {
      admin_user: {
        code: '',
        name: '',
        email: '',
        password: '',
        active: {{admin_user.active.default}},
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
      
      App.subs.data.subscribe('/admin/admin_user', function(data) {
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
      var user = this.$get('admin_user');
      var userPK = this.$get('userPK');
      var url = '/admin/admin_user';

      App.modals.spinner.show();
      this.clearErrors();
            
      // new (post) or old (put)?
      if (userPK) {
        // old, PUT differences
        var orig = this.getUserFromList(userPK);
        var diffs = App.utils.object.diff(orig, user);
        
        if (Object.keys(diffs).length == 0) {
          App.modals.spinner.hide();
          
          App.modals.alert('Nothing to update');
          return;
        }
      }      

      ((userPK) ? io.put({admin_user: diffs}, url + '/' + userPK) : io.post({admin_user: user}, url))
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
        App.modals.spinner.hide();
      })
    },
    
    delete: async function() {
      var self = this;
      var userPK = this.$get('userPK');      
      
      if (!userPK) return;
      
      var res = await App.modals.confirm('Are you sure that you wish to delete this User?')
      if (res != 0) return;
      
      this.clearErrors();
      App.modals.spinner.show();
      
      io.delete({}, '/admin/admin_user/' + userPK)
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
        App.modals.spinner.hide();
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
      var user = this.$get('admin_user');
      var orig = this.$get('userOrig');
      var diffs = App.utils.object.diff(orig, user);
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
    
    getUserFromList: function(pk) {
      var self = this;
      var users = this.$get('users');
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

      this.$set('admin_user', this.getUserFromList(pk));
      this.$set('userOrig', this.$get('admin_user'));
    },
    
    setDefaults: function() {
      var dflts = this.$get('defaults.admin_user');
      
      for (var k in dflts) {
        this.$set('admin_user.'+k, dflts[k]);
      }
      
      this.$set('userPK', '');
      this.$set('userOrig', this.$get('admin_user'));
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