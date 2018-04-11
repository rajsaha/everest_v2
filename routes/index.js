var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Resource = require('../models/resource');
const urlMetadata = require('url-metadata');
var mid = require('../middleware');

//GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next) {
	User.findById(req.session.userId)
		.exec(function (error, user) {
			if(error) {
				return next(error);
			} else {
				return res.render('profile', {
					title: 'Profile',
					name: user.name,
					email: user.email,
					collection: user.all_collections,
					followers: user.followers
				});
			}
		});
});

//GET /logout
router.get('/logout', function(req, res, next) {
	if(req.session) {
		//delete session object
		req.session.destroy(function(err) {
			if(err) {
				return next(err);
			} else {
				return res.redirect('/');
			}
		});
	}
});

//GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
	return res.render('login', {title: 'Log In'});
});

//GET /register
router.get('/register', mid.loggedOut, function(req, res, next) {
  return res.render('register', { title: 'Register' });
});

//POST /login
router.post('/login', function(req, res, next) {
	if(req.body.username && req.body.password) {
		User.authenticate(req.body.username, req.body.password, function(error, user) {
			if( error || !user ) {
				var err = new Error('Wrong username or password.');
				err.status = 401;
				return next(err);
			} else {
				req.session.userId = user._id;
				req.session.username = user.username;
				return res.redirect('/feed');
			}
		});
	} else {
		var err = new Error('Username and password are required.');
		err.status = 401;
		return next(err);
	}
});

// POST /register
router.post('/register', function(req, res, next) {
  if(req.body.name &&
  	req.body.email &&
  	req.body.username &&
  	req.body.interests &&
  	req.body.password &&
  	req.body.confirmPassword) {

  		// confirm that user typed same password twice
  		if(req.body.password !== req.body.confirmPassword) {
  			var err = new Error('Passwords do not match.');
  			err.status = 400;
  			return next(err);
  		}

  		// create object with form input
  		var userData = {
  			email: req.body.email,
  			name: req.body.name,
  			username: req.body.username,
  			interests: req.body.interests,
  			password: req.body.password
  		};

  		// insert document into model
  		User.create(userData, function(error, user) {
  			if(error) {
  				return next(error);
  			} else {
  				req.session.userId = user._id;
  				req.session.username = user.username;
  				return res.redirect('/feed');
  			}
  		});
  } else {
  	var err = new Error('All fields required.');
  	err.status = 400;
  	return next(err);
  }
});

//POST /resource_upload
router.post('/resource_upload', function(req, res, next) {
	if(req.body.url &&
		req.body.title &&
		req.body.tags &&
		req.body.desc) {

		//Get site image url
		urlMetadata(req.body.url).then(
				function(metadata) {
					var image_url = metadata.image;

					//create object with form input
					var resourceData = {
						username: req.session.username,
						url: req.body.url,
						title: req.body.title,
						tags: req.body.tags,
						description: req.body.desc,
						image: image_url
					};

					//insert document into model
					Resource.create(resourceData, function(error, user) {
						if(error) {
							return next(error);
						} else {
							return res.redirect('/feed');
						}
					});

				},function (error) {
					return next(error);
				}
			);

	} else {
		var err = new Error('All fields required.');
		err.status = 400;
		return next(err);
	}
});

// GET /
router.get('/', function(req, res, next) {
  return res.render('index', { title: 'Home', name: req.session.username });
});

//GET /feed
var sort = {'timestamp': -1};
router.get('/feed', mid.requiresLogin, function(req, res, next) {
  var output = '';
  var output_tag = '';
  Resource.find({}).sort(sort)
		.exec(function (error, resource) {
			if(error) {
				return next(error);
			} else {
				resource.forEach((resource) => {
					//split tags
					var tags = resource.tags.split(', ');
					for(var i = 0; i<tags.length; i++) {
						output_tag += '<button class="btn btn-primary resource-tag" type="button">'+ tags[i] +'</button>';
					}

					output += 'div class="resource-card"><div class="card"><div class="user-bar"><span class="float-left"><strong>'+ resource.username +'</strong></span><span class="float-right"><strong>level 1</strong></span></div><a href="'+ resource.url +'"><img class="img-thumbnail card-img w-100 d-block img-thumbnail-override" src="'+ resource.image +'"></a><div class="card-body"><h4 class="card-title">'+ resource.title +'</h4><div>'+ output_tag +'</div><p class="card-text" style="margin-bottom:50px;">'+ resource.description +'</p><div class="resource-actions-container"><span class="text-uppercase"><i class="fa fa-thumbs-o-up"></i>&nbsp; Recommend</span><span class="text-uppercase float-right">&nbsp;<i class="fa fa-comment-o"></i>&nbsp; comment</span></div></div></div></div';

					output_tag = '';
				});
				return res.render('feed', {
					title: 'Resource Feed',
					name: req.session.username,
					all_resources: output
				});
			}
		});
});

// GET /about
router.get('/about', function(req, res, next) {
  return res.render('about', { title: 'About' });
});

// GET /contact
router.get('/contact', function(req, res, next) {
  return res.render('contact', { title: 'Contact' });
});

module.exports = router;