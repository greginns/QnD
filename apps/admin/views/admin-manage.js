(function() {
  App.startup.init()
	.then(function(res) {
	  App.wsdc = new App.classes.WSDataComm('admin');
	  App.wsdc.setTables(['admin_tenant','admin_user']);
	  App.wsdc.start();

	  App.router.start('tenants');
	  console.log('started');
	})
	 .catch(function(err) {
	  console.log('Admin');
	  console.log(err);
	});
})();