var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Resource = require('../models/resource');
const urlMetadata = require('url-metadata');
var mid = require('../middleware');

//GET /profile
router.get('/profile', mid.requiresLogin, async (req, res, next) => {
    let body = '';
    let open_tag = 'div class="collections"><div class="card card-container">';
    let close_tag = '</div></div';
    let user = await  User.findOne({ _id: req.session.userId });
    for(let i=0; i<user.all_collections.length;i++) {
         let resource = await Resource.findOne({_id:user.all_collections[i].resources[0]});
         body += open_tag;
         body += '<img class="card-img-top card-collection-img" src="'+
         resource.image +'"></img><div class="card-body card-collection-p"><p class="card-text text-center">' +
         user.all_collections[i].title +
         '</p></div>';
         body += close_tag;
    }
    res.render('profile', {title:'Profile', name: user.name, email:user.email, collections:body})
});

var public_profile_username = '';
//GET /public_profile
router.get('/public_profile', mid.requiresLogin, async (req, res, next) => {
  if(public_profile_username != '') {
    let body = '';
    let open_tag = 'div class="collections"><div class="card card-container">';
    let close_tag = '</div></div';
    let user = await  User.findOne({ username: public_profile_username });
    for(let i=0; i<user.all_collections.length;i++) {
         let resource = await Resource.findOne({_id:user.all_collections[i].resources[0]});
         body += open_tag;
         body += '<img class="card-img-top card-collection-img" src="'+
         resource.image +'"></img><div class="card-body card-collection-p"><p class="card-text text-center">' +
         user.all_collections[i].title +
         '</p></div>';
         body += close_tag;
    }
    res.render('public_profile', {title:'Public Profile', name: req.session.username, public_username: user.username, public_name: user.name, public_email:user.email, collections:body})
  } else {
    res.redirect('/feed');
  }
});

//POST /public_profile
router.post('/public_profile', mid.requiresLogin, async (req, res, next) => {
  if(req.body._username) {
    console.log('Inside function: ' + req.body._username);
    User.findOne({ username: req.body._username })
      .exec(function(error, user) {
        if (error) {
            return next(error);
        } else {
          console.log('Username: ' + user.username);
          req.app.io.emit('goto_public_profile', user);
          public_profile_username = user.username;
          return res.render('public_profile', {title: user.name, name: user.name, email: user.email});
        }
      });
  } else {
      var err = new Error('Something went wrong!' + req.body._username);
      err.status = 400;
      return next(err);
  }
});

//GET /logout
router.get('/logout', function(req, res, next) {
    if (req.session) {
        //delete session object
        req.session.destroy(function(err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});

//GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
    return res.render('login', { title: 'Log In' });
});

//GET /register
router.get('/register', mid.loggedOut, function(req, res, next) {
    return res.render('register', { title: 'Register' });
});

//POST /login
router.post('/login', function(req, res, next) {
    if (req.body.username && req.body.password) {
        User.authenticate(req.body.username, req.body.password, function(error, user) {
            if (error || !user) {
                var err = new Error('Wrong username or password.');
                err.status = 401;
                return next(err);
            } else {
                req.session.userId = user._id;
                req.session.username = user.username;
                //req.app.io.emit('load_feed', 'logged_in');
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
    if (req.body.name &&
        req.body.email &&
        req.body.username &&
        req.body.interests &&
        req.body.password &&
        req.body.confirmPassword) {

        // confirm that user typed same password twice
        if (req.body.password !== req.body.confirmPassword) {
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
            if (error) {
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
    if (req.body.url &&
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
                    if (error) {
                        return next(error);
                    } else {
                        return res.redirect('/feed');
                    }
                });

            },
            function(error) {
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
var sort = { 'timestamp': -1 };
router.get('/feed', mid.requiresLogin, function(req, res, next) {
    var output = '';
    var output_tag = '';
    Resource.find({}).sort(sort)
        .exec(function(error, resource) {
            if (error) {
                return next(error);
            } else {
                resource.forEach((resource) => {
                    //split tags
                    var tags = resource.tags.split(', ');
                    for (var i = 0; i < tags.length; i++) {
                        output_tag += '<button class="btn btn-primary resource-tag" type="button">' + tags[i] + '</button>';
                    }

                    if (resource.recommended_by.includes(req.session.username)) {
                        output += 'div class="resource-card">' +
                            '<div class="card"><div class="user-bar">' +
                            '<span class="float-left"><strong>' + resource.username + '</strong></span>' +
                            '<span class="float-right"><strong>level 1</strong></span></div>' +
                            '<a href="' + resource.url + '"><img class="img-thumbnail card-img w-100 d-block img-thumbnail-override" src="' + resource.image + '"></a>' +
                            '<div class="card-body"><h4 class="card-title">' + resource.title + '</h4><div>' + output_tag + '</div>' +
                            '<p class="card-text">' + resource.description + '</p>' + '<div class="recommended-by-count"><p>' + resource.recommended_by.length +
                            ' Recommends' + '</p></div><div class="resource-actions-container">' +
                            '<form class="form-inline">' + '<input type="hidden" name="_id" value="' + resource._id + '" id="resource_id"></input>' +
                            '<button type="button" class="btn text-uppercase" id="not_recommend" onclick="un_recommend_resource(\'' + resource._id + '\');return false;"><i class="fas fa-thumbs-up"></i>&nbsp; Recommend</button></form><form class="form-inline"><button class="btn text-uppercase float-right">&nbsp;<i class="far fa-comment"></i>&nbsp; comment</button></form></div></div></div></div';
                    } else {
                        output += 'div class="resource-card">' +
                            '<div class="card"><div class="user-bar">' +
                            '<span class="float-left"><strong>' + resource.username + '</strong></span>' +
                            '<span class="float-right"><strong>level 1</strong></span></div>' +
                            '<a href="' + resource.url + '"><img class="img-thumbnail card-img w-100 d-block img-thumbnail-override" src="' + resource.image + '"></a>' +
                            '<div class="card-body"><h4 class="card-title">' + resource.title + '</h4><div>' + output_tag + '</div>' +
                            '<p class="card-text">' + resource.description + '</p>' + '<div class="recommended-by-count"><p>' + resource.recommended_by.length +
                            ' Recommends' + '</p></div><div class="resource-actions-container">' +
                            '<form class="form-inline">' + '<input type="hidden" name="_id" value="' + resource._id + '" id="resource_id"></input>' +
                            '<button type="button" class="btn text-uppercase" id="recommend" onclick="recommend_resource(\'' + resource._id + '\');return false;"><i class="far fa-thumbs-up"></i>&nbsp; Recommend</button></form><form class="form-inline"><button class="btn text-uppercase float-right">&nbsp;<i class="far fa-comment"></i>&nbsp; comment</button></form></div></div></div></div';
                    }

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

//GET /feed-data
router.get('/feed-data', function(req, res, next) {
    var output = '';
    var output_tag = '';
    var output_comments = '';
    var modal = '';
    var collection_names = [];
    var collection_select = '';

    if (req.session.userId) {
        //Get all collection names in resource object
        User.findOne({ _id: req.session.userId })
            .exec(function(error, user) {
                if (error) {
                    return next(error);
                } else {
                    for (var i = 0; i < user.all_collections.length; i++) {
                        collection_select += '<option value="' + user.all_collections[i].title + '">' + user.all_collections[i].title + '</option>';
                    }

                    Resource.find({}).sort(sort)
                        .exec(function(error, resource) {
                            if (error) {
                                return next(error);
                            } else {
                                resource.forEach((resource) => {
                                    //split tags
                                    var tags = resource.tags.split(', ');
                                    var comments = resource.all_comments;

                                    //Get all tags in resource object
                                    for (var i = 0; i < tags.length; i++) {
                                        output_tag += '<button class="btn btn-primary resource-tag" type="button">' + tags[i] + '</button>';
                                    }

                                    //Get all comments in resource object
                                    for (var i = 0; i < comments.length; i++) {
                                        output_comments += '<div class="comment">' +
                                            '<span class="username"><strong>' + comments[i].username + ' ' + '</strong></span>' +
                                            '<span class="comment-content">' + comments[i].content + '</span>' +
                                            '<p class="comment-time">' + comments[i].timestamp + '</p>' +
                                            '</div>';
                                    }

                                    modal = '<div id="addToCollection' + resource._id + '" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="addToCollection" aria-hidden="true">' +
                                        '<div class="modal-dialog" role="document">' +
                                        '<div class="modal-content">' +
                                        '<div class="modal-header">' +
                                        '<h5 class="modal-title">Add to Collection</h5>' +
                                        '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                                        '<span aria-hidden="true">&times;</span>' +
                                        '</button>' +
                                        '</div>' +
                                        '<div class="modal-body">' +
                                        '<div class="text-center">' +
                                        '<div class="error_' + resource._id + '">' +
                                        '</div>' +
                                        '<img src="' + resource.image + '" class="img-fluid"></img>' +
                                        '</div>' +
                                        '<div>' +
                                        '<h4>Choose a Collection</h4>' +
                                        '<form class="form-group">' +
                                        '<input class="form-control collection-inputbox" name="collection_label_' + resource._id + '" placeholder="Create a new collection"></input>' +
                                        '<select class="custom-select collection-dropdown" name="collection_select_' + resource._id + '">' +
                                        collection_select +
                                        '</select>' +
                                        '</form>' +
                                        '</div>' +
                                        '</div>' +
                                        '<div class="modal-footer">' +
                                        '<button type="button" class="btn btn-secondary switch_btn_' + resource._id + '" onclick="switch_modal_form(\'' + resource._id + '\')">Create New Collection</button>' +
                                        '<button type="button" class="btn btn-primary save_btn_' + resource._id + '" onclick="addToExisting(\'' + resource._id + '\')">Save</button>' +
                                        '</div>' +
                                        '</div>' +
                                        '</div>' +
                                        '</div>';

                                    //comment_box goes in the empty space
                                    if (resource.recommended_by.includes(req.session.username)) {
                                        var comment_box =
                                            '<form class="form-group" onsubmit="add_comment(\'' + resource._id + '\');return false;">' +
                                            '<input class="form-control" type="text" name="' + resource._id + '" placeholder="Write a comment..."></input>' +
                                            '<button type="submit" style="display:none"></button>' +
                                            '</form>' +
                                            '<div class="resource-comments ' + resource._id + '">' + output_comments + '</div>';

                                        output += 'div class="resource-card">' +
                                            '<div class="card" id="' + resource._id + '">' +
                                            modal +
                                            '<div class="user-bar">' +
                                            '<span onclick="load_user_profile(\'' + resource.username + '\')" class="float-left"><strong>' + resource.username + '</strong></span></form>' +
                                            '<span class="float-right"><strong>level 1</strong></span>' +
                                            '</div>' +
                                            '<a href="' + resource.url + '"><img class="img-thumbnail card-img w-100 d-block img-thumbnail-override" src="' + resource.image + '"></a>' +
                                            '<div class="card-body"><h4 class="card-title">' + resource.title + '</h4>' +
                                            '<div class="resource-tags-container">' + output_tag + '</div>' +
                                            '<p class="card-text">' + resource.description + '</p>' +
                                            '<div class="recommended-by-count"><p>' + resource.recommended_by_count + ' Recommends' + '</p></div>' +
                                            '<div class="resource-actions-container">' +
                                            '<form class="form-inline">' +
                                            '<input type="hidden" name="_id" value="' + resource._id + '" id="resource_id"></input>' +
                                            '<button type="button" class="btn text-uppercase recommend-button" id="not_recommend" onclick="un_recommend_resource(\'' + resource._id + '\');return false;" style="margin-right: 10px;"><i class="fas fa-thumbs-up"></i>&nbsp; Recommend</button>' +
                                            '</form>' +
                                            '<form class="form-inline">' +
                                            '<button type="button" class="btn text-uppercase" data-comment=\"' + resource._id + '\" onclick="load_comments_request(\'' + resource._id + '\');return false;">&nbsp;<i class="far fa-comment"></i>&nbsp; comment</button>' +
                                            '<button data-toggle="modal" data-target="#addToCollection' + resource._id + '" type="button" class="btn text-uppercase float-right"><i class="fas fa-plus"></i></button>' +
                                            '</form>' +
                                            '<div class="comment-box comment_box' + resource._id + '">' +

                                            '</div>' +
                                            '</div>' +
                                            '</div>' +
                                            '</div>' +
                                            '</div';
                                    } else {
                                        var comment_box = '<div class="comment-box">' +
                                            '<form class="form-group" onsubmit="add_comment(\'' + resource._id + '\');return false;">' +
                                            '<input class="form-control" type="text" name="' + resource._id + '" placeholder="Write a comment..."></input>' +
                                            '<button type="submit" style="display:none"></button>' +
                                            '</form>' +
                                            '</div>' +
                                            '<div class="resource-comments ' + resource._id + '">' +
                                            output_comments +
                                            '</div>';

                                        output += 'div class="resource-card">' +
                                            '<div class="card" id="' + resource._id + '">' +
                                            modal +
                                            '<div class="user-bar">' +
                                            '<span onclick="load_user_profile(\'' + resource.username + '\')" class="float-left"><strong>' + resource.username + '</strong></span>' +
                                            '<span class="float-right"><strong>level 1</strong></span>' +
                                            '</div>' +
                                            '<a href="' + resource.url + '"><img class="img-thumbnail card-img w-100 d-block img-thumbnail-override" src="' + resource.image + '"></a>' +
                                            '<div class="card-body"><h4 class="card-title">' + resource.title + '</h4>' +
                                            '<div class="resource-tags-container">' + output_tag + '</div>' +
                                            '<p class="card-text">' + resource.description + '</p>' +
                                            '<div class="recommended-by-count"><p>' + resource.recommended_by_count + ' Recommends' + '</p></div>' +
                                            '<div class="resource-actions-container">' +
                                            '<form class="form-inline">' +
                                            '<input type="hidden" name="_id" value="' + resource._id + '" id="resource_id"></input>' +
                                            '<button type="button" class="btn text-uppercase recommend-button" id="recommend" onclick="recommend_resource(\'' + resource._id + '\');return false;" style="margin-right: 10px;"><i class="far fa-thumbs-up"></i>&nbsp; Recommend</button>' +
                                            '</form>' +
                                            '<form class="form-inline">' +
                                            '<button type="button" class="btn text-uppercase" data-comment=\"' + resource._id + '\" onclick="load_comments_request(\'' + resource._id + '\');return false;">&nbsp;<i class="far fa-comment"></i>&nbsp; comment</button>' +
                                            '<button data-toggle="modal" data-target="#addToCollection' + resource._id + '" type="button" class="btn text-uppercase float-right"><i class="fas fa-plus"></i></button>' +
                                            '</form>' +
                                            '<div class="comment-box comment_box' + resource._id + '">' +

                                            '</div>' +
                                            '</div>' +
                                            '</div>' +
                                            '</div>' +
                                            '</div';
                                    }

                                    output_tag = '';
                                    output_comments = '';
                                });
                                return res.send(output);
                            }
                        });

                    //console.log(collection_select);
                }
            });
    }
});

//GET /explore
var sort_recommended_by = { 'recommended_by_count': -1 };
router.get('/explore', mid.requiresLogin, function(req, res, next) {
    var output = '';
    var output_tag = '';
    Resource.find({}).sort(sort_recommended_by)
        .exec(function(error, resource) {
            if (error) {
                return next(error);
            } else {
                resource.forEach((resource) => {
                    //split tags
                    var tags = resource.tags.split(', ');
                    for (var i = 0; i < tags.length; i++) {
                        output_tag += '<button class="btn btn-primary resource-tag" type="button">' + tags[i] + '</button>';
                    }

                    if (resource.recommended_by.includes(req.session.username)) {
                        output += 'div class="resource-card">' +
                            '<div class="card"><div class="user-bar">' +
                            '<span class="float-left"><strong>' + resource.username + '</strong></span>' +
                            '<span class="float-right"><strong>level 1</strong></span></div>' +
                            '<a href="' + resource.url + '"><img class="img-thumbnail card-img w-100 d-block img-thumbnail-override" src="' + resource.image + '"></a>' +
                            '<div class="card-body"><h4 class="card-title">' + resource.title + '</h4><div>' + output_tag + '</div>' +
                            '<p class="card-text">' + resource.description + '</p>' + '<div class="recommended-by-count"><p>' + resource.recommended_by.length +
                            ' Recommends' + '</p></div><div class="resource-actions-container">' +
                            '<form method="post" action="/not_recommend" class="form-inline">' + '<input type="hidden" name="_id" value="' + resource._id + '"></input>' +
                            '<button type="submit" class="btn text-uppercase"><i class="fas fa-thumbs-up"></i>&nbsp; Recommend</button></form><form class="form-inline"><button class="btn text-uppercase float-right">&nbsp;<i class="far fa-comment"></i>&nbsp; comment</button></form></div></div></div></div';
                    } else {
                        output += 'div class="resource-card">' +
                            '<div class="card"><div class="user-bar">' +
                            '<span class="float-left"><strong>' + resource.username + '</strong></span>' +
                            '<span class="float-right"><strong>level 1</strong></span></div>' +
                            '<a href="' + resource.url + '"><img class="img-thumbnail card-img w-100 d-block img-thumbnail-override" src="' + resource.image + '"></a>' +
                            '<div class="card-body"><h4 class="card-title">' + resource.title + '</h4><div>' + output_tag + '</div>' +
                            '<p class="card-text">' + resource.description + '</p>' + '<div class="recommended-by-count"><p>' + resource.recommended_by.length +
                            ' Recommends' + '</p></div><div class="resource-actions-container">' +
                            '<form method="post" action="/recommend" class="form-inline">' + '<input type="hidden" name="_id" value="' + resource._id + '"></input>' +
                            '<button type="submit" class="btn text-uppercase"><i class="far fa-thumbs-up"></i>&nbsp; Recommend</button></form><form class="form-inline"><button class="btn text-uppercase float-right">&nbsp;<i class="far fa-comment"></i>&nbsp; comment</button></form></div></div></div></div';
                    }

                    output_tag = '';
                });
                return res.render('explore', {
                    title: 'Resource Explore',
                    name: req.session.username,
                    all_resources: output
                });
            }
        });
});

//POST /recommend
router.post('/recommend', function(req, res, next) {
    if (req.body._id) {
        Resource.findOneAndUpdate({ _id: req.body._id }, { $push: { recommended_by: req.session.username }, $inc: { recommended_by_count: 1 } })
            .exec(function(error, resource) {
                if (error) {
                    return next(error);
                } else {
                    req.app.io.emit('recommend', resource);
                    return res.redirect('/feed');
                }
            });
    } else {
        var err = new Error('Something went wrong!' + req.body._id);
        err.status = 400;
        return next(err);
    }
});

//POST /not_recommend
router.post('/not_recommend', function(req, res, next) {
    if (req.body._id) {
        Resource.findOneAndUpdate({ _id: req.body._id }, { $pop: { recommended_by: req.session.username }, $inc: { recommended_by_count: -1 } })
            .exec(function(error, resource) {
                if (error) {
                    return next(error);
                } else {
                    req.app.io.emit('not_recommend', resource);
                    return res.redirect('/feed');
                }
            });
    } else {
        var err = new Error('Something went wrong!' + req.body._id);
        err.status = 400;
        return next(err);
    }
});

//POST /add_comment
router.post('/add_comment', function(req, res, next) {
    if (req.body._comment && req.body._id) {

        var time = new Date();

        var comment = {
            username: req.session.username,
            content: req.body._comment,
            timestamp: time
        }

        var send_back_comment = {
            username: req.session.username,
            content: req.body._comment,
            timestamp: time,
            id: req.body._id
        }

        console.log(comment);

        Resource.findOneAndUpdate({ _id: req.body._id }, { $push: { all_comments: comment } })
            .exec(function(error, resource) {
                if (error) {
                    return next(error);
                } else {
                    console.log(resource);
                    req.app.io.emit('added_comment', send_back_comment);
                    return res.redirect('/feed');
                }
            });
    } else {
        var err = new Error('Something went wrong!' + req.body._id);
        err.status = 400;
        return next(err);
    }
});

//POST /add_new_collection
router.post('/add_new_collection', function(req, res, next) {
    if (req.body._label && req.body._id) {
        console.log(req.body._label + ' ' + req.body._id);
        var collection_label = { title: req.body._label }
        var collection_label_resource = { resources: req.body._id }
        var resources_array = [req.body._id];

        var collection_object = { title: req.body._label, resources: req.body._id }
        User.findOneAndUpdate({ _id: req.session.userId }, { $push: { all_collections: collection_object } })
            .exec(function(error, user) {
                if (error) {
                    return next(error);
                } else {
                    console.log('Step 1 Done');
                    return res.redirect('/feed');
                }
            });
    }
});

//POST /update_user_details
router.post('/update_user_details', function(req, res, next) {
    if (req.body.name != '' && req.body.email != '') {
        User.findOneAndUpdate({ _id: req.session.userId }, { name: req.body.name, email: req.body.email })
            .exec(function(error, user) {
                if (error) {
                    return next(error);
                } else {
                    req.app.io.emit('updated_name_email', user);
                }
            });
    } else if (req.body.name != '') {
        User.findOneAndUpdate({ _id: req.session.userId }, { name: req.body.name })
            .exec(function(error, user) {
                if (error) {
                    return next(error);
                } else {
                    req.app.io.emit('updated_name', user);
                }
            });

    } else if (req.body.email != '') {
        User.findOneAndUpdate({ _id: req.session.userId }, { email: req.body.email })
            .exec(function(error, user) {
                if (error) {
                    return next(error);
                } else {
                    req.app.io.emit('updated_email', user);
                }
            });

    }
});

//POST /add_resource_to_existing_collection
router.post('/add_to_existing', function(req, res, next) {
    if (req.body._id && req.body._title) {
        User.findOne({ _id: req.session.userId })
            .exec(function(error, user) {
                if (error) {
                    return next(error);
                } else {
                    for (var i = 0; i < user.all_collections.length; i++) {
                        if (user.all_collections[i].title === req.body._title) {
                            for (var j = 0; j < user.all_collections[i].resources.length; j++) {
                                console.log(user.all_collections[i].resources[j]);
                                if (user.all_collections[i].resources[j] === req.body._id) {
                                    req.app.io.emit('resource_already_exists', req.body._id);
                                    return;
                                }
                            }

                            user.all_collections[i].resources.push(req.body._id);
                            user.save(function(err) {
                                err != null ? console.log(err) : console.log('Data updated');
                                req.app.io.emit('resource_addition_successful', 'success');
                            });
                        }
                    }
                }
            });
    }
});

//GET /get_comments
router.post('/get_comments', function(req, res, next) {
    if (req.body._id) {
        Resource.find({ _id: req.body._id })
            .exec(function(error, resource) {
                if (error) {
                    return next(error);
                } else {
                    req.app.io.emit('load_comments', resource);
                    return res.redirect('/feed');
                }
            });
    }
});

// GET /about
router.get('/about', function(req, res, next) {
    return res.render('about', { title: 'About' });
});

// GET /contact
router.get('/contact', function(req, res, next) {
    return res.render('contact', { title: 'Contact' });
});

//module.exports = router;
module.exports = function(io) {
    //Socket.io
    io.on('connection', function(socket) {
        console.log('User has connected to Index');
        socket.on('/', function() {
            console.log('Application Running');
        });
    });

    return router;
}
