const root = process.cwd();
const {JSONError} = require(root + '/lib/errors.js');
const {ResponseMessage} = require(root + '/lib/messages.js');
const services = require(root + '/apps/timeclock/server/services.js');
const {Router, RouterMessage} = require(root + '/lib/router.js');

// generic tenant query
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/query', 
  fn: async function(req, res) {

    var tm;
    var query = {
      Work: {
        columns: ['*'],
        innerJoin: [
          {Employee: {
            columns: ['*'],
            innerJoin: [
              {Department: {columns: ['*']}},
            ]
          }},
          {Workcode: {columns: ['*']}}
        ],
        orderBy: [{Work: ['employee', 'sdate', 'stime', 'etime']}]
      }
    };

    try {
      //var query = JSON.parse(req.parsedURL.query.query);

      tm = await services.query(query);
  
    }
    catch(err) {
      rm.err = new JSONError(err);
    }

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// Pages
// manage page
Router.add(new RouterMessage({
  method: 'get',
  path: ['/timeclock/manage/:etc', '/timeclock/manage'], 
  fn: async function(req, res) {
    var tm = await services.output.manage(req);

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: false, redirect: '/timeclock'}
}));

// empclock page
Router.add(new RouterMessage({
  method: 'get',
  path: ['/timeclock/empclock/:etc', '/timeclock/empclock'], 
  fn: async function(req, res) {
    var tm = await services.output.empclock(req);

    return tm.toResponse();
  }, 
  options: {needLogin: false, needCSRF: false, allowAnon: true}
}));

// tips page
Router.add(new RouterMessage({
  method: 'get',
  path: ['/timeclock/tips/:etc', '/timeclock/tips'], 
  fn: async function(req, res) {
    var tm = await services.output.tips(req);

    return tm.toResponse();
  }, 
  options: {needLogin: false, needCSRF: false, allowAnon: true}
}));

// Models
// department
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/department', 
  fn: async function(req, res) {
    var tm = await services.department.get({pgschema: req.TID});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/department/:code', 
  fn: async function(req, res) {
    var tm = await services.department.get({pgschema: req.TID, rec: {code: req.params.code}});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/department', 
  fn: async function(req, res) {
    var tm = await services.department.insert({pgschema: req.TID, rec: req.body.department});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: '/timeclock/department/:code', 
  fn: async function(req, res) {
    var tm = await services.department.update({pgschema: req.TID, code: req.params.code, rec: req.body.department});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: '/timeclock/department/:code', 
  fn: async function(req, res) {
    var tm = await services.department.delete({pgschema: req.TID, code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// Employee
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/employee', 
  fn: async function(req, res) {
    var tm = await services.employee.get({pgschema: req.TID});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/employee/:code', 
  fn: async function(req, res) {
    var tm = await services.employee.get({pgschema: req.TID, rec: {code: req.params.code}});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/employee', 
  fn: async function(req, res) {
    var tm = await services.employee.insert({pgschema: req.TID, rec: req.body.employee});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: '/timeclock/employee/:code', 
  fn: async function(req, res) {
    var tm = await services.employee.update({pgschema: req.TID, code: req.params.code, rec: req.body.employee});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: '/timeclock/employee/:code', 
  fn: async function(req, res) {
    var tm = await services.employee.delete({pgschema: req.TID, code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// workcode
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/workcode', 
  fn: async function(req, res) {
    var tm = await services.workcode.get({pgschema: req.TID});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/workcode/:code', 
  fn: async function(req, res) {
    var tm = await services.workcode.get({pgschema: req.TID, rec: {code: req.params.code}});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/workcode', 
  fn: async function(req, res) {
    var tm = await services.workcode.insert({pgschema: req.TID, rec: req.body.workcode});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: '/timeclock/workcode/:code', 
  fn: async function(req, res) {
    var tm = await services.workcode.update({pgschema: req.TID, code: req.params.code, rec: req.body.workcode});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: '/timeclock/workcode/:code', 
  fn: async function(req, res) {
    var tm = await services.workcode.delete({pgschema: req.TID, code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// empwork
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/empwork/:employee', 
  fn: async function(req, res) {
    var tm = await services.empwork.get({pgschema: req.TID, rec: {employee: req.params.employee}});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/empwork/:employee/:workcode', 
  fn: async function(req, res) {
    var tm = await services.empwork.get({pgschema: req.TID, rec: {employee: req.params.employee, workcode: req.params.workcode}});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/empwork', 
  fn: async function(req, res) {
    var tm = await services.empwork.insert({pgschema: req.TID, rec: req.body.empwork});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: '/timeclock/empwork/:id', 
  fn: async function(req, res) {
    var tm = await services.empwork.update({pgschema: req.TID, id: req.params.id, rec: req.body.empwork});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: '/timeclock/empwork/:id', 
  fn: async function(req, res) {
    var tm = await services.empwork.delete({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// work
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/work/:employee', 
  fn: async function(req, res) {
    var tm = await services.work.get({pgschema: req.TID, rec: {employee: req.params.employee}});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/work', 
  fn: async function(req, res) {
    var tm = await services.work.insert({pgschema: req.TID, rec: req.body.work});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: '/timeclock/work/:id', 
  fn: async function(req, res) {
    var tm = await services.work.update({pgschema: req.TID, id: req.params.id, rec: req.body.work});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: '/timeclock/work/:id', 
  fn: async function(req, res) {
    var tm = await services.work.delete({pgschema: req.TID, id: req.params.id});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// user
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/user', 
  fn: async function(req, res) {
    var tm = await services.user.get({pgschema: req.TID});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/user', 
  fn: async function(req, res) {
    var tm = await services.user.insert({pgschema: req.TID, rec: req.body.workcode});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: '/timeclock/user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.update({pgschema: req.TID, code: req.params.code, rec: req.body.user});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

Router.add(new RouterMessage({
  method: 'delete',
  path: '/timeclock/user/:code', 
  fn: async function(req, res) {
    var tm = await services.user.delete({pgschema: req.TID, code: req.params.code});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));

// Empclock
Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/empclock/login', 
  fn: async function(req, res) {
    var tm = await services.empclock.login(req.body);

    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false, allowAnon: true}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/empclock/empwork/:emp', 
  fn: async function(req, res) {
    var tm = await services.empclock.empwork({pgschema: req.TID, emp: req.params.emp});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: true, allowAnon: true}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/empclock/work/:emp', 
  fn: async function(req, res) {
    var tm = await services.empclock.work({pgschema: req.TID, emp: req.params.emp});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: true, allowAnon: true}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/empclock/clockin', 
  fn: async function(req, res) {
    var tm = await services.empclock.clockin({pgschema: req.TID, employee: req.body.employee, workcode: req.body.workcode, payrate: req.body.payrate});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: true, allowAnon: true}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/empclock/clockout/:emp/:id', 
  fn: async function(req, res) {
    var tm = await services.empclock.clockout({pgschema: req.TID, emp: req.params.emp, id: req.params.id});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: true, allowAnon: true}
}));

// Tips
Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/tips/login', 
  fn: async function(req, res) {
    var tm = await services.tips.login(req.body);

    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false, allowAnon: true}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/tips/:dept/:date', 
  fn: async function(req, res) {
    var tm = await services.tips.get({pgschema: req.TID, dept: req.params.dept, date: req.params.date});

    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/tips/:emp', 
  fn: async function(req, res) {
    var tm = await services.tips.insert({pgschema: req.TID, emp: req.params.emp, dt: req.body.date, work: req.body.work, tip: req.body.tip});

    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'put',
  path: '/timeclock/tips/:id', 
  fn: async function(req, res) {
    var tm = await services.tips.update({pgschema: req.TID, id: req.params.id, tip: req.body.tip});

    return tm.toResponse();
  },
  options: {needLogin: false, needCSRF: false}
}));

// payroll
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/payroll/params', 
  fn: async function(req, res) {
    var tm = await services.payroll.getParams({pgschema: req.TID});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/payroll/pastPeriods', 
  fn: async function(req, res) {
    var tm = await services.payroll.getPastPeriods({pgschema: req.TID});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/payroll/run', 
  fn: async function(req, res) {
    var tm = await services.payroll.run({pgschema: req.TID});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'post',
  path: '/timeclock/payroll/confirm', 
  fn: async function(req, res) {
    var rec = {}
    var tm;
    
    rec.user = req.user.code;
    rec.html = req.body.html;
    rec.sdate = new Date(req.body.sdate);
    
    tm = await services.payroll.confirm({pgschema: req.TID, rec});
  
    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

// reports
Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/reports/params', 
  fn: async function(req, res) {
    var tm = await services.payroll.getParams({pgschema: req.TID});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/reports/depts', 
  fn: async function(req, res) {
    var tm = await services.reports.depts({pgschema: req.TID, active: req.query.active});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/reports/emps', 
  fn: async function(req, res) {
    var tm = await services.reports.emps({pgschema: req.TID, active: req.query.active});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/reports/works', 
  fn: async function(req, res) {
    var tm = await services.reports.works({pgschema: req.TID, active: req.query.active});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/reports/pay', 
  fn: async function(req, res) {
    var tm = await services.reports.pay({pgschema: req.TID, active: req.query.active});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/reports/users', 
  fn: async function(req, res) {
    var tm = await services.reports.users({pgschema: req.TID, active: req.query.active});

    return tm.toResponse();
  },
  options: {needLogin: true, needCSRF: false}
}));

Router.add(new RouterMessage({
  method: 'get',
  path: '/timeclock/dymo', 
  fn: async function(req, res) {
    var tm = await services.dymo.getConfig({pgschema: req.TID});

    return tm.toResponse();
  }, 
  options: {needLogin: true, needCSRF: true, redirect: ''}
}));
