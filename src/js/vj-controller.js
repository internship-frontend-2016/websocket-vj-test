
window.onload=function(){
	var canvas=document.getElementById("myCanvas");
	var w=316;
	var h=316;
	initPaintCanvas(w,h,canvas);
	init();
	initControllerPad(w,h,canvas)
}

//絵を描く部分
function initPaintCanvas(_w,_h,_canvas){
	var c=_canvas.getContext("2d");
	var drawing=false;
	var oldPos;

	_canvas.width=_w;
	_canvas.height=_h;

	c.strokeStyle="black";
	c.lineWidth=5;
	c.lineJoin="round";
	c.lineCap="round";

	//タップ開始時に、絵を描く準備をする
	_canvas.addEventListener("touchstart",function(e){
		drawing=true;
		oldPos=getPosT(e,_canvas);
	},false);

	//タップ終了時に、絵を描く後処理を行う
	_canvas.addEventListener("touched",function(){
		drawing=false
	},false);

	//gestureイベント（2本指以上触ると発生する）
	//終了時にも絵を描く後処理を行う
	_canvas.addEventListener("gestureend",function(){
		drawing=false;
	},false);

	//実際に絵を書く処理
	//前回保存した位置から現在の位置に線を引く
	_canvas.addEventListener("touchmove",function(e){
	var pos = getPosT(e,_canvas);
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

	//削除ボタン
	document.getElementById("delete_button").addEventListener("click",function(){
		c.clearRect(0,0,$(_canvas).width(),$(_canvas).height());		
	},false);

}
//禁止事項など
function init(){
	//ドキュメントのタッチイベントの初期化
	document.addEventListener("touchstart",stopDefault,false);
	document.addEventListener("touchmove",stopDefault,false);
	//document.addEventListener("touchend",stopDefault,false);
	//ドキュメントのジェスチャーイベントの初期化
	document.addEventListener("gesturestart",stopDefault,false);
	document.addEventListener("gesturechange",stopDefault,false);
	//document.addEventListener("gestureend",stopDefault,false);	
}
//送信ボタン
function initControllerPad(_w,_h,_canvas){
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
		subPos=getPosT(e,submitCanvas);
		normalPosX=(subPos.x*2-_w)/_w;
		normalPosY=-((subPos.y*2-_h)/_h);
		image=createbase64(_canvas);
		sendingTimer=setInterval(sentdata,100);
	},false);

	submitCanvas.addEventListener("touchmove",function(e){
		subPos=getPosT(e,submitCanvas);
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
}
function createbase64(_canvas){
	var data=_canvas.toDataURL("image/png");
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
	document.getElementById(_id).addEventListener("click",function(){
		_c.strokeStyle=_id;
	},false);
}

function setEventLineWidth(_id,_c){
	document.getElementById(_id).addEventListener("click",function(){
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
		_c.lineWidth=strokewidth;
	},false);
}

//ブラウザのデフォルト動作を禁止する
function stopDefault(e){
	if(e.touches[0].target.tagName.toLowerCase() == "li"){
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
