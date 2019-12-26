const root = process.cwd();
const Fields = require(root + '/server/model/modelFields');
const modelBuild = require(root + '/server/model/modelBuild.js');
const modelRun = require(root + '/server/model/modelRun.js');

var setNewDate = function() {
  return new Date();
};

module.exports = function(buildOrRun) {
  var Model = (!buildOrRun) ? modelRun : modelBuild;
  
  var models = {
    login_User: class login_User extends Model {
      constructor(obj, opts) {
        super(obj, opts);
      }
      
      static definition() {
        return {
          schema: {
            code: new Fields.Char({notNull: true, maxLength: 10, verbose: 'User Code'}),
            name: new Fields.Char({notNull: true, maxLength: 30, verbose: 'User Name'}),
            email: new Fields.Char({notNull: true, maxLength: 50, isEmail: true, verbose: 'Email Address'}),
            password: new Fields.Password({notNull: true, minLength: 8, maxLength: 128, verbose: 'Password'}),
            active: new Fields.Boolean({default: true, verbose: 'Active'}),     
          },
          
          constraints: {
            pk: ['code'],
          },
          
          hidden: ['password'],
          
          orderBy: ['name'],
          
          dbschema: 'tenant',
        }
      }
    },

    login_CSRF: class login_CSRF extends Model {
      constructor(obj, opts) {
        super(obj, opts);
      }
      
      static definition() {
        return {
          schema: {
            token: new Fields.Char({notNull: true, maxLength: 128, verbose: 'CSRF Token'}),
            user: new Fields.Char({null: true, maxLength: 10, verbose: 'User Code'}),
            issued: new Fields.DateTime({notNull: true, maxLength: 30, onBeforeInsert: setNewDate, verbose: 'Issued On'}),
          },
          
          constraints: {
            pk: ['token'],
            fk: [{name: 'user', columns: ['user'], table: models.login_User, tableColumns: ['code'], onDelete: 'NO ACTION'}],
          },
          
          orderBy: ['issued'],
          
          dbschema: 'tenant',
        }
      }
    },
  }
  
  return models;
};
