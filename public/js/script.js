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
	for(var i=0; i<resource[0].all_comments.length; i++) {
		comments += '<div class="comment">'+
		'<span class="username"><strong>'+ resource[0].all_comments[i].username + ' ' +'</strong></span>'+
		'<span class="comment-content">'+ resource[0].all_comments[i].content +'</span>'+
		'<p class="comment-time">'+ resource[0].all_comments[i].timestamp +'</p>'+
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

socket.on('recommend', reloadResource_recommend);
socket.on('not_recommend', reloadResource_not_recommend);
socket.on('added_comment', appendComment);
socket.on('load_comments', load_comments);

function test(){
  console.log('socket io test');
}

function appendComment(resource) {
	var comment = '<div class="comment">'+
	'<span class="username"><strong>'+ resource.username + ' ' +'</strong></span>'+
	'<span class="comment-content">'+ resource.content +'</span>'+
	'<p class="comment-time">'+ resource.timestamp +'</p>'+
	'</div>';
	$("."+ resource.id).append(comment);
	console.log('Added ' + comment);
}

function appendResources(data) {
  $("#feed").append('<'+data);
}

$(document).ready(function() {
    $(() => {
        getFeed();
    });

});
