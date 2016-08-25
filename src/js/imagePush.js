var socket =io();
//サーバーからデータを受け取る
socket.on("pushImageFromServer",function(data){
	var image = document.getElementById("image");
	console.log(data);
	image.src=data;
});