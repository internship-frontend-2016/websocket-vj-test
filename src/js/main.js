var socket =io();
/*
$("form").submit(function(){
	socket.emit("onVjAction",true);
//			$("#m").val("");
	return false;
});*/
$("#hello").on("click",function(){
	socket.emit("onVjAction","hello");
	return false
});
$("#bye").on("click",function(){
	socket.emit("onVjAction","bye");
	return false
});
socket.on("onVjAction",function(msg){
//			$('#messages').append($('<li>').text(msg));
	console.log(msg);
});