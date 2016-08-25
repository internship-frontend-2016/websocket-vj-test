var socket =io();
/*
$("form").submit(function(){
	socket.emit("onVjAction",true);
//			$("#m").val("");
	return false;
});*/
$("#first").on("click",function(){
	socket.emit("vjActionFromClient",1);
	return false
});
$("#second").on("click",function(){
	socket.emit("vjActionFromClient",2);
	return false
});
//サーバーからデータを受け取る
/*
socket.on("vjActionFromClient",function(msg){
//			$('#messages').append($('<li>').text(msg));
	console.log(msg);
});
*/