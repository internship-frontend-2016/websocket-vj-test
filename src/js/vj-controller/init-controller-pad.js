var getTouchMapTransition=require("./get-touch-map-transition");
module.exports=function(_w,_h,_canvas){
	var socket=io();
	var joFrag=false;
	//var c=_canvas.getContext("2d");
	//console.log(c);
	var submitCanvas=document.getElementById("submitCanvas");
	var subc=submitCanvas.getContext("2d");

	//送信する側のキャンバス
	submitCanvas.width=_w;
	submitCanvas.height=_h;

	//中心に四角をえがく
	console.log("aaa");
	subc.fillStyle="red";
	subc.fillRect(118,118,80,80);
	//118~x~198
	var low=(118*2-_w)/_w;
	var hight=(198*2-_w)/_w;
	var middleFrag=false;

	//画像をサーバーに送信する処理
	var subPos;
	var normalPosX,normalPosY;
	var image;
	var sendingTimer;
	/*-------------画像を送信する--------------*/
	submitCanvas.addEventListener("touchstart",function(e){
		subPos=getTouchMapTransition(e,submitCanvas);
		console.log("subPos.x"+subPos.x);
		console.log("subPos.y"+subPos.y);
		if(118<=subPos.x && subPos.x<=198 && 118<=subPos.y && subPos.y<=198){
			middleFrag=true;
		}else{
			middleFrag=false;
		}
		normalPosX=(subPos.x*2-_w)/_w;
		normalPosY=-((subPos.y*2-_h)/_h);
		console.log("normalPosX"+normalPosX);
		console.log("normalPosY"+normalPosY);
		image=createbase64(_canvas);
		sendingTimer=setInterval(sentdata,100);
	},false);

	submitCanvas.addEventListener("touchmove",function(e){
		subPos=getTouchMapTransition(e,submitCanvas);
		if(118<=subPos.x && subPos.x<=198 && 118<=subPos.y && subPos.y<=198){
			middleFrag=true;
		}else{
			middleFrag=false;
		}
		normalPosX=(subPos.x*2-_w)/_w;
		normalPosY=-((subPos.y*2-_h)/_h);
		image=createbase64(_canvas);
	},false);
	submitCanvas.addEventListener("touchend",function(){
		clearInterval(sendingTimer);
	},false);


	//隠しボタン
	//スクリーンがリロードされたらjoさんのフラグがfalseになる
	socket.on("pushJoFragFromServerToController",function(data){
        console.log(data.joFrag);
        joFrag=false;
    });
	document.getElementById("dontTouch_button").addEventListener("click",function(){
		console.log("dontTouch_button_clicked");
		joFrag=true;
		socket.emit("pushJoFragFromClient",{
			joFrag:true
		});
	},false);



	function sentdata(){
		if(!joFrag){
			socket.emit("pushImageFromClient",{
				imgdata:image,
				x:normalPosX,
				y:normalPosY,
				frag:middleFrag
			});
		}else{
			socket.emit("pushImageFromClient",{
				x:normalPosX,
				y:normalPosY,
				frag:middleFrag
			});
		}
	}
	function createbase64(_canvas){
		var data=_canvas.toDataURL("image/png");
		var imageContents=document.getElementById("imageContents");
		imageContents.innerHTML="<img src='"+data+"'>";	
		return data;
	}
}