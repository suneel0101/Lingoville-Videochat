function start(app){

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
  
  socket.on('set username', function (name) {
    socket.set('username', name, function () { socket.emit('ready'); });
   io.sockets.emit('change in connected clients');
  });

  socket.on('disconnect', function () {
    io.sockets.emit('change in connected clients');
  });
 
socket.on('message', function(msg){
      socket.broadcast.send(msg);
	console.log(msg,'was sent');
  })
socket.on('invitation',function(data){
	console.log('invitation sent to server',data);
	socket.get('username', function(err,usernamus){
		io.sockets.socket(data.invitedid).emit('invite transmission',{inviterid:socket.id,invitername:usernamus});
		socket.emit('server got invite', data.invitedname);
		console.log('server got invite and emitted the server got invite event');
	});

});



socket.on('invitation accepted',function(data){
	console.log('invitation accepted');
	socket.get('username',function(err,usernamus){
		io.sockets.socket(data.inviterid).emit('invite response',{'response':1});
		socket.emit('invitation processed',{'response':1});
		console.log('invite acceptance emitted', data.inviterid);
		console.log('invitees socket id', socket.id);
	});
});

socket.on('invitation denied',function(data){
	console.log('invitation denied');
	socket.get('username',function(err,usernamus){
		io.sockets.socket(data.inviterid).emit('invite response',{'response':0});
		socket.emit('invitation processed',{'response':0});
	});
});


  socket.on('return connected clients',function(){
    var connected = new Array();
    io.sockets.clients().forEach(function(s){
      s.get('username', function(err,name){
		socket.get('username', function(err,usernamus){
			if (usernamus!=name){
			connected.push({'name':name,'id':s.id});
		}
	});
	    
     });
    console.log('connectedarray',connected);	
     socket.emit('returned connected clients', connected);
     });
	
  });
  

});
}
exports.start=start;