
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
  'suneel0101@gmail.com': addUser({ login: 'suneel0101@gmail.com', password: 'suneel'}),
  'sjchakrav@gmail.com': addUser({login:'sjchakrav@gmail.com',password:'sanjay'})
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


everyauth.helpExpress(app);
// Routes


app.listen(13413);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


io = require('socket.io').listen(app);

var parseCookie = require('connect').utils.parseCookie;
 
io.set('authorization', function (data, accept) {
    // check if there's a cookie header
    if (data.headers.cookie) {
        // if there is, parse the cookie
        data.cookie = parseCookie(data.headers.cookie);
        // note that you will need to use the same key to grad the
        // session id, as you specified in the Express setup.
        data.sessionID = data.cookie['express.sid'];
    } else {
       // if there isn't, turn down the connection with a message
       // and leave the function.
       return accept('No cookie transmitted.', false);
    }
    // accept the incoming connection
    accept(null, true);
});


io.sockets.on('connection', function (socket) {
  console.log('a websocket is connected!');
  console.log(socket.handshake.sessionID);
  
  socket.on('set nickname', function (name) {
    socket.set('nickname', name, function () { socket.emit('ready'); });
  });
  
  socket.on('msg', function () {
    socket.get('nickname', function (err, name) {
      console.log('Chat message by ', name);
    });
  });

  socket.on('return connected clients',function(){
    var connected={}; 
    io.sockets.clients().forEach(function(s){
      s.get('nickname', function(err,name){
	    console.log('upon request, successfully got nickname', name);
	    connected[name]=s.id;
	    console.log(name, s.id);
     });
    console.log('connectedarray',connected);	
   });
  
	
  });

});













