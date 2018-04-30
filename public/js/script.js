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

socket.on('recommend', reloadResource_recommend);
socket.on('not_recommend', reloadResource_not_recommend);
socket.on('added_comment', appendComment);
socket.on('load_comments', load_comments);
socket.on('resource_already_exists', showErrorDialog);
socket.on('resource_addition_successful', checkIfSuccess);
socket.on('updated_name_email', showConfirmation);
socket.on('updated_name', showConfirmation);
socket.on('updated_email', showConfirmation);
//socket.on('load_feed', getFeed);

function test(){
  console.log('socket io test');
}

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

$(document).ready(function() {
    $(() => {
        getFeed();
    });
});
