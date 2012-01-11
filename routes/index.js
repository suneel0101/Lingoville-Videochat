
/*
 * GET home page.
 */

exports.index = function(req, res){
 console.log(req.user);
  if (!req.user){
  res.redirect('/login');
  }
  else{
	res.redirect('/list')
  }
};

exports.list = function(req, res){
  console.log(req.user);
  res.render('list', { title: 'List of Online Users' })
};