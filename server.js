var express = require('express')
  , routes = require('./routes')
  , everyauth = require('everyauth')


var app = express.createServer(
	    express.bodyParser()
	  , express.static(__dirname + "/public")
	  , express.favicon()
	  , express.cookieParser()
	  , express.session({ secret: 'secret',key: 'express.sid' })
	);

var configuration=require('./configura');
configuration.start(app,express);

function checkAuth(req,res,next){
	if (req.user){
		console.log('verified that its a logged in user');
		next();
	}
	else {
		console.log('not a verified user');
		res.redirect('/login')
	}
}
// Routes
app.get('/', routes.index);
app.get('/list', checkAuth, routes.list);
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


app.listen(13413);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var sock = require("./socketstuff");
sock.start(app);













