var express = require('express');
var app=express();
var http = require('http').Server(app);
var io=require("socket.io")(http);
app.use(express.static('build'));
/*
express.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');
});*/
io.on("connection",function(socket){
	console.log("a user connected");
	socket.on("chat message",function(msg){
		console.log("message::"+msg);
		io.emit("chat message",msg);
	});
	//samplevj-controller側から受け取ったもの
	socket.on("vjActionFromClient",function(data){
		console.log("vjActionFromClient::"+data);
		io.emit("vjActionFromServer",data);
		//socket.broadcast.emit("chat message",msg);
	});

	//smartphonePaintAppから送られてきた
	socket.on("pushImageFromClient",function(data){
		console.log("pushImageFromClient::"+data.imgdata);
		console.log("pushImageFromClient::"+data.x);
		console.log("pushImageFromClient::"+data.y);
		console.log("pushImageFromClient::"+data.frag);
		io.emit("pushImageFromServer",data);
	});	

	socket.on("pushJoFragFromClient",function(data){
		console.log("pushJoFragFromClient::"+data.joFrag);
		io.emit("pushJoFragFromServer",data);
	});

	//スクリーンから送られてきた
	socket.on("pushJoFragFromScreen",function(data){
		console.log("pushJoFragFromScreen::"+data.joFrag);
		io.emit("pushJoFragFromServerToController",data);
		//io.emit("pushJoFragFromServer",data);
	});	

	socket.on("disconnect",function(){
		console.log("user disconnected");
	});
});

http.listen(process.env.PORT || 8000, function(){
 console.log('listening on *:8000');
});