function start(app,User){

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
	User.findOne({'username':name},function(error,doc){
		if(error){console.log('error finding doc when setting name');}
		else{
			doc.status='online';
			doc.socketid=socket.id;
			doc.save(function(err){
				if(err){console.log('error saving the document');}
			});
			io.sockets.emit('change in connected clients');
		}
	});
   
  });

  socket.on('return connected clients',function(data){
	console.log('RETURN CONNECTED CLIENTS EVENT TRIGGERED');
	var langlearning=data.learning;
	var langteaching=data.teaching;
	var connected_context = {}
	var thisusername;
	socket.get('username',function(err,name){
			thisusername=name;
			var tutorusers=User.where('status','online').where('username').ne(thisusername).where('languages.nativespeaker',langlearning).find(function(err,results){
				if(!err){
					connected_context['tutors']=results;
					console.log('Potential tutors of',thisusername, 'are',results);
			    		}
					});
			var studentusers=User.where('status','online').where('username').ne(thisusername).where('languages.learner',langteaching).find(function(err,docs){
				if(!err){
					connected_context['students']=docs;
					console.log('Potential students of',thisusername,'are',docs);
			    		}
					});
			if (connected_context.tutors!=null && connected_context.students!=null){
				socket.emit('returned connected clients', connected_context);
			}
			else{
				console.log('Error, for some reason wasnt able to fetch tutors and students!');
			}
	});

  });

  socket.on('disconnect', function () {
	socket.get('username',function(err,name){
		User.findOne({'username':name},function(error,doc){
		if(error){console.log('when disconnecting couldnot find User document');}
		else{
			doc.status='offline';
			doc.socketid=null;
			doc.save(function(err){
				if(err){console.log('upon disconnect, error saving the document');}		
			});
			io.sockets.emit('change in connected clients');
		}	
		});
	});
    
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



  

});
}
exports.start=start;