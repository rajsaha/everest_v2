var socket = io();

function recommend_resource(resource) {
    var resource_json = { _id: resource };
    $.post('/recommend', resource_json);
    console.log('recommended ' + resource);
}

function un_recommend_resource(resource) {
    var resource_json = { _id: resource };
    $.post('/not_recommend', resource_json);
    console.log('un_recommended ' + resource);
}

function follow_user(user) {
  var user_resource = {_user: user};
  $.post('follow_user', user_resource);
}

function unfollow_user(user) {
  var user_resource = {_user: user};
  $.post('unfollow_user', user_resource);
}

function add_comment(id) {
	var comment = $("input[name=\""+ id +"\"]").val();
	var comment_json = {_comment: comment, _id: id};
	$("input[name=\""+ id +"\"]").val("");
	console.log('Comment added: ' + comment);
	$.post('/add_comment', comment_json);
}

function load_comments_request(id) {
	var resource_json = {_id: id};
	$("[data-comment='"+ id +"'] i").removeClass("far");
	$("[data-comment='"+ id +"'] i").addClass("fas");
	$("[data-comment='"+ id +"']").attr("onclick","removeComments(\'"+ id +"\')");
	$.post('/get_comments', resource_json);
}

function load_comments(resource) {
	var comments = '';
	console.log(resource);
	console.log(resource[0]._id);
	var time = '';
	for(var i=0; i<resource[0].all_comments.length; i++) {
		time = moment(resource[0].all_comments[i].timestamp).format("MMM DD, YY | h a");
		comments += '<div class="comment">'+
		'<span class="username"><strong>'+ resource[0].all_comments[i].username + ' ' +'</strong></span>'+
		'<span class="comment-content">'+ resource[0].all_comments[i].content +'</span>'+
		'<p class="comment-time">'+ time +'</p>'+
		'</div>';
	}

	var input_box_and_comments='<form class="form-group add-comment-form" onsubmit="add_comment(\''+ resource[0]._id +'\');return false;">'+
									'<input class="form-control" type="text" name="'+ resource[0]._id +'" placeholder="Write a comment..."></input>'+
									'<button type="submit" style="display:none"></button>'+
								'</form>'+
								'<div class="resource-comments '+ resource[0]._id + '">' + comments + '</div>';

	var targetClass = ".comment_box" + resource[0]._id;
	console.log(targetClass);
	$(targetClass).append(input_box_and_comments);
}

function removeComments(id) {
	$("[data-comment='"+ id +"'] i").removeClass("fas");
	$("[data-comment='"+ id +"'] i").addClass("far");
	$("[data-comment='"+ id +"']").attr("onclick","load_comments_request(\'"+ id +"\')");
	$(".comment_box" + id).html("");
}

function getFeed() {
    $.get('/feed-data', (data) => {
        appendResources(data);
    });
}

function getExploreFeed() {
    $.get('/explore-data', (data) => {
        //console.log(data);
        appendResources_explore(data);
    });
}

function search() {
  var search_query = $("#input_search").val().toLowerCase();
  var search_query_object = {_query: search_query};
  $.post('/explore-data', search_query_object);
}

function reloadResource_recommend(resource) {
	$("#" + resource._id + " " + ".recommended-by-count p").text("");
	$("#" + resource._id + " " + ".recommended-by-count p").text(resource.recommended_by_count + " Recommends");
	$("#" + resource._id + " " + ".recommend-button i").removeClass("far");
	$("#" + resource._id + " " + ".recommend-button i").addClass("fas");
	$("#" + resource._id + " " + ".recommend-button").attr("onclick","un_recommend_resource('"+ resource._id +"');return false;");
	console.log(resource);
}

function reloadResource_not_recommend(resource) {
	$("#" + resource._id + " " + ".recommended-by-count p").text("");
	$("#" + resource._id + " " + ".recommended-by-count p").text(resource.recommended_by_count + " Recommends");
	$("#" + resource._id + " " + ".recommend-button i").removeClass("fas");
	$("#" + resource._id + " " + ".recommend-button i").addClass("far");
	$("#" + resource._id + " " + ".recommend-button").attr("onclick","recommend_resource('"+ resource._id +"');return false;");
	console.log(resource);
}

function reloadFollowButton_follow(user) {
  $("#btn_follow_" + user).removeClass("btn-success");
  $("#btn_follow_" + user).addClass("btn-light");
  $("#btn_follow_" + user).attr("onclick", "unfollow_user('"+ user +"')");

  $("#btn_follow_" + user + " i").css("color","rgba(0,0,0,0.54)");
  $("#btn_follow_" + user + " span").css("color","rgba(0,0,0,0.54)");
  $("#btn_follow_" + user + " i").removeClass("fa-user-plus");
  $("#btn_follow_" + user + " i").addClass("fa-user-times");
  $("#btn_follow_" + user + " span").text("Unfollow");
}

function reloadFollowButton_unfollow(user) {
  $("#btn_follow_" + user).removeClass("btn-light");
  $("#btn_follow_" + user).addClass("btn-success");
  $("#btn_follow_" + user + " i").css("color","white");
  $("#btn_follow_" + user + " span").css("color","white");
  $("#btn_follow_" + user + " i").removeClass("fa-user-times");
  $("#btn_follow_" + user + " i").addClass("fa-user-plus");
  $("#btn_follow_" + user + " span").text("Follow");
  $("#btn_follow_" + user).attr("onclick", "follow_user('"+ user +"')");
}

function add_new_collection(resource_id) {
	var label = $("input[name='collection_label_" + resource_id +"']").val();
	var collection_object = {_label: label, _id: resource_id};
	$.post('/add_new_collection', collection_object);
	$('#addToCollection'+resource_id).modal('hide');
}

function addToExisting(resource_id) {
	var selection = $("select[name='collection_select_" + resource_id +"']").val();
	var resource_object = {_title:selection, _id: resource_id};
	$.post('/add_to_existing', resource_object);
	$('#addToCollection'+resource_id).modal('hide');
}

function showErrorDialog(resource_id) {
	$(".error_"+resource_id).append('<div class="alert alert-warning">You\'ve already added that resource to this collection!</div>');
	setTimeout(function() {
		$(".error_"+resource_id).html('');
	}, 3000);
}

function checkIfSuccess(message) {
	if(message === 'success') {
		$('#addToCollection'+resource_id).modal('hide');
	} else {
		showErrorDialog(resource_id);
	}
}

var modal_switch = true;
function switch_modal_form(resource_id) {
	if(modal_switch == true) {
		$("select[name='collection_select_" + resource_id +"']").css('display','none');
		$("input[name='collection_label_" + resource_id +"']").css('display','inherit');
		$(".switch_btn_"+resource_id).text("Choose From Existing Collections");
		$(".save_btn_"+resource_id).attr("onclick", "add_new_collection('" + resource_id + "')");
		modal_switch = false;
	} else {
		$("select[name='collection_select_" + resource_id +"']").css('display','inherit');
		$("input[name='collection_label_" + resource_id +"']").css('display','none');
		$(".switch_btn_"+resource_id).text("Create New Collection");
		$(".save_btn_"+resource_id).attr("onclick", "addToExisting('" + resource_id + "')");
		modal_switch = true;
	}
}

function update_user_details() {
	var user_fullname = $("input[name='user_fullname']").val();
	var user_email = $("input[name='user_email']").val();
	var user_object = {name: user_fullname, email: user_email};
	$.post('/update_user_details', user_object);
}

function showConfirmation(user) {
	$(".error-user-profile").append('<div class="alert alert-info">Record updated</div>');
	setTimeout(function() {
		$(".error-user-profile").html('');
	}, 3000);
}

function load_user_profile(username) {
  console.log('Going to profile: ' + username);
  var user_object = {_username: username};
  $.post('/public_profile', user_object);
}

function search_by_tag(tag) {
  var tag_object = {_tag: tag};
  $.post('/search_by_tag', tag_object);
}

function goto_public_profile() {
  window.location.href = '/public_profile';
}

function goto_search_page() {
  window.location.href = '/search_by_tag';
}

function update_explore_page(output) {
  $("#explore_feed").html("");
  $("#explore_feed").append("<" + output);
}

function show_collection(index, title, user) {
  var collection_object = {_index: index, _title: title, _user:user};
  $.post('/collection', collection_object);
}

function goto_collection() {
  window.location.href = '/collection';
}

function share_resource() {
  var url = $("#url").val();
  var title = $("#title").val();
  var custom_image = $("#image").val();
  var tags = $("#tags").val();
  var description = $("#desc").val();

  var resource_object = {
    _url: url,
    _title: title,
    _custom_image: custom_image,
    _tags: tags,
    _description: description
  };
  $.post('/resource_upload', resource_object);
  $('#resourceShare').modal('toggle');
}

function append_new_resource() {
  console.log('triggered');
  window.location.href = '/feed';
}

function append_new_resource_error(resource) {
  $(".feed-error").css("display","inherit");
  setTimeout(function(){
    $(".feed-error").css('display','none');
  },3000);
}

function goto_feed() {
  window.location.href = '/feed';
}

socket.on('recommend', reloadResource_recommend);
socket.on('not_recommend', reloadResource_not_recommend);
socket.on('added_comment', appendComment);
socket.on('load_comments', load_comments);
socket.on('resource_already_exists', showErrorDialog);
socket.on('resource_addition_successful', checkIfSuccess);
socket.on('updated_name_email', showConfirmation);
socket.on('updated_name', showConfirmation);
socket.on('updated_email', showConfirmation);
socket.on('goto_public_profile', goto_public_profile);
socket.on('user_followed', reloadFollowButton_follow);
socket.on('user_unfollowed', reloadFollowButton_unfollow);
socket.on('search_tag', goto_search_page);
socket.on('update_explore', update_explore_page);
socket.on('goto_collection', goto_collection);
socket.on('added_new_collection', goto_feed);
socket.on('append_new_resource_success', append_new_resource);
socket.on('append_new_resource_error', append_new_resource_error);

function appendComment(resource) {
	var time = moment(resource.timestamp).format("MMM DD, YY | h:m:s");
	var comment = '<div class="comment">'+
	'<span class="username"><strong>'+ resource.username + ' ' +'</strong></span>'+
	'<span class="comment-content">'+ resource.content +'</span>'+
	'<p class="comment-time">'+ time +'</p>'+
	'</div>';
	$("."+ resource.id).append(comment);
	console.log('Added ' + comment);
}

function appendResources(data) {
  $("#feed").append('<'+data);
}

function appendResources_explore(data) {
  $("#explore_feed").append('<'+data);
}

$(document).ready(function() {
    $(() => {
        getFeed();
        getExploreFeed();
    });
});
