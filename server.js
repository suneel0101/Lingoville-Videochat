
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , everyauth = require('everyauth')



// Configuration
everyauth.debug = true;

var usersById = {};
var nextUserId = 0;

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}

var usersByLogin = {
  'brian@example.com': addUser({ login: 'brian@example.com', password: 'password'})
};

everyauth
  .password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('index.ejs')
//    .loginLocals({
//      title: 'Login'
//    })
//    .loginLocals(function (req, res) {
//      return {
//        title: 'Login'
//      }
//    })
    .loginLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'Async login'
        });
      }, 200);
    })
    .authenticate( function (login, password) {
      var errors = [];
      if (!login) errors.push('Missing login');
      if (!password) errors.push('Missing password');
      if (errors.length) return errors;
      var user = usersByLogin[login];
      if (!user) return ['Login failed'];
      if (user.password !== password) return ['Login failed'];
      return user;
    })

    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.jade')
//    .registerLocals({
//      title: 'Register'
//    })
//    .registerLocals(function (req, res) {
//      return {
//        title: 'Sync Register'
//      }
//    })
    .registerLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'Async Register'
        });
      }, 200);
    })
    .validateRegistration( function (newUserAttrs, errors) {
      var login = newUserAttrs.login;
      if (usersByLogin[login]) errors.push('Login already taken');
      return errors;
    })
    .registerUser( function (newUserAttrs) {
      var login = newUserAttrs[this.loginKey()];
      return usersByLogin[login] = addUser(newUserAttrs);
    })

    .loginSuccessRedirect('/list')
    .registerSuccessRedirect('/');

everyauth.everymodule
	 .findUserById( function (id, callback) {
	  callback(null, usersById[id]);
	 });


var app = express.createServer(
	    express.bodyParser()
	  , express.static(__dirname + "/public")
	  , express.favicon()
	  , express.cookieParser()
	  , express.session({ secret: 'secret',key: 'express.sid' })
	  , everyauth.middleware()
	);

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
everyauth.helpExpress(app);
// Routes

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

app.get('/', routes.index);

app.get('/list', checkAuth, routes.list);

app.listen(13413);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);








