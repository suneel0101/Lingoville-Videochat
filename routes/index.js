exports.index = function(req, res){
 console.log(req.user);
  if (!req.user){
  res.render('index')
  }
  else{
	res.redirect('/list')
  }
};

exports.list = function(req, res){
  console.log(req.user);
  res.render('list', { title: 'List of Online Users' })
};