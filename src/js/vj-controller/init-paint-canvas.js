//絵を描く部分
var getTouchMapTransition=require("./get-touch-map-transition");
module.exports=function(_w,_h,_canvas){
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
		oldPos=getTouchMapTransition(e,_canvas);
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
	var pos=getTouchMapTransition(e,_canvas);
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

	// function setEventButtonColor(_id,_c){
	// 	document.getElementById(_id).addEventListener("click",function(){
	// 		_c.strokeStyle=_id;
	// 	},false);
	// }
	// function setEventLineWidth(_id,_c){
	// 	document.getElementById(_id).addEventListener("click",function(){
	// 		var strokewidth;
	// 		switch(_id){
	// 			case "small":
	// 				strokewidth=5;
	// 				break;
	// 			case "middle":
	// 				strokewidth=10;
	// 				break;
	// 			case "large":
	// 				strokewidth=20;
	// 				break;
	// 			default:
	// 				break;
	// 		}
	// 		_c.lineWidth=strokewidth;
	// 	},false);
	// }
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