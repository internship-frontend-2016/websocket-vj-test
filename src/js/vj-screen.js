//canavsとクォータニオン、ビデオエレメントをグローバルに扱う
var c;
var q=new qtnIV();
var qt=q.identity(q.create());
var video1;
var video2;
/*
var video3;

var video4;
var video5;
var video6;
var video7;
var video8;
var video9;
var video10;
var video11;
var video12;

var video13;
var video14;
*/

//ビデオをロードした数を数える
var load_num=0;
var select_video=1;

//audio関連
var Audiocontext;
var source;
var analyser;
var frequency;

var fft_flag=false;
var speed=0.0;
//マウスムーブイベントに登録する処理
function mouseMove(e){
	var cw=c.width;
	var ch=c.height;
	var wh=1/Math.sqrt(cw*cw+ch*ch);
	var x=e.clientX-c.offsetLeft-cw*0.5;
	var y=e.clientY-c.offsetTop-ch*0.5;
	var sq=Math.sqrt(x*x+y*y);
	var r=sq*2.0*Math.PI*wh;
	if(sq!=1){
		sq=1/sq;
		x*=sq;
		y*=sq;
	}
	q.rotate(r,[y,x,0.0],qt);
}

//ボタンをおしたかどうか
function KeyDown(e){
	//console.log(e.keyCode);
	if(e.keyCode==49){
		//1を押したら
		video1.play();
		select_video=1;
	}else if(e.keyCode==50){
		//2を押したら
		video2.play();
		select_video=2;
	}
	//sボタンは83
	if(e.keyCode==83&&fft_flag==false){
		fft_flag=true;
	}else if(e.keyCode==83&&fft_flag==true){
		fft_flag=false;
	}
	//スペースは32
	if(e.keyCode==32){
		if(speed==20.0){
			speed=0.0;
		}
		speed+=1.0;
		console.log(speed);
	}
}
//再生可能なビデオタイプを調べる
function checkVideoType(_video){
	if(_video.canPlayType("video/gif")==='maybe'){
		return 'gif';
	}else if(_video.canPlayType("video/mp4")==='maybe'){
		return 'mp4';
	}else{
		return null;
	}
}

onload=function(){
	navigator.getMedia=navigator.getUserMedia||
	navigator.webkitGetUserMedia||
	navigator.mozGetUserMedia||
	navigator.msGetUserMedia;

	//端末のビデオ、音声ストリームを所得
	navigator.getMedia({audio:true},
		function(stream){
			var animationId;
			Audiocontext=new webkitAudioContext();
			//マイク音声の所得
			source=Audiocontext.createMediaStreamSource(stream);
			//アナライザー
			analyser=Audiocontext.createAnalyser();

			//高速フーリエ変換のデータサイズ
			analyser.fftSize=2048;
			//振幅スペクトルが入っている配列
			frequency=new Uint8Array(analyser.frequencyBinCount);
			//おそらく音声データとアナライザーをくっつける
			source.connect(analyser);
			init();

	},function(err){
		//エラー処理
	});


	var socket =io();
	//サーバーからデータを受け取る
	socket.on("vjActionFromServer",function(msg){
		$('#messages').append($('<li>').text(msg));
		if(msg==1){
			video1.play();
			select_video=1;
		}else if(msg==2){
			video2.play();
			select_video=2;
		}
	});
}
function init(){
	//canvasエレメントを所得
	c=document.getElementById("canvas");
	c.width=720;
	c.height=480;


	video1=video_create("../img/original.");
	video2=video_create("../img/hand.");

	video_actions(video1);
	video_actions(video2);
	
		//ボタンを押したかどうか
	document.addEventListener("keydown" , KeyDown);
}
function video_actions(_video){
	_video.addEventListener("canplaythrough",function(){
		action();
	},true);
	_video.addEventListener("ended",function(){
		_video.play();
	},true);

}
function action(){
	load_num++;
	/*
	if(load_num==2
		render();
	}*/
	if(load_num==2){
		render();
	}
}
function video_create(_src){
	//ビデオエレメントを生成
	var video=document.createElement("video");
	//ビデオタイプのチェック
	var videoExt=checkVideoType(video);
	if(videoExt===null){
		alert("not supported");
		return;
	}
	//ソースの読み込み
	video.src=_src+videoExt;
	return video;
}

function render(){
	//ビデオ１を再生
	video1.play();
	c.addEventListener("mousemove",mouseMove,true);
	var gl=c.getContext("webgl")||c.getContext("experimental-webgl");

	var v_shader=create_shader("vs");
	var f_shader=create_shader("fs");

	var prg=create_program(v_shader,f_shader);
	var attLocation=new Array();
	attLocation[0]=gl.getAttribLocation(prg,"position");
	attLocation[1]=gl.getAttribLocation(prg,"color");
	attLocation[2]=gl.getAttribLocation(prg,"textureCoord");
	attLocation[3]=gl.getAttribLocation(prg,"instancePosition");

	var attStride=new Array();
	attStride[0]=3;
	attStride[1]=4;
	attStride[2]=2;
	attStride[3]=3;

	var uniLocation=new Array();
	uniLocation[0]=gl.getUniformLocation(prg,"mvpMatrix");
	uniLocation[1]=gl.getUniformLocation(prg,"texture");

	//キューブデータ
	var cubeData=cube(1,[1.0,1.0,1.0,1.0]);
	var cPosition=create_vbo(cubeData.p);
	var cColor=create_vbo(cubeData.c);
	var cTextureCoord=create_vbo(cubeData.t);
	var cVBOList=[cPosition,cColor,cTextureCoord];
	var cIndex=create_ibo(cubeData.i);
	/*拡張機能を有効化*/
	var ext;
	ext=gl.getExtension("ANGLE_instanced_arrays");
	if(ext==null){
		alert("ANGLE_instanced_arrays not supported");
		return;
	}

	//各インスタンスに適用するデータ

	//インスタンスの数
	var instanceCount=125;

	//インスタンス用配列
	var instancePositions=new Array();

	//配列用のストライド
	var offsetPosition=3;

	for(var i=0;i<instanceCount;i++){
		instancePositions[i*offsetPosition]=-(i%5.0)*1.5+0.0;
		instancePositions[i*offsetPosition+1]=(Math.floor(i/5.0)%5.0)*1.5+0.0;
		instancePositions[i*offsetPosition+2]=Math.floor(i/25.0)*1.5+0.0;
	}

	//配列からVBOを生成
	var iPosition=create_vbo(instancePositions);

	//トーラスのattribute関連
	set_attribute(cVBOList,attLocation,attStride);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cIndex);

	//インスタンス用の座標位置VBOを有効にする
	gl.bindBuffer(gl.ARRAY_BUFFER,iPosition);
	gl.enableVertexAttribArray(attLocation[3]);
	gl.vertexAttribPointer(attLocation[3],attStride[3],gl.FLOAT,false,0,0);
	//インスタンス用の有効化し除数を指定する
	ext.vertexAttribDivisorANGLE(attLocation[3],1);
	//各種行列の生成と初期化
	var m=new matIV();
	var mMatrix=m.identity(m.create());
	var vMatrix=m.identity(m.create());
	var pMatrix=m.identity(m.create());
	var tmpMatrix=m.identity(m.create());
	var mvpMatrix=m.identity(m.create());
	var invMatrix=m.identity(m.create());

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);


	gl.activeTexture(gl.TEXTURE0);

	var videoTexture1=null;
	var videoTexture2=null;

	create_textureVideo(video1,1);
	create_textureVideo(video2,2);
	//カウンタの宣言
	var count=0;
	var count2=0;

	//恒常ループ
	(function loop(){
		var scaleValue=1.0;
		if(fft_flag==true){
			analyser.getByteFrequencyData(frequency);
			//console.log(frequency[60]);
			scaleValue=frequency[50]/500+0.6;
		}
		count++;
		if (count % 10 == 0) {
		    count2++;
		}
		if(select_video==1){
			//テクスチャを更新する
			gl.bindTexture(gl.TEXTURE_2D,null);
			gl.bindTexture(gl.TEXTURE_2D,videoTexture1);
			gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video1);
		}else if(select_video==2){
			//テクスチャを更新する
			gl.bindTexture(gl.TEXTURE_2D,null);
			gl.bindTexture(gl.TEXTURE_2D,videoTexture2);
			gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video2);
		}


		//ビュー×プロジェクション座標変換行列
		var eyePosition=new Array();
		var camUpDirection=new Array();
		q.toVecIII([0.0,0.0,15.0],qt,eyePosition);
		q.toVecIII([0.0,1.0,0.0],qt,camUpDirection);
		m.lookAt(eyePosition,[0.0,0.0,0.0],camUpDirection,vMatrix);
		m.perspective(45,c.width/c.height,0.1,50.0,pMatrix);
		m.multiply(pMatrix,vMatrix,tmpMatrix);

		//canvasを初期化
		var hsv = hsva(count2 % 360, 1, 1, 1);
        gl.clearColor(hsv[0], hsv[1], hsv[2], hsv[3]);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//キューブのレンタリング
		m.identity(mMatrix);
		//m.rotate(mMatrix,(count%360)*Math.PI/180,[0.0,1.0,0.0],mMatrix);
		m.translate(mMatrix,[0.0,0.0,speed],mMatrix);
		m.scale(mMatrix,[scaleValue,scaleValue,scaleValue],mMatrix);
		m.rotate(mMatrix,Math.PI,[0.0,0.0,1.0],mMatrix);
		m.multiply(tmpMatrix,mMatrix,mvpMatrix);
		m.inverse(mMatrix,invMatrix);
		gl.uniformMatrix4fv(uniLocation[0],false,mvpMatrix);
		gl.uniform1i(uniLocation[1],0);

		ext.drawElementsInstancedANGLE(gl.TRIANGLES,cubeData.i.length,gl.UNSIGNED_SHORT,0,instanceCount);

		gl.flush();
		//requestAnimationFrame(a);
		//requestAnimationFrame(arguments.callee);
		requestAnimationFrame(loop);
		//setTimeout(a,1000/30);
	})();

	//シェーダを生成する関数
	function create_shader(id){
		var shader;

		var scriptElement=document.getElementById(id);

		if(!scriptElement){
			return;
		}

		switch(scriptElement.type){
			case 'x-shader/x-vertex':
			shader=gl.createShader(gl.VERTEX_SHADER);
			break;

			case 'x-shader/x-fragment':
			shader=gl.createShader(gl.FRAGMENT_SHADER);
			break;

			default:
			return;
		}

		gl.shaderSource(shader,scriptElement.text);

		gl.compileShader(shader);
		//シェーダーが正しくコンパイルされたかチェック
		if(gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
			return shader;
		}else{
			alert(gl.getShaderInfoLog(shader));
		}
	}

	function create_program(vs,fs){
		//プログラムオブジェクトの生成
		var program=gl.createProgram();

		gl.attachShader(program,vs);
		gl.attachShader(program,fs);

		gl.linkProgram(program);

		if(gl.getProgramParameter(program,gl.LINK_STATUS)){
			//成功していたらプログラムオブジェクトを有効にする
			gl.useProgram(program);

			//プログラムオブジェクトを返して終了
			return program;
		}else{
			alert(gl.getProgramInfoLog(program));
		}
	}

	//VBOを生成する関数
	function create_vbo(data){
		var vbo=gl.createBuffer();
		//バッファをバインド
		gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
		//バッファにデータをセット
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
		//バッファのバインドを無効化
		gl.bindBuffer(gl.ARRAY_BUFFER,null);

		return vbo;
	}

	function set_attribute(vbo,attL,attS){
		//引数として受け取った配列を処理する
		for(var i in vbo){
			gl.bindBuffer(gl.ARRAY_BUFFER,vbo[i]);
			//attributeLocationを有効にする
			gl.enableVertexAttribArray(attL[i]);
			//attributeLocationを通知し登録
			gl.vertexAttribPointer(attL[i],attS[i],gl.FLOAT,false,0,0);
		}
	}
	function create_ibo(data){
		var ibo=gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Int16Array(data),gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
		return ibo;
	}
	//videoのテクスチャを作成
	function create_textureVideo(_source,_number){
		var videoTexture=gl.createTexture(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D,videoTexture);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,_source);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

		gl.bindTexture(gl.TEXTURE_2D,null);
        switch(_number){
            case 1:
                videoTexture1 = videoTexture;
                break;
            case 2:
                videoTexture2 = videoTexture;
                break;

            default:
                break;
        }
	}
}