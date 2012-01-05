
/*
 * GET home page.
 */

exports.list = function(req, res){
  res.render('list', { title: 'List of Online Users' })
};