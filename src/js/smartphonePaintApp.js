onload=function(){
	var socket=io();
	var canvas=document.getElementById("myCanvas");
	var c=canvas.getContext("2d");
	var w=640;
	var h=640;
	var drawing=false;
	var oldPos;

	canvas.width=w;
	canvas.height=h;

	//背景は白になる
	c.fillStyle="rgb(255,255,255)";
	c.fillRect(0,0,$(canvas).width(),$(canvas).height());

	c.strokeStyle="#000000";
	c.lineWidth=5;
	c.lineJoin="round";
	c.lineCap="round";

	//タップ開始時に、絵を描く準備をする
	canvas.addEventListener("touchstart",function(e){
		drawing=true;
		oldPos=getPosT(e);
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
	var pos = getPosT(e);
		if(drawing){
			c.beginPath();
			c.moveTo(oldPos.x,oldPos.y);
			c.lineTo(pos.x,pos.y);
			c.stroke();
			c.closePath();
			oldPos=pos;
		}
	},false);

	//タップ関連関数
	function scrollX(){return document.documentElement.scrollLeft||document.body.scrollLeft;}
	function scrollY(){return document.documentElement.scrollTop||document.body.scrollTop;}
	function getPosT(_e){
		var mouseX=_e.touches[0].clientX-$(canvas).position().left+scrollX();
		var mouseY=_e.touches[0].clientY-$(canvas).position().top+scrollY();
		return {x:mouseX,y:mouseY};
	}

	//色と線の太さを設定する関数
	$("#black").on("click",function(){
		c.strokeStyle="black";		
	});
	$("#blue").on("click",function(){
		c.strokeStyle="blue";		
	});
	$("#red").on("click",function(){
		c.strokeStyle="red";		
	});
	$("#green").on("click",function(){
		c.strokeStyle="green";		
	});
	$("#small").on("click",function(){
		c.lineWidth=5;		
	});
	$("#middle").on("click",function(){
		c.lineWidth=10;		
	});
	$("#large").on("click",function(){
		c.lineWidth=20;		
	});

	$("#delete_button").on("click",function(){
		//背景は白になる
		c.fillStyle="rgb(255,255,255)";
		c.fillRect(0,0,$(canvas).width(),$(canvas).height());
		//c.clearRect(0,0,$(canvas).width(),$(canvas).height());
	});


	//ブラウザのデフォルト動作を禁止する

	function stopDefault(e){
		//if(e.touches[0].target.tagName.toLowerCase()=="li"){
			console.log(e.touches[0].target);
		if(e.touches[0].target.tagName.toLowerCase() == "li"){
			conosole.log(e.touches[0].target.tagName.toLowerCase());
			return;
		}
		if(e.touches[0].target.tagName.toLowerCase()=="input"){
			return;
		}
		e.preventDefault();
	}


	//ドキュメントのタッチイベントの初期化
	document.addEventListener("touchstart",stopDefault,false);
	document.addEventListener("touchmove",stopDefault,false);
	//document.addEventListener("touchend",stopDefault,false);
	//ドキュメントのジェスチャーイベントの初期化
	document.addEventListener("gesturestart",stopDefault,false);
	document.addEventListener("gesturechange",stopDefault,false);
	//document.addEventListener("gestureend",stopDefault,false);


	//画像変換する処理
	var toImage=document.getElementById("toImage_button");
	toImage.addEventListener("click",function(){
		var data=canvas.toDataURL("image/jpeg");
		var imageContents=document.getElementById("imageContents");
		imageContents.innerHTML="<img src='"+data+"'>";
		socket.emit("pushImageFromClient",data);
	},false);

}