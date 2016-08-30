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
		//socket.broadcast.emit("chat message",msg);
	});
	//vj-controller側から受け取ったもの
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
		io.emit("pushImageFromServer",data);
//		io.emit("pushImageFromServer",data.AppearBack);
		//socket.broadcast.emit("chat message",msg);
	});	
	socket.on("disconnect",function(){
		console.log("user disconnected");
	});
});
/*
http.listen(3000, function(){
  console.log('listening on *:3000');
});
*/

http.listen(process.env.PORT || 8000, function(){
 console.log('listening on *:8000');
});