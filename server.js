var express = require('express')
  , routes = require('./routes')
  , everyauth = require('everyauth')
  , Promise = everyauth.Promise;

// Configuration
 
everyauth.debug = true;

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId;

var UserSchema = new Schema({
	status: String,
	callable: Boolean,
	socketid: String,
}),
   User;

var mongooseAuth = require('mongoose-auth');

UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , password: {
        loginWith: 'email'
      , extraParams: {
            username: String
          , languages: {
                nativespeaker: String
              , learner: String
            }
        }
      , everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'index.ejs'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'register.ejs'
          , loginSuccessRedirect: '/list'
          , registerSuccessRedirect: '/list'
        }
    }
});
// Adds login: String

mongoose.model('User', UserSchema);
mongoose.connect('mongodb://suneel0101:waldstein@staff.mongohq.com:10065/Lingoville');
mongoose.connection.on("open", function(){
  console.log("mongodb is connected!!");
});

User = mongoose.model('User');

var app = express.createServer(
	    express.bodyParser()
	  , express.static(__dirname + "/public")
	  , express.favicon()
	  , express.cookieParser()
	  , express.session({ secret: 'secret',key: 'express.sid' })
	  , mongooseAuth.middleware()
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

mongooseAuth.helpExpress(app);

app.listen(13413);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var sock = require("./socketstuff");
sock.start(app, User);













