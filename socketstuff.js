function start(app,User, ot){

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
  


  //set username, notify all sockets that there has been a new connection
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

  //returns list of connected clients to all sockets, filtering out the irrelevant clients
  socket.on('return connected clients',function(data){
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
					var studentusers=User.where('status','online').where('username').ne(thisusername).where('languages.learner',langteaching).find(function(err,docs){
						if(!err){
							connected_context['students']=docs;
							console.log('Potential students of',thisusername,'are',docs);
							socket.emit('returned connected clients', connected_context);
					    		}
							});
			    		}
					});		
	});
  });
  //when a socket disconnects, changes the document of the corresponding user to offline and notifies 
 //all sockets that a user has disconnected
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
console.log('Message was received: ',msg);      
socket.broadcast.send(msg);
	console.log(msg,'was sent');
  })

//when an inviter ends the call before the recipient has a chance to deny or accept
//this event is fired and the recipients modal is closed
socket.on('rescindinvite', function(data){
	console.log('INVITE RESCINDED!');
	var recipient=data.invitee;
	User.findOne({'username':recipient},function(err,docs){
		if(!err){
		io.sockets.socket(docs.socketid).emit('invitation rescinded');
		}
	});
	
});

//on call ending, force the non-enders chat to close
socket.on('call ended', function(data){
	socket.broadcast.to(data.room).emit('call ended');
});


//invite sent from a socket
socket.on('sending invitation',function(data){
	console.log('invitation received by server');
	User.findOne({'username':data.recipient,'status':'online'},function(err,docs){
		if (!err){
		socket.get('username', function(err,usernamus){
			io.sockets.socket(docs.socketid).emit('deliver invite',{inviter:usernamus});
			socket.emit('server got invite', data.recipient);
			console.log('DELIVER INVITE event was emitted');
		});	
		}
		else {console.log('there was an error in finding the recipient. either is offline or DNE.');}
	});
	

});

//processes the response to an invite, either deny or accept
socket.on('invitationresponse',function(data){
	console.log('Response to invitation received and response was ',data.response, 'inviter was',data.inviter);
		socket.get('username',function(erra,recipient){
			
		if (!erra){
		User.findOne({'username':data.inviter,'status':'online'},function(err,result){
		if (!err){
			var opentoksession;
			if (data.response=='1'){
				ot.createSession('localhost',{},function(session){
				  opentoksession=session;
				console.log('OPENTOKSESSIONID is ',opentoksession.sessionId);
					var string="convo " + recipient + ", " + data.inviter;
					socket.join(string);
					io.sockets.socket(result.socketid).join(string);
					io.sockets.socket(result.socketid).emit('transmission of invitation response',{'room':string,'recipient':recipient,'response':data.response,'sessionId':opentoksession.sessionId});
					socket.emit('response processed',{'inviter':data.inviter,'response':data.response,'sessionId':opentoksession.sessionId, 'room':string});
					
					
				});
			}
			else{opentoksession=null;
			io.sockets.socket(result.socketid).emit('transmission of invitation response',{'response':data.response});
			socket.emit('response processed',{'response':data.response});
			console.log('Emitted acceptance to both clients!');
			}
		}
		else {console.log('Error retrieving User document when responding to invitation acceptance');}
		});
		}
		else
		{console.log("ERRA");}
	});
});

//sends chat to both members of the chatroom
socket.on('sendchat', function(data){
	socket.get('username', function(err,name){
		var themessage="<div><b>"+name+"</b>:" + data.message+"</div>";
		socket.broadcast.to(data.room).emit('newchat', themessage);
		socket.emit('newchat',themessage);
	});
});




  

});
}
exports.start=start;