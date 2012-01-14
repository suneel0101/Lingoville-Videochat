var express = require('express')
  , routes = require('./routes')
  , opentok = require('opentok')
  , OPENTOK_API_KEY = '10652002' // add your API key here
  , OPENTOK_API_SECRET = 'bc20235410ebaef25337206ab60ca296e865c9b6'
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy;

// create a single instance of opentok sdk.
var ot = new opentok.OpenTokSDK(OPENTOK_API_KEY,OPENTOK_API_SECRET)

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId;

var UserSchema = new Schema({
	email: String,
	password:String,
	username: String,
	languages: {
            nativespeaker: String
          , learner: String
        },
	status: String,
	callable: Boolean,
	socketid: String,
}),User;

mongoose.model('User', UserSchema);
mongoose.connect('mongodb://suneel0101:waldstein@staff.mongohq.com:10065/Lingoville');
mongoose.connection.on("open", function(){
  console.log("mongodb is connected!!");
});

User = mongoose.model('User');

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure.  Otherwise, return the authenticated `user`.
      User.findOne({'username':username}, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (user.password != password) { return done(null, false); }
        return done(null, user);
      })
    });
  }
));

var app = express.createServer();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('view options', {layout:false});
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'secret',key:'express.sid' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});



app.get('/', function(req,res) {
  if (!req.user){
  res.render('index');
  }
  else{
	res.redirect('/list')
  }
});

app.get('/list', ensureAuthenticated, function(req,res) {
	res.render('list', { user:req.user });
});

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/list');
  });

app.post('/register',function(req,res) {
	User.findOne({'username':req.body.username}, function(err, user) {
    if (!user) { 
		var instance = new User();
		instance.username=req.body.registerusername;
		instance.password=req.body.registerpassword;
		instance.email=req.body.registeremail;
		instance.languages.learner=req.body.learner;
		instance.languages.nativespeaker=req.body.nativespeaker;
		instance.save(function(err){
			if(err){console.log('Error saving new user');}
			res.redirect('/');
		});
	}
	else{
		console.log('New user successfully created!');
		res.redirect('/');
	}
	
	});
});


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}

app.listen(13413);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var sock = require("./socketstuff");
sock.start(app, User, ot);













