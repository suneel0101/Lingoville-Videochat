var socket = io.connect();
socket.on('message', function(msg){
    console.log(msg);
});

  socket.on('connect', function () {
    	socket.emit('set nickname',  '<%= everyauth.user.login %>');
		socket.on('change in connected clients', function(){
	   			socket.emit('return connected clients');
	   			socket.on('returned connected clients', function(data){
		 				console.log('received emission of returned connected clients'); 
		 				var html="<ul style='list-style:none'>";
		  				for (var index in data){
			
		  	 				html+="<li>"+ "<a onclick='socket.emit(&#39;invitation&#39;,{&#39;invitedid&#39;:&#39;"+data[index].id +"&#39;,&#39;invitedname&#39;:&#39;"+data[index].name+"&#39;})' href='#' class='user' name='"+data[index].name+ "' id='"+data[index].id+"'>"+data[index].name+"</a>"+"</li>";
		  					}
		  				html+="</ul";
		  				console.log(html);
		  				document.getElementById('list').innerHTML = html;

				});	


		});

	 socket.on('invite transmission', function(data){
		var inviterid=data.inviterid;
		var invitername=data.invitername;
		$('#invite').html('You have an invite from'+invitername);
		var accepthtml="<a onclick='socket.emit(&#39;invitation accepted&#39;,{&#39;inviterid&#39;:&#39;"+inviterid +"&#39})' href='#'>Accept</a></li>";
		var denyhtml="<a onclick='socket.emit(&#39;invitation denied&#39;,{&#39;inviterid&#39;:&#39;"+inviterid +"&#39})' href='#'>Deny</a></li>";
		var responsehtml=accepthtml+denyhtml;
		$('#actions').html(responsehtml);		
	}) ;
	socket.on('invitation processed',function(data){
		$('#invite').html('');
		$('#actions').html('');
		if (data.response==1){
		$('#notifications').html('Connecting now...');
		}
		else {
		$('notifications').html('');
		}
	});
		
	
	socket.on('invite response',function(data){
		console.log('Inviters server got the invitees response');
		if (data.response==1){
			$('#notifications').html('Invite accepted! Connecting now...');
			}
		else {
			$('#notifications').html('Invite denied...');
			}
	});
	socket.on('server got invite',function(inviteename){
		    console.log('received server acknowledgement of invite');
			var message='Waiting for response from ' + inviteename +'...';
			$('#notifications').html(message);
		});
	socket.on('transmission of invite response', function(data){
		console.log('response was',data);
	});
});
