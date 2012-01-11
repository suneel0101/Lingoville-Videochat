function start(app,express){
	app.configure( function () {
		app.set('view engine', 'ejs');
		app.set('views', __dirname + '/views');
		app.set('view options', {layout:false});
		});

	app.configure('development', function(){
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
	});

	app.configure('production', function(){
	  app.use(express.errorHandler()); 
	});	
}
exports.start=start;
