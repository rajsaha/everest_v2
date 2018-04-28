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

function getFeed() {
    $.get('/feed-data', (data) => {
        appendResources(data);
    });
}

function reloadResource_recommend(resource) {
	$("#" + resource._id + " " + ".recommended-by-count p").text(resource.recommended_by_count + " Recommends");
	$("#" + resource._id + " " + ".recommend-button i").removeClass("far");
	$("#" + resource._id + " " + ".recommend-button i").addClass("fas");
	$("#" + resource._id + " " + ".recommend-button").attr("onclick","un_recommend_resource('"+ resource._id +"');return false;");
	console.log(resource);
}

function reloadResource_not_recommend(resource) {
	$("#" + resource._id + " " + ".recommended-by-count p").text(resource.recommended_by_count + " Recommends");
	$("#" + resource._id + " " + ".recommend-button i").removeClass("fas");
	$("#" + resource._id + " " + ".recommend-button i").addClass("far");
	$("#" + resource._id + " " + ".recommend-button").attr("onclick","recommend_resource('"+ resource._id +"');return false;");
	console.log(resource);
}

socket.on('recommend', reloadResource_recommend);
socket.on('not_recommend', reloadResource_not_recommend);
socket.on('added_comment', appendComment);

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
