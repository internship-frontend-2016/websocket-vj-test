var canvas;
var submitCanvas;
window.onload=function(){
	var socket=io();
	canvas=document.getElementById("myCanvas");
	submitCanvas=document.getElementById("submitCanvas");
	var subc=submitCanvas.getContext("2d");
	var c=canvas.getContext("2d");

	var w=316;
	var h=316;
	var drawing=false;
	var oldPos;

	canvas.width=w;
	canvas.height=h;

	//送信する側のキャンバス
	submitCanvas.width=w;
	submitCanvas.height=h;

	c.strokeStyle="black";
	c.lineWidth=5;
	c.lineJoin="round";
	c.lineCap="round";

	//タップ開始時に、絵を描く準備をする
	canvas.addEventListener("touchstart",function(e){
		drawing=true;
		oldPos=getPosT(e,canvas);
	},false);

	//タップ終了時に、絵を描く後処理を行う
	canvas.addEventListener("touched",function(){
		drawing=false
	},false);

	//gestureイベント（2本指以上触ると発生する）
	//終了時にも絵を描く後処理を行う
	canvas.addEventListener("gestureend",function(){
		console.log("mouseout");
		drawing=false;
	},false);

	//実際に絵を書く処理
	//前回保存した位置から現在の位置に線を引く
	canvas.addEventListener("touchmove",function(e){
	var pos = getPosT(e,canvas);
		if(drawing){
			c.beginPath();
			c.moveTo(oldPos.x,oldPos.y);
			c.lineTo(pos.x,pos.y);
			c.stroke();
			c.closePath();
			oldPos=pos;
		}
	},false);
	//色と線の太さを設定する
	setEventButtonColor("black",c);
	setEventButtonColor("blue",c);
	setEventButtonColor("red",c);
	setEventButtonColor("green",c);

	setEventLineWidth("small",c);
	setEventLineWidth("middle",c);
	setEventLineWidth("large",c);

	document.getElementById("delete_button").addEventListener("click",function(){
		c.clearRect(0,0,$(canvas).width(),$(canvas).height());		
	},false);

	//ドキュメントのタッチイベントの初期化
	document.addEventListener("touchstart",stopDefault,false);
	document.addEventListener("touchmove",stopDefault,false);
	//document.addEventListener("touchend",stopDefault,false);
	//ドキュメントのジェスチャーイベントの初期化
	document.addEventListener("gesturestart",stopDefault,false);
	document.addEventListener("gesturechange",stopDefault,false);
	//document.addEventListener("gestureend",stopDefault,false);



	//画像をサーバーに送信する処理
	//var toImage=document.getElementById("toImage_AppearBack");
	document.getElementById("toImage_AppearBack").addEventListener("click",function(){
		var image=createbase64();
		console.log(image);
		socket.emit("pushImageFromClient",{
			imgdata:image,
			AppearBack:true
		});
	},false);
	document.getElementById("toImage_DropFromUp").addEventListener("click",function(){
		var image=createbase64();
		console.log(image);
		socket.emit("pushImageFromClient",{
			imgdata:image,
			DropFromUp:true
		});
	},false);

	var subPos;
	var normalPosX,normalPosY;
	var image;
	var sentFlag;
	var sendingTimer;
	/*-------------画像を送信する--------------*/

	submitCanvas.addEventListener("touchstart",function(e){
		sentFlag=true;
		subPos=getPosT(e,submitCanvas);
		normalPosX=(subPos.x*2-w)/w;
		normalPosY=-((subPos.y*2-h)/h);
		image=createbase64();
	sendingTimer=setInterval(sentdata,100);
	},false);

	submitCanvas.addEventListener("touchmove",function(e){
		//sentFlag=true;
		subPos=getPosT(e,submitCanvas);
		normalPosX=(subPos.x*2-w)/w;
		normalPosY=-((subPos.y*2-h)/h);
		image=createbase64();
	},false);
	submitCanvas.addEventListener("touchend",function(){
		sentFlag=false;
		console.log("touchend");
		clearInterval(sendingTimer);
	},false);

	function sentdata(){
		console.log("sentdata_function");
		
		socket.emit("pushImageFromClient",{
			imgdata:image,
			x:normalPosX,
			y:normalPosY
		});
				
	}

}
function createbase64(){
	var data=canvas.toDataURL("image/png");
	var imageContents=document.getElementById("imageContents");
	imageContents.innerHTML="<img src='"+data+"'>";	
	return data;
}
//タップ関連関数
function scrollX(){return document.documentElement.scrollLeft||document.body.scrollLeft;}
function scrollY(){return document.documentElement.scrollTop||document.body.scrollTop;}
function getPosT(_e,_canvas){
	var mouseX=_e.touches[0].clientX-$(_canvas).position().left+scrollX();
	var mouseY=_e.touches[0].clientY-$(_canvas).position().top+scrollY();
	return {x:mouseX,y:mouseY};
}
function setEventButtonColor(_id,_c){
	console.log(_id);
	document.getElementById(_id).addEventListener("click",function(){
		console.log(_id);
		_c.strokeStyle=_id;
	},false);
}

function setEventLineWidth(_id,_c){
	document.getElementById(_id).addEventListener("click",function(){
		console.log(_id+"_click");
		var strokewidth;
		switch(_id){
			case "small":
				strokewidth=5;
				break;
			case "middle":
				strokewidth=10;
				break;
			case "large":
				strokewidth=20;
				break;
			default:
				break;
		}
		console.log(strokewidth);
		_c.lineWidth=strokewidth;
	},false);
}

//ブラウザのデフォルト動作を禁止する
function stopDefault(e){
	if(e.touches[0].target.tagName.toLowerCase() == "li"){
		//console.log(e.touches[0].target.tagName.toLowerCase());
		return;
	}
	if(e.touches[0].target.tagName.toLowerCase()=="div"){
		return;
	}
	if(e.touches[0].target.tagName.toLowerCase()=="input"){
		return;
	}
	e.preventDefault();
}
