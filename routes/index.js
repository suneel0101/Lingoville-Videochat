
/*
 * GET home page.
 */

exports.index = function(req, res){
 console.log(req.user);
  res.render('index', { title: 'Express' })
};

exports.list = function(req, res){
  console.log(req.user);
  res.render('list', { title: 'List of Online Users' })
};