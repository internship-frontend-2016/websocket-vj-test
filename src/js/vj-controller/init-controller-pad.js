var getTouchMapTransition=require("./get-touch-map-transition");
module.exports=function(_w,_h,_canvas){
	var socket=io();
	var submitCanvas=document.getElementById("submitCanvas");
	var subc=submitCanvas.getContext("2d");

	//送信する側のキャンバス
	submitCanvas.width=_w;
	submitCanvas.height=_h;
	//画像をサーバーに送信する処理
	var subPos;
	var normalPosX,normalPosY;
	var image;
	var sendingTimer;
	/*-------------画像を送信する--------------*/
	submitCanvas.addEventListener("touchstart",function(e){
		subPos=getTouchMapTransition(e,submitCanvas);
		normalPosX=(subPos.x*2-_w)/_w;
		normalPosY=-((subPos.y*2-_h)/_h);
		image=createbase64(_canvas);
		sendingTimer=setInterval(sentdata,100);
	},false);

	submitCanvas.addEventListener("touchmove",function(e){
		subPos=getTouchMapTransition(e,submitCanvas);
		normalPosX=(subPos.x*2-_w)/_w;
		normalPosY=-((subPos.y*2-_h)/_h);
		image=createbase64(_canvas);
	},false);
	submitCanvas.addEventListener("touchend",function(){
		clearInterval(sendingTimer);
	},false);

	function sentdata(){		
		socket.emit("pushImageFromClient",{
			imgdata:image,
			x:normalPosX,
			y:normalPosY
		});
	}
	function createbase64(_canvas){
		var data=_canvas.toDataURL("image/png");
		var imageContents=document.getElementById("imageContents");
		imageContents.innerHTML="<img src='"+data+"'>";	
		return data;
	}
}