(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

//canavsとクォータニオン、ビデオエレメントをグローバルに扱う
var c;
var q = new qtnIV();
var qt = q.identity(q.create());
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
var load_num = 0;
var select_video = 1;

//audio関連
var Audiocontext;
var source;
var analyser;
var frequency;

var fft_flag = false;
var speed = 0.0;
//マウスムーブイベントに登録する処理
function mouseMove(e) {
	var cw = c.width;
	var ch = c.height;
	var wh = 1 / Math.sqrt(cw * cw + ch * ch);
	var x = e.clientX - c.offsetLeft - cw * 0.5;
	var y = e.clientY - c.offsetTop - ch * 0.5;
	var sq = Math.sqrt(x * x + y * y);
	var r = sq * 2.0 * Math.PI * wh;
	if (sq != 1) {
		sq = 1 / sq;
		x *= sq;
		y *= sq;
	}
	q.rotate(r, [y, x, 0.0], qt);
}

//ボタンをおしたかどうか
function KeyDown(e) {
	//console.log(e.keyCode);
	if (e.keyCode == 49) {
		//1を押したら
		video1.play();
		select_video = 1;
	} else if (e.keyCode == 50) {
		//2を押したら
		video2.play();
		select_video = 2;
	}
	/*
 	else if(e.keyCode==51){
 		video3.play();
 		select_video=3;
 	}else if(e.keyCode==52){
 		video4.play();
 		select_video=4;
 	}else if(e.keyCode==53){
 		video5.play();
 		select_video=5;
 	}else if(e.keyCode==54){
 		video6.play();
 		select_video=6;
 	}else if(e.keyCode==55){
 		video7.play();
 		select_video=7;
 	}else if(e.keyCode==56){
 		video8.play();
 		select_video=8;
 	}else if(e.keyCode==57){
 		video9.play();
 		select_video=9;
 	}else if(e.keyCode==48){
 		video10.play();
 		select_video=10;
 	}else if(e.keyCode==81){
 		//qボタン
 		video11.play();
 		select_video=11;
 	}else if(e.keyCode==87){
 		//wボタン
 		video12.play();
 		select_video=12;
 	}else if(e.keyCode==69){
 		//eボタン
 		video13.play();
 		select_video=13;
 	}else if(e.keyCode==82){
 		//rボタン
 		video14.play();
 		select_video=14;
 	}
 */
	//sボタンは83
	if (e.keyCode == 83 && fft_flag == false) {
		fft_flag = true;
	} else if (e.keyCode == 83 && fft_flag == true) {
		fft_flag = false;
	}
	//スペースは32
	if (e.keyCode == 32) {
		if (speed == 20.0) {
			speed = 0.0;
		}
		speed += 1.0;
		console.log(speed);
	}
}
//再生可能なビデオタイプを調べる
function checkVideoType(_video) {
	if (_video.canPlayType("video/gif") === 'maybe') {
		return 'gif';
	} else if (_video.canPlayType("video/mp4") === 'maybe') {
		return 'mp4';
	} else {
		return null;
	}
}

onload = function onload() {
	navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	//端末のビデオ、音声ストリームを所得
	navigator.getMedia({ audio: true }, function (stream) {
		var animationId;
		Audiocontext = new webkitAudioContext();
		//マイク音声の所得
		source = Audiocontext.createMediaStreamSource(stream);
		//アナライザー
		analyser = Audiocontext.createAnalyser();

		//高速フーリエ変換のデータサイズ
		analyser.fftSize = 2048;
		//振幅スペクトルが入っている配列
		frequency = new Uint8Array(analyser.frequencyBinCount);
		//おそらく音声データとアナライザーをくっつける
		source.connect(analyser);
		init();
	}, function (err) {
		//エラー処理
	});

	var socket = io();

	//サーバーからデータを受け取る
	socket.on("vjActionFromServer", function (msg) {
		$('#messages').append($('<li>').text(msg));
		if (msg == 1) {
			video1.play();
			select_video = 1;
		} else if (msg == 2) {
			video2.play();
			select_video = 2;
		}
	});
};
function init() {
	//canvasエレメントを所得
	c = document.getElementById("canvas");
	c.width = 720;
	c.height = 480;
	//	c.width=window.innerWidth;
	//	c.height=window.innerHeight;

	video1 = video_create("../img/original.");
	video2 = video_create("../img/hand.");
	/*
 video3=video_create("pokemon.");
 video4=video_create("cardcapter2.");
 video5=video_create("cardcapter3.");
 video6=video_create("cardcapter4.");
 video7=video_create("danshi.");
 video8=video_create("giphy.");
 video9=video_create("magic.");
 video10=video_create("nichijo.");
 video11=video_create("oso.");
 video12=video_create("oso2.");
 video13=video_create("Sailormoon.");
 video14=video_create("Sailormoon2.");
 */

	video_actions(video1);
	video_actions(video2);
	/*
 video_actions(video3);
 video_actions(video4);
 video_actions(video5);
 video_actions(video6);
 video_actions(video7);
 video_actions(video8);
 video_actions(video9);
 video_actions(video10);
 video_actions(video11);
 video_actions(video12);
 video_actions(video13);
 video_actions(video14);
 */
	//ボタンを押したかどうか
	document.addEventListener("keydown", KeyDown);
}
function video_actions(_video) {
	_video.addEventListener("canplaythrough", function () {
		action();
	}, true);
	_video.addEventListener("ended", function () {
		_video.play();
	}, true);
}
function action() {
	load_num++;
	/*
 if(load_num==14){
 	render();
 }*/
	if (load_num == 2) {
		render();
	}
}
function video_create(_src) {
	//ビデオエレメントを生成
	var video = document.createElement("video");
	//ビデオタイプのチェック
	var videoExt = checkVideoType(video);
	if (videoExt === null) {
		alert("not supported");
		return;
	}
	//ソースの読み込み
	video.src = _src + videoExt;
	return video;
}

function render() {
	//ビデオ１を再生
	video1.play();
	c.addEventListener("mousemove", mouseMove, true);
	var gl = c.getContext("webgl") || c.getContext("experimental-webgl");

	var v_shader = create_shader("vs");
	var f_shader = create_shader("fs");

	var prg = create_program(v_shader, f_shader);
	var attLocation = new Array();
	attLocation[0] = gl.getAttribLocation(prg, "position");
	attLocation[1] = gl.getAttribLocation(prg, "color");
	attLocation[2] = gl.getAttribLocation(prg, "textureCoord");
	attLocation[3] = gl.getAttribLocation(prg, "instancePosition");

	var attStride = new Array();
	attStride[0] = 3;
	attStride[1] = 4;
	attStride[2] = 2;
	attStride[3] = 3;

	var uniLocation = new Array();
	uniLocation[0] = gl.getUniformLocation(prg, "mvpMatrix");
	uniLocation[1] = gl.getUniformLocation(prg, "texture");

	//キューブデータ
	var cubeData = cube(1, [1.0, 1.0, 1.0, 1.0]);
	var cPosition = create_vbo(cubeData.p);
	var cColor = create_vbo(cubeData.c);
	var cTextureCoord = create_vbo(cubeData.t);
	var cVBOList = [cPosition, cColor, cTextureCoord];
	var cIndex = create_ibo(cubeData.i);
	/*拡張機能を有効化*/
	var ext;
	ext = gl.getExtension("ANGLE_instanced_arrays");
	if (ext == null) {
		alert("ANGLE_instanced_arrays not supported");
		return;
	}

	//各インスタンスに適用するデータ

	//インスタンスの数
	var instanceCount = 125;

	//インスタンス用配列
	var instancePositions = new Array();

	//配列用のストライド
	var offsetPosition = 3;

	for (var i = 0; i < instanceCount; i++) {
		instancePositions[i * offsetPosition] = -(i % 5.0) * 1.5 + 0.0;
		instancePositions[i * offsetPosition + 1] = Math.floor(i / 5.0) % 5.0 * 1.5 + 0.0;
		instancePositions[i * offsetPosition + 2] = Math.floor(i / 25.0) * 1.5 + 0.0;
	}

	//配列からVBOを生成
	var iPosition = create_vbo(instancePositions);

	//トーラスのattribute関連
	set_attribute(cVBOList, attLocation, attStride);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cIndex);

	//インスタンス用の座標位置VBOを有効にする
	gl.bindBuffer(gl.ARRAY_BUFFER, iPosition);
	gl.enableVertexAttribArray(attLocation[3]);
	gl.vertexAttribPointer(attLocation[3], attStride[3], gl.FLOAT, false, 0, 0);
	//インスタンス用の有効化し除数を指定する
	ext.vertexAttribDivisorANGLE(attLocation[3], 1);
	//各種行列の生成と初期化
	var m = new matIV();
	var mMatrix = m.identity(m.create());
	var vMatrix = m.identity(m.create());
	var pMatrix = m.identity(m.create());
	var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	var invMatrix = m.identity(m.create());

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);

	gl.activeTexture(gl.TEXTURE0);

	var videoTexture1 = null;
	var videoTexture2 = null;
	/*
 var videoTexture3=null;
 var videoTexture4=null;
 var videoTexture5=null;
 var videoTexture6=null;
 var videoTexture7=null;
 var videoTexture8=null;
 var videoTexture9=null;
 var videoTexture10=null;
 var videoTexture11=null;
 var videoTexture12=null;
 var videoTexture13=null;
 var videoTexture14=null;
 */

	create_textureVideo(video1, 1);
	create_textureVideo(video2, 2);
	/*
 	create_textureVideo(video3,3);
 	create_textureVideo(video4,4);
 	create_textureVideo(video5,5);
 	create_textureVideo(video6,6);
 	create_textureVideo(video7,7);
 	create_textureVideo(video8,8);
 	create_textureVideo(video9,9);
 	create_textureVideo(video10,10);
 	create_textureVideo(video11,11);
 	create_textureVideo(video12,12);
 	create_textureVideo(video13,13);
 	create_textureVideo(video14,14);
 */
	//カウンタの宣言
	var count = 0;
	var count2 = 0;

	//恒常ループ
	(function loop() {
		var scaleValue = 1.0;
		if (fft_flag == true) {
			analyser.getByteFrequencyData(frequency);
			//console.log(frequency[60]);
			scaleValue = frequency[50] / 500 + 0.6;
		}
		count++;
		if (count % 10 == 0) {
			count2++;
		}
		if (select_video == 1) {
			//テクスチャを更新する
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindTexture(gl.TEXTURE_2D, videoTexture1);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video1);
		} else if (select_video == 2) {
			//テクスチャを更新する
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindTexture(gl.TEXTURE_2D, videoTexture2);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video2);
		}
		/*
  else if(select_video==3){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture3);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video3);
  }else if(select_video==4){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture4);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video4);
  }else if(select_video==5){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture5);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video5);
  }else if(select_video==6){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture6);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video6);
  }else if(select_video==7){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture7);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video7);
  }else if(select_video==8){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture8);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video8);
  }else if(select_video==9){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture9);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video9);
  }else if(select_video==10){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture10);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video10);
  }else if(select_video==11){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture11);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video11);
  }else if(select_video==12){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture12);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video12);
  }else if(select_video==13){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture13);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video13);
  }else if(select_video==14){
  	gl.bindTexture(gl.TEXTURE_2D,null);
  	gl.bindTexture(gl.TEXTURE_2D,videoTexture14);
  	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video14);
  }*/

		//ビュー×プロジェクション座標変換行列
		var eyePosition = new Array();
		var camUpDirection = new Array();
		q.toVecIII([0.0, 0.0, 15.0], qt, eyePosition);
		q.toVecIII([0.0, 1.0, 0.0], qt, camUpDirection);
		m.lookAt(eyePosition, [0.0, 0.0, 0.0], camUpDirection, vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 50.0, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		//canvasを初期化
		var hsv = hsva(count2 % 360, 1, 1, 1);
		gl.clearColor(hsv[0], hsv[1], hsv[2], hsv[3]);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//キューブのレンタリング
		m.identity(mMatrix);
		//m.rotate(mMatrix,(count%360)*Math.PI/180,[0.0,1.0,0.0],mMatrix);
		m.translate(mMatrix, [0.0, 0.0, speed], mMatrix);
		m.scale(mMatrix, [scaleValue, scaleValue, scaleValue], mMatrix);
		m.rotate(mMatrix, Math.PI, [0.0, 0.0, 1.0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniform1i(uniLocation[1], 0);

		ext.drawElementsInstancedANGLE(gl.TRIANGLES, cubeData.i.length, gl.UNSIGNED_SHORT, 0, instanceCount);

		gl.flush();
		//requestAnimationFrame(a);
		//requestAnimationFrame(arguments.callee);
		requestAnimationFrame(loop);
		//setTimeout(a,1000/30);
	})();

	//シェーダを生成する関数
	function create_shader(id) {
		var shader;

		var scriptElement = document.getElementById(id);

		if (!scriptElement) {
			return;
		}

		switch (scriptElement.type) {
			case 'x-shader/x-vertex':
				shader = gl.createShader(gl.VERTEX_SHADER);
				break;

			case 'x-shader/x-fragment':
				shader = gl.createShader(gl.FRAGMENT_SHADER);
				break;

			default:
				return;
		}

		gl.shaderSource(shader, scriptElement.text);

		gl.compileShader(shader);
		//シェーダーが正しくコンパイルされたかチェック
		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		} else {
			alert(gl.getShaderInfoLog(shader));
		}
	}

	function create_program(vs, fs) {
		//プログラムオブジェクトの生成
		var program = gl.createProgram();

		gl.attachShader(program, vs);
		gl.attachShader(program, fs);

		gl.linkProgram(program);

		if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
			//成功していたらプログラムオブジェクトを有効にする
			gl.useProgram(program);

			//プログラムオブジェクトを返して終了
			return program;
		} else {
			alert(gl.getProgramInfoLog(program));
		}
	}

	//VBOを生成する関数
	function create_vbo(data) {
		var vbo = gl.createBuffer();
		//バッファをバインド
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		//バッファにデータをセット
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		//バッファのバインドを無効化
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		return vbo;
	}

	function set_attribute(vbo, attL, attS) {
		//引数として受け取った配列を処理する
		for (var i in vbo) {
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
			//attributeLocationを有効にする
			gl.enableVertexAttribArray(attL[i]);
			//attributeLocationを通知し登録
			gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
		}
	}
	function create_ibo(data) {
		var ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		return ibo;
	}
	//videoのテクスチャを作成
	function create_textureVideo(_source, _number) {
		var videoTexture = gl.createTexture(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, videoTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _source);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.bindTexture(gl.TEXTURE_2D, null);
		switch (_number) {
			case 1:
				videoTexture1 = videoTexture;
				break;
			case 2:
				videoTexture2 = videoTexture;
				break;
			/*
   case 3:
   videoTexture3 = videoTexture;
   break;
   case 4:
   videoTexture4 = videoTexture;
   break;
   case 5:
   videoTexture5 = videoTexture;
   break;
   case 6:
   videoTexture6 = videoTexture;
   break;
   case 7:
   videoTexture7 = videoTexture;
   break;
   case 8:
   videoTexture8 = videoTexture;
   break;
   case 9:
   videoTexture9 = videoTexture;
   break;
   case 10:
   videoTexture10 = videoTexture;
   break;
   case 11:
   videoTexture11 = videoTexture;
   break;
   case 12:
   videoTexture12 = videoTexture;
   break;
   case 13:
   videoTexture13 = videoTexture;
   break;
   case 14:
   videoTexture14 = videoTexture;
   break;*/
			default:
				break;
		}
	}
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4tdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7QUFDQSxJQUFJLENBQUo7QUFDQSxJQUFJLElBQUUsSUFBSSxLQUFKLEVBQU47QUFDQSxJQUFJLEtBQUcsRUFBRSxRQUFGLENBQVcsRUFBRSxNQUFGLEVBQVgsQ0FBUDtBQUNBLElBQUksTUFBSjtBQUNBLElBQUksTUFBSjtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTtBQUNBLElBQUksV0FBUyxDQUFiO0FBQ0EsSUFBSSxlQUFhLENBQWpCOztBQUVBO0FBQ0EsSUFBSSxZQUFKO0FBQ0EsSUFBSSxNQUFKO0FBQ0EsSUFBSSxRQUFKO0FBQ0EsSUFBSSxTQUFKOztBQUVBLElBQUksV0FBUyxLQUFiO0FBQ0EsSUFBSSxRQUFNLEdBQVY7QUFDQTtBQUNBLFNBQVMsU0FBVCxDQUFtQixDQUFuQixFQUFxQjtBQUNwQixLQUFJLEtBQUcsRUFBRSxLQUFUO0FBQ0EsS0FBSSxLQUFHLEVBQUUsTUFBVDtBQUNBLEtBQUksS0FBRyxJQUFFLEtBQUssSUFBTCxDQUFVLEtBQUcsRUFBSCxHQUFNLEtBQUcsRUFBbkIsQ0FBVDtBQUNBLEtBQUksSUFBRSxFQUFFLE9BQUYsR0FBVSxFQUFFLFVBQVosR0FBdUIsS0FBRyxHQUFoQztBQUNBLEtBQUksSUFBRSxFQUFFLE9BQUYsR0FBVSxFQUFFLFNBQVosR0FBc0IsS0FBRyxHQUEvQjtBQUNBLEtBQUksS0FBRyxLQUFLLElBQUwsQ0FBVSxJQUFFLENBQUYsR0FBSSxJQUFFLENBQWhCLENBQVA7QUFDQSxLQUFJLElBQUUsS0FBRyxHQUFILEdBQU8sS0FBSyxFQUFaLEdBQWUsRUFBckI7QUFDQSxLQUFHLE1BQUksQ0FBUCxFQUFTO0FBQ1IsT0FBRyxJQUFFLEVBQUw7QUFDQSxPQUFHLEVBQUg7QUFDQSxPQUFHLEVBQUg7QUFDQTtBQUNELEdBQUUsTUFBRixDQUFTLENBQVQsRUFBVyxDQUFDLENBQUQsRUFBRyxDQUFILEVBQUssR0FBTCxDQUFYLEVBQXFCLEVBQXJCO0FBQ0E7O0FBRUQ7QUFDQSxTQUFTLE9BQVQsQ0FBaUIsQ0FBakIsRUFBbUI7QUFDbEI7QUFDQSxLQUFHLEVBQUUsT0FBRixJQUFXLEVBQWQsRUFBaUI7QUFDaEI7QUFDQSxTQUFPLElBQVA7QUFDQSxpQkFBYSxDQUFiO0FBQ0EsRUFKRCxNQUlNLElBQUcsRUFBRSxPQUFGLElBQVcsRUFBZCxFQUFpQjtBQUN0QjtBQUNBLFNBQU8sSUFBUDtBQUNBLGlCQUFhLENBQWI7QUFDQTtBQUNGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkNDO0FBQ0EsS0FBRyxFQUFFLE9BQUYsSUFBVyxFQUFYLElBQWUsWUFBVSxLQUE1QixFQUFrQztBQUNqQyxhQUFTLElBQVQ7QUFDQSxFQUZELE1BRU0sSUFBRyxFQUFFLE9BQUYsSUFBVyxFQUFYLElBQWUsWUFBVSxJQUE1QixFQUFpQztBQUN0QyxhQUFTLEtBQVQ7QUFDQTtBQUNEO0FBQ0EsS0FBRyxFQUFFLE9BQUYsSUFBVyxFQUFkLEVBQWlCO0FBQ2hCLE1BQUcsU0FBTyxJQUFWLEVBQWU7QUFDZCxXQUFNLEdBQU47QUFDQTtBQUNELFdBQU8sR0FBUDtBQUNBLFVBQVEsR0FBUixDQUFZLEtBQVo7QUFDQTtBQUNEO0FBQ0Q7QUFDQSxTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsRUFBK0I7QUFDOUIsS0FBRyxPQUFPLFdBQVAsQ0FBbUIsV0FBbkIsTUFBa0MsT0FBckMsRUFBNkM7QUFDNUMsU0FBTyxLQUFQO0FBQ0EsRUFGRCxNQUVNLElBQUcsT0FBTyxXQUFQLENBQW1CLFdBQW5CLE1BQWtDLE9BQXJDLEVBQTZDO0FBQ2xELFNBQU8sS0FBUDtBQUNBLEVBRkssTUFFRDtBQUNKLFNBQU8sSUFBUDtBQUNBO0FBQ0Q7O0FBRUQsU0FBTyxrQkFBVTtBQUNoQixXQUFVLFFBQVYsR0FBbUIsVUFBVSxZQUFWLElBQ25CLFVBQVUsa0JBRFMsSUFFbkIsVUFBVSxlQUZTLElBR25CLFVBQVUsY0FIVjs7QUFLQTtBQUNBLFdBQVUsUUFBVixDQUFtQixFQUFDLE9BQU0sSUFBUCxFQUFuQixFQUNDLFVBQVMsTUFBVCxFQUFnQjtBQUNmLE1BQUksV0FBSjtBQUNBLGlCQUFhLElBQUksa0JBQUosRUFBYjtBQUNBO0FBQ0EsV0FBTyxhQUFhLHVCQUFiLENBQXFDLE1BQXJDLENBQVA7QUFDQTtBQUNBLGFBQVMsYUFBYSxjQUFiLEVBQVQ7O0FBRUE7QUFDQSxXQUFTLE9BQVQsR0FBaUIsSUFBakI7QUFDQTtBQUNBLGNBQVUsSUFBSSxVQUFKLENBQWUsU0FBUyxpQkFBeEIsQ0FBVjtBQUNBO0FBQ0EsU0FBTyxPQUFQLENBQWUsUUFBZjtBQUNBO0FBRUQsRUFqQkQsRUFpQkUsVUFBUyxHQUFULEVBQWE7QUFDZDtBQUNBLEVBbkJEOztBQXNCQSxLQUFJLFNBQVEsSUFBWjs7QUFHQTtBQUNBLFFBQU8sRUFBUCxDQUFVLG9CQUFWLEVBQStCLFVBQVMsR0FBVCxFQUFhO0FBQzNDLElBQUUsV0FBRixFQUFlLE1BQWYsQ0FBc0IsRUFBRSxNQUFGLEVBQVUsSUFBVixDQUFlLEdBQWYsQ0FBdEI7QUFDQSxNQUFHLE9BQUssQ0FBUixFQUFVO0FBQ1QsVUFBTyxJQUFQO0FBQ0Esa0JBQWEsQ0FBYjtBQUNBLEdBSEQsTUFHTSxJQUFHLE9BQUssQ0FBUixFQUFVO0FBQ2YsVUFBTyxJQUFQO0FBQ0Esa0JBQWEsQ0FBYjtBQUNBO0FBQ0QsRUFURDtBQVVBLENBM0NEO0FBNENBLFNBQVMsSUFBVCxHQUFlO0FBQ2Q7QUFDQSxLQUFFLFNBQVMsY0FBVCxDQUF3QixRQUF4QixDQUFGO0FBQ0EsR0FBRSxLQUFGLEdBQVEsR0FBUjtBQUNBLEdBQUUsTUFBRixHQUFTLEdBQVQ7QUFDRDtBQUNBOztBQUVDLFVBQU8sYUFBYSxrQkFBYixDQUFQO0FBQ0EsVUFBTyxhQUFhLGNBQWIsQ0FBUDtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUFlQSxlQUFjLE1BQWQ7QUFDQSxlQUFjLE1BQWQ7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFjQztBQUNELFVBQVMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBc0MsT0FBdEM7QUFDQTtBQUNELFNBQVMsYUFBVCxDQUF1QixNQUF2QixFQUE4QjtBQUM3QixRQUFPLGdCQUFQLENBQXdCLGdCQUF4QixFQUF5QyxZQUFVO0FBQ2xEO0FBQ0EsRUFGRCxFQUVFLElBRkY7QUFHQSxRQUFPLGdCQUFQLENBQXdCLE9BQXhCLEVBQWdDLFlBQVU7QUFDekMsU0FBTyxJQUFQO0FBQ0EsRUFGRCxFQUVFLElBRkY7QUFJQTtBQUNELFNBQVMsTUFBVCxHQUFpQjtBQUNoQjtBQUNBOzs7O0FBSUEsS0FBRyxZQUFVLENBQWIsRUFBZTtBQUNkO0FBQ0E7QUFDRDtBQUNELFNBQVMsWUFBVCxDQUFzQixJQUF0QixFQUEyQjtBQUMxQjtBQUNBLEtBQUksUUFBTSxTQUFTLGFBQVQsQ0FBdUIsT0FBdkIsQ0FBVjtBQUNBO0FBQ0EsS0FBSSxXQUFTLGVBQWUsS0FBZixDQUFiO0FBQ0EsS0FBRyxhQUFXLElBQWQsRUFBbUI7QUFDbEIsUUFBTSxlQUFOO0FBQ0E7QUFDQTtBQUNEO0FBQ0EsT0FBTSxHQUFOLEdBQVUsT0FBSyxRQUFmO0FBQ0EsUUFBTyxLQUFQO0FBQ0E7O0FBRUQsU0FBUyxNQUFULEdBQWlCO0FBQ2hCO0FBQ0EsUUFBTyxJQUFQO0FBQ0EsR0FBRSxnQkFBRixDQUFtQixXQUFuQixFQUErQixTQUEvQixFQUF5QyxJQUF6QztBQUNBLEtBQUksS0FBRyxFQUFFLFVBQUYsQ0FBYSxPQUFiLEtBQXVCLEVBQUUsVUFBRixDQUFhLG9CQUFiLENBQTlCOztBQUVBLEtBQUksV0FBUyxjQUFjLElBQWQsQ0FBYjtBQUNBLEtBQUksV0FBUyxjQUFjLElBQWQsQ0FBYjs7QUFFQSxLQUFJLE1BQUksZUFBZSxRQUFmLEVBQXdCLFFBQXhCLENBQVI7QUFDQSxLQUFJLGNBQVksSUFBSSxLQUFKLEVBQWhCO0FBQ0EsYUFBWSxDQUFaLElBQWUsR0FBRyxpQkFBSCxDQUFxQixHQUFyQixFQUF5QixVQUF6QixDQUFmO0FBQ0EsYUFBWSxDQUFaLElBQWUsR0FBRyxpQkFBSCxDQUFxQixHQUFyQixFQUF5QixPQUF6QixDQUFmO0FBQ0EsYUFBWSxDQUFaLElBQWUsR0FBRyxpQkFBSCxDQUFxQixHQUFyQixFQUF5QixjQUF6QixDQUFmO0FBQ0EsYUFBWSxDQUFaLElBQWUsR0FBRyxpQkFBSCxDQUFxQixHQUFyQixFQUF5QixrQkFBekIsQ0FBZjs7QUFFQSxLQUFJLFlBQVUsSUFBSSxLQUFKLEVBQWQ7QUFDQSxXQUFVLENBQVYsSUFBYSxDQUFiO0FBQ0EsV0FBVSxDQUFWLElBQWEsQ0FBYjtBQUNBLFdBQVUsQ0FBVixJQUFhLENBQWI7QUFDQSxXQUFVLENBQVYsSUFBYSxDQUFiOztBQUVBLEtBQUksY0FBWSxJQUFJLEtBQUosRUFBaEI7QUFDQSxhQUFZLENBQVosSUFBZSxHQUFHLGtCQUFILENBQXNCLEdBQXRCLEVBQTBCLFdBQTFCLENBQWY7QUFDQSxhQUFZLENBQVosSUFBZSxHQUFHLGtCQUFILENBQXNCLEdBQXRCLEVBQTBCLFNBQTFCLENBQWY7O0FBRUE7QUFDQSxLQUFJLFdBQVMsS0FBSyxDQUFMLEVBQU8sQ0FBQyxHQUFELEVBQUssR0FBTCxFQUFTLEdBQVQsRUFBYSxHQUFiLENBQVAsQ0FBYjtBQUNBLEtBQUksWUFBVSxXQUFXLFNBQVMsQ0FBcEIsQ0FBZDtBQUNBLEtBQUksU0FBTyxXQUFXLFNBQVMsQ0FBcEIsQ0FBWDtBQUNBLEtBQUksZ0JBQWMsV0FBVyxTQUFTLENBQXBCLENBQWxCO0FBQ0EsS0FBSSxXQUFTLENBQUMsU0FBRCxFQUFXLE1BQVgsRUFBa0IsYUFBbEIsQ0FBYjtBQUNBLEtBQUksU0FBTyxXQUFXLFNBQVMsQ0FBcEIsQ0FBWDtBQUNBO0FBQ0EsS0FBSSxHQUFKO0FBQ0EsT0FBSSxHQUFHLFlBQUgsQ0FBZ0Isd0JBQWhCLENBQUo7QUFDQSxLQUFHLE9BQUssSUFBUixFQUFhO0FBQ1osUUFBTSxzQ0FBTjtBQUNBO0FBQ0E7O0FBRUQ7O0FBRUE7QUFDQSxLQUFJLGdCQUFjLEdBQWxCOztBQUVBO0FBQ0EsS0FBSSxvQkFBa0IsSUFBSSxLQUFKLEVBQXRCOztBQUVBO0FBQ0EsS0FBSSxpQkFBZSxDQUFuQjs7QUFFQSxNQUFJLElBQUksSUFBRSxDQUFWLEVBQVksSUFBRSxhQUFkLEVBQTRCLEdBQTVCLEVBQWdDO0FBQy9CLG9CQUFrQixJQUFFLGNBQXBCLElBQW9DLEVBQUUsSUFBRSxHQUFKLElBQVMsR0FBVCxHQUFhLEdBQWpEO0FBQ0Esb0JBQWtCLElBQUUsY0FBRixHQUFpQixDQUFuQyxJQUF1QyxLQUFLLEtBQUwsQ0FBVyxJQUFFLEdBQWIsSUFBa0IsR0FBbkIsR0FBd0IsR0FBeEIsR0FBNEIsR0FBbEU7QUFDQSxvQkFBa0IsSUFBRSxjQUFGLEdBQWlCLENBQW5DLElBQXNDLEtBQUssS0FBTCxDQUFXLElBQUUsSUFBYixJQUFtQixHQUFuQixHQUF1QixHQUE3RDtBQUNBOztBQUVEO0FBQ0EsS0FBSSxZQUFVLFdBQVcsaUJBQVgsQ0FBZDs7QUFFQTtBQUNBLGVBQWMsUUFBZCxFQUF1QixXQUF2QixFQUFtQyxTQUFuQztBQUNBLElBQUcsVUFBSCxDQUFjLEdBQUcsb0JBQWpCLEVBQXNDLE1BQXRDOztBQUVBO0FBQ0EsSUFBRyxVQUFILENBQWMsR0FBRyxZQUFqQixFQUE4QixTQUE5QjtBQUNBLElBQUcsdUJBQUgsQ0FBMkIsWUFBWSxDQUFaLENBQTNCO0FBQ0EsSUFBRyxtQkFBSCxDQUF1QixZQUFZLENBQVosQ0FBdkIsRUFBc0MsVUFBVSxDQUFWLENBQXRDLEVBQW1ELEdBQUcsS0FBdEQsRUFBNEQsS0FBNUQsRUFBa0UsQ0FBbEUsRUFBb0UsQ0FBcEU7QUFDQTtBQUNBLEtBQUksd0JBQUosQ0FBNkIsWUFBWSxDQUFaLENBQTdCLEVBQTRDLENBQTVDO0FBQ0E7QUFDQSxLQUFJLElBQUUsSUFBSSxLQUFKLEVBQU47QUFDQSxLQUFJLFVBQVEsRUFBRSxRQUFGLENBQVcsRUFBRSxNQUFGLEVBQVgsQ0FBWjtBQUNBLEtBQUksVUFBUSxFQUFFLFFBQUYsQ0FBVyxFQUFFLE1BQUYsRUFBWCxDQUFaO0FBQ0EsS0FBSSxVQUFRLEVBQUUsUUFBRixDQUFXLEVBQUUsTUFBRixFQUFYLENBQVo7QUFDQSxLQUFJLFlBQVUsRUFBRSxRQUFGLENBQVcsRUFBRSxNQUFGLEVBQVgsQ0FBZDtBQUNBLEtBQUksWUFBVSxFQUFFLFFBQUYsQ0FBVyxFQUFFLE1BQUYsRUFBWCxDQUFkO0FBQ0EsS0FBSSxZQUFVLEVBQUUsUUFBRixDQUFXLEVBQUUsTUFBRixFQUFYLENBQWQ7O0FBRUEsSUFBRyxNQUFILENBQVUsR0FBRyxVQUFiO0FBQ0EsSUFBRyxTQUFILENBQWEsR0FBRyxNQUFoQjtBQUNBLElBQUcsTUFBSCxDQUFVLEdBQUcsU0FBYjs7QUFHQSxJQUFHLGFBQUgsQ0FBaUIsR0FBRyxRQUFwQjs7QUFFQSxLQUFJLGdCQUFjLElBQWxCO0FBQ0EsS0FBSSxnQkFBYyxJQUFsQjtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUFlQSxxQkFBb0IsTUFBcEIsRUFBMkIsQ0FBM0I7QUFDQSxxQkFBb0IsTUFBcEIsRUFBMkIsQ0FBM0I7QUFDRDs7Ozs7Ozs7Ozs7Ozs7QUFjQztBQUNBLEtBQUksUUFBTSxDQUFWO0FBQ0EsS0FBSSxTQUFPLENBQVg7O0FBRUE7QUFDQSxFQUFDLFNBQVMsSUFBVCxHQUFlO0FBQ2YsTUFBSSxhQUFXLEdBQWY7QUFDQSxNQUFHLFlBQVUsSUFBYixFQUFrQjtBQUNqQixZQUFTLG9CQUFULENBQThCLFNBQTlCO0FBQ0E7QUFDQSxnQkFBVyxVQUFVLEVBQVYsSUFBYyxHQUFkLEdBQWtCLEdBQTdCO0FBQ0E7QUFDRDtBQUNBLE1BQUksUUFBUSxFQUFSLElBQWMsQ0FBbEIsRUFBcUI7QUFDakI7QUFDSDtBQUNELE1BQUcsZ0JBQWMsQ0FBakIsRUFBbUI7QUFDbEI7QUFDQSxNQUFHLFdBQUgsQ0FBZSxHQUFHLFVBQWxCLEVBQTZCLElBQTdCO0FBQ0EsTUFBRyxXQUFILENBQWUsR0FBRyxVQUFsQixFQUE2QixhQUE3QjtBQUNBLE1BQUcsVUFBSCxDQUFjLEdBQUcsVUFBakIsRUFBNEIsQ0FBNUIsRUFBOEIsR0FBRyxJQUFqQyxFQUFzQyxHQUFHLElBQXpDLEVBQThDLEdBQUcsYUFBakQsRUFBK0QsTUFBL0Q7QUFDQSxHQUxELE1BS00sSUFBRyxnQkFBYyxDQUFqQixFQUFtQjtBQUN4QjtBQUNBLE1BQUcsV0FBSCxDQUFlLEdBQUcsVUFBbEIsRUFBNkIsSUFBN0I7QUFDQSxNQUFHLFdBQUgsQ0FBZSxHQUFHLFVBQWxCLEVBQTZCLGFBQTdCO0FBQ0EsTUFBRyxVQUFILENBQWMsR0FBRyxVQUFqQixFQUE0QixDQUE1QixFQUE4QixHQUFHLElBQWpDLEVBQXNDLEdBQUcsSUFBekMsRUFBOEMsR0FBRyxhQUFqRCxFQUErRCxNQUEvRDtBQUNBO0FBQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9EQTtBQUNBLE1BQUksY0FBWSxJQUFJLEtBQUosRUFBaEI7QUFDQSxNQUFJLGlCQUFlLElBQUksS0FBSixFQUFuQjtBQUNBLElBQUUsUUFBRixDQUFXLENBQUMsR0FBRCxFQUFLLEdBQUwsRUFBUyxJQUFULENBQVgsRUFBMEIsRUFBMUIsRUFBNkIsV0FBN0I7QUFDQSxJQUFFLFFBQUYsQ0FBVyxDQUFDLEdBQUQsRUFBSyxHQUFMLEVBQVMsR0FBVCxDQUFYLEVBQXlCLEVBQXpCLEVBQTRCLGNBQTVCO0FBQ0EsSUFBRSxNQUFGLENBQVMsV0FBVCxFQUFxQixDQUFDLEdBQUQsRUFBSyxHQUFMLEVBQVMsR0FBVCxDQUFyQixFQUFtQyxjQUFuQyxFQUFrRCxPQUFsRDtBQUNBLElBQUUsV0FBRixDQUFjLEVBQWQsRUFBaUIsRUFBRSxLQUFGLEdBQVEsRUFBRSxNQUEzQixFQUFrQyxHQUFsQyxFQUFzQyxJQUF0QyxFQUEyQyxPQUEzQztBQUNBLElBQUUsUUFBRixDQUFXLE9BQVgsRUFBbUIsT0FBbkIsRUFBMkIsU0FBM0I7O0FBRUE7QUFDQSxNQUFJLE1BQU0sS0FBSyxTQUFTLEdBQWQsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsQ0FBVjtBQUNNLEtBQUcsVUFBSCxDQUFjLElBQUksQ0FBSixDQUFkLEVBQXNCLElBQUksQ0FBSixDQUF0QixFQUE4QixJQUFJLENBQUosQ0FBOUIsRUFBc0MsSUFBSSxDQUFKLENBQXRDO0FBQ04sS0FBRyxVQUFILENBQWMsR0FBZDtBQUNBLEtBQUcsS0FBSCxDQUFTLEdBQUcsZ0JBQUgsR0FBc0IsR0FBRyxnQkFBbEM7O0FBRUE7QUFDQSxJQUFFLFFBQUYsQ0FBVyxPQUFYO0FBQ0E7QUFDQSxJQUFFLFNBQUYsQ0FBWSxPQUFaLEVBQW9CLENBQUMsR0FBRCxFQUFLLEdBQUwsRUFBUyxLQUFULENBQXBCLEVBQW9DLE9BQXBDO0FBQ0EsSUFBRSxLQUFGLENBQVEsT0FBUixFQUFnQixDQUFDLFVBQUQsRUFBWSxVQUFaLEVBQXVCLFVBQXZCLENBQWhCLEVBQW1ELE9BQW5EO0FBQ0EsSUFBRSxNQUFGLENBQVMsT0FBVCxFQUFpQixLQUFLLEVBQXRCLEVBQXlCLENBQUMsR0FBRCxFQUFLLEdBQUwsRUFBUyxHQUFULENBQXpCLEVBQXVDLE9BQXZDO0FBQ0EsSUFBRSxRQUFGLENBQVcsU0FBWCxFQUFxQixPQUFyQixFQUE2QixTQUE3QjtBQUNBLElBQUUsT0FBRixDQUFVLE9BQVYsRUFBa0IsU0FBbEI7QUFDQSxLQUFHLGdCQUFILENBQW9CLFlBQVksQ0FBWixDQUFwQixFQUFtQyxLQUFuQyxFQUF5QyxTQUF6QztBQUNBLEtBQUcsU0FBSCxDQUFhLFlBQVksQ0FBWixDQUFiLEVBQTRCLENBQTVCOztBQUVBLE1BQUksMEJBQUosQ0FBK0IsR0FBRyxTQUFsQyxFQUE0QyxTQUFTLENBQVQsQ0FBVyxNQUF2RCxFQUE4RCxHQUFHLGNBQWpFLEVBQWdGLENBQWhGLEVBQWtGLGFBQWxGOztBQUVBLEtBQUcsS0FBSDtBQUNBO0FBQ0E7QUFDQSx3QkFBc0IsSUFBdEI7QUFDQTtBQUNBLEVBM0dEOztBQTZHQTtBQUNBLFVBQVMsYUFBVCxDQUF1QixFQUF2QixFQUEwQjtBQUN6QixNQUFJLE1BQUo7O0FBRUEsTUFBSSxnQkFBYyxTQUFTLGNBQVQsQ0FBd0IsRUFBeEIsQ0FBbEI7O0FBRUEsTUFBRyxDQUFDLGFBQUosRUFBa0I7QUFDakI7QUFDQTs7QUFFRCxVQUFPLGNBQWMsSUFBckI7QUFDQyxRQUFLLG1CQUFMO0FBQ0EsYUFBTyxHQUFHLFlBQUgsQ0FBZ0IsR0FBRyxhQUFuQixDQUFQO0FBQ0E7O0FBRUEsUUFBSyxxQkFBTDtBQUNBLGFBQU8sR0FBRyxZQUFILENBQWdCLEdBQUcsZUFBbkIsQ0FBUDtBQUNBOztBQUVBO0FBQ0E7QUFWRDs7QUFhQSxLQUFHLFlBQUgsQ0FBZ0IsTUFBaEIsRUFBdUIsY0FBYyxJQUFyQzs7QUFFQSxLQUFHLGFBQUgsQ0FBaUIsTUFBakI7QUFDQTtBQUNBLE1BQUcsR0FBRyxrQkFBSCxDQUFzQixNQUF0QixFQUE2QixHQUFHLGNBQWhDLENBQUgsRUFBbUQ7QUFDbEQsVUFBTyxNQUFQO0FBQ0EsR0FGRCxNQUVLO0FBQ0osU0FBTSxHQUFHLGdCQUFILENBQW9CLE1BQXBCLENBQU47QUFDQTtBQUNEOztBQUVELFVBQVMsY0FBVCxDQUF3QixFQUF4QixFQUEyQixFQUEzQixFQUE4QjtBQUM3QjtBQUNBLE1BQUksVUFBUSxHQUFHLGFBQUgsRUFBWjs7QUFFQSxLQUFHLFlBQUgsQ0FBZ0IsT0FBaEIsRUFBd0IsRUFBeEI7QUFDQSxLQUFHLFlBQUgsQ0FBZ0IsT0FBaEIsRUFBd0IsRUFBeEI7O0FBRUEsS0FBRyxXQUFILENBQWUsT0FBZjs7QUFFQSxNQUFHLEdBQUcsbUJBQUgsQ0FBdUIsT0FBdkIsRUFBK0IsR0FBRyxXQUFsQyxDQUFILEVBQWtEO0FBQ2pEO0FBQ0EsTUFBRyxVQUFILENBQWMsT0FBZDs7QUFFQTtBQUNBLFVBQU8sT0FBUDtBQUNBLEdBTkQsTUFNSztBQUNKLFNBQU0sR0FBRyxpQkFBSCxDQUFxQixPQUFyQixDQUFOO0FBQ0E7QUFDRDs7QUFFRDtBQUNBLFVBQVMsVUFBVCxDQUFvQixJQUFwQixFQUF5QjtBQUN4QixNQUFJLE1BQUksR0FBRyxZQUFILEVBQVI7QUFDQTtBQUNBLEtBQUcsVUFBSCxDQUFjLEdBQUcsWUFBakIsRUFBOEIsR0FBOUI7QUFDQTtBQUNBLEtBQUcsVUFBSCxDQUFjLEdBQUcsWUFBakIsRUFBOEIsSUFBSSxZQUFKLENBQWlCLElBQWpCLENBQTlCLEVBQXFELEdBQUcsV0FBeEQ7QUFDQTtBQUNBLEtBQUcsVUFBSCxDQUFjLEdBQUcsWUFBakIsRUFBOEIsSUFBOUI7O0FBRUEsU0FBTyxHQUFQO0FBQ0E7O0FBRUQsVUFBUyxhQUFULENBQXVCLEdBQXZCLEVBQTJCLElBQTNCLEVBQWdDLElBQWhDLEVBQXFDO0FBQ3BDO0FBQ0EsT0FBSSxJQUFJLENBQVIsSUFBYSxHQUFiLEVBQWlCO0FBQ2hCLE1BQUcsVUFBSCxDQUFjLEdBQUcsWUFBakIsRUFBOEIsSUFBSSxDQUFKLENBQTlCO0FBQ0E7QUFDQSxNQUFHLHVCQUFILENBQTJCLEtBQUssQ0FBTCxDQUEzQjtBQUNBO0FBQ0EsTUFBRyxtQkFBSCxDQUF1QixLQUFLLENBQUwsQ0FBdkIsRUFBK0IsS0FBSyxDQUFMLENBQS9CLEVBQXVDLEdBQUcsS0FBMUMsRUFBZ0QsS0FBaEQsRUFBc0QsQ0FBdEQsRUFBd0QsQ0FBeEQ7QUFDQTtBQUNEO0FBQ0QsVUFBUyxVQUFULENBQW9CLElBQXBCLEVBQXlCO0FBQ3hCLE1BQUksTUFBSSxHQUFHLFlBQUgsRUFBUjtBQUNBLEtBQUcsVUFBSCxDQUFjLEdBQUcsb0JBQWpCLEVBQXNDLEdBQXRDO0FBQ0EsS0FBRyxVQUFILENBQWMsR0FBRyxvQkFBakIsRUFBc0MsSUFBSSxVQUFKLENBQWUsSUFBZixDQUF0QyxFQUEyRCxHQUFHLFdBQTlEO0FBQ0EsS0FBRyxVQUFILENBQWMsR0FBRyxvQkFBakIsRUFBc0MsSUFBdEM7QUFDQSxTQUFPLEdBQVA7QUFDQTtBQUNEO0FBQ0EsVUFBUyxtQkFBVCxDQUE2QixPQUE3QixFQUFxQyxPQUFyQyxFQUE2QztBQUM1QyxNQUFJLGVBQWEsR0FBRyxhQUFILENBQWlCLEdBQUcsVUFBcEIsQ0FBakI7QUFDQSxLQUFHLFdBQUgsQ0FBZSxHQUFHLFVBQWxCLEVBQTZCLFlBQTdCO0FBQ0EsS0FBRyxVQUFILENBQWMsR0FBRyxVQUFqQixFQUE0QixDQUE1QixFQUE4QixHQUFHLElBQWpDLEVBQXNDLEdBQUcsSUFBekMsRUFBOEMsR0FBRyxhQUFqRCxFQUErRCxPQUEvRDtBQUNBLEtBQUcsYUFBSCxDQUFpQixHQUFHLFVBQXBCLEVBQStCLEdBQUcsa0JBQWxDLEVBQXFELEdBQUcsTUFBeEQ7QUFDQSxLQUFHLGFBQUgsQ0FBaUIsR0FBRyxVQUFwQixFQUErQixHQUFHLGtCQUFsQyxFQUFxRCxHQUFHLE1BQXhEO0FBQ0EsS0FBRyxhQUFILENBQWlCLEdBQUcsVUFBcEIsRUFBK0IsR0FBRyxjQUFsQyxFQUFpRCxHQUFHLGFBQXBEO0FBQ0EsS0FBRyxhQUFILENBQWlCLEdBQUcsVUFBcEIsRUFBK0IsR0FBRyxjQUFsQyxFQUFpRCxHQUFHLGFBQXBEOztBQUVBLEtBQUcsV0FBSCxDQUFlLEdBQUcsVUFBbEIsRUFBNkIsSUFBN0I7QUFDTSxVQUFPLE9BQVA7QUFDSSxRQUFLLENBQUw7QUFDSSxvQkFBZ0IsWUFBaEI7QUFDQTtBQUNKLFFBQUssQ0FBTDtBQUNJLG9CQUFnQixZQUFoQjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQ0o7QUFDSTtBQTdDUjtBQStDTjtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vY2FuYXZz44Go44Kv44Kp44O844K/44OL44Kq44Oz44CB44OT44OH44Kq44Ko44Os44Oh44Oz44OI44KS44Kw44Ot44O844OQ44Or44Gr5omx44GGXHJcbnZhciBjO1xyXG52YXIgcT1uZXcgcXRuSVYoKTtcclxudmFyIHF0PXEuaWRlbnRpdHkocS5jcmVhdGUoKSk7XHJcbnZhciB2aWRlbzE7XHJcbnZhciB2aWRlbzI7XHJcbi8qXHJcbnZhciB2aWRlbzM7XHJcblxyXG52YXIgdmlkZW80O1xyXG52YXIgdmlkZW81O1xyXG52YXIgdmlkZW82O1xyXG52YXIgdmlkZW83O1xyXG52YXIgdmlkZW84O1xyXG52YXIgdmlkZW85O1xyXG52YXIgdmlkZW8xMDtcclxudmFyIHZpZGVvMTE7XHJcbnZhciB2aWRlbzEyO1xyXG5cclxudmFyIHZpZGVvMTM7XHJcbnZhciB2aWRlbzE0O1xyXG4qL1xyXG5cclxuLy/jg5Pjg4fjgqrjgpLjg63jg7zjg4njgZfjgZ/mlbDjgpLmlbDjgYjjgotcclxudmFyIGxvYWRfbnVtPTA7XHJcbnZhciBzZWxlY3RfdmlkZW89MTtcclxuXHJcbi8vYXVkaW/plqLpgKNcclxudmFyIEF1ZGlvY29udGV4dDtcclxudmFyIHNvdXJjZTtcclxudmFyIGFuYWx5c2VyO1xyXG52YXIgZnJlcXVlbmN5O1xyXG5cclxudmFyIGZmdF9mbGFnPWZhbHNlO1xyXG52YXIgc3BlZWQ9MC4wO1xyXG4vL+ODnuOCpuOCueODoOODvOODluOCpOODmeODs+ODiOOBq+eZu+mMsuOBmeOCi+WHpueQhlxyXG5mdW5jdGlvbiBtb3VzZU1vdmUoZSl7XHJcblx0dmFyIGN3PWMud2lkdGg7XHJcblx0dmFyIGNoPWMuaGVpZ2h0O1xyXG5cdHZhciB3aD0xL01hdGguc3FydChjdypjdytjaCpjaCk7XHJcblx0dmFyIHg9ZS5jbGllbnRYLWMub2Zmc2V0TGVmdC1jdyowLjU7XHJcblx0dmFyIHk9ZS5jbGllbnRZLWMub2Zmc2V0VG9wLWNoKjAuNTtcclxuXHR2YXIgc3E9TWF0aC5zcXJ0KHgqeCt5KnkpO1xyXG5cdHZhciByPXNxKjIuMCpNYXRoLlBJKndoO1xyXG5cdGlmKHNxIT0xKXtcclxuXHRcdHNxPTEvc3E7XHJcblx0XHR4Kj1zcTtcclxuXHRcdHkqPXNxO1xyXG5cdH1cclxuXHRxLnJvdGF0ZShyLFt5LHgsMC4wXSxxdCk7XHJcbn1cclxuXHJcbi8v44Oc44K/44Oz44KS44GK44GX44Gf44GL44Gp44GG44GLXHJcbmZ1bmN0aW9uIEtleURvd24oZSl7XHJcblx0Ly9jb25zb2xlLmxvZyhlLmtleUNvZGUpO1xyXG5cdGlmKGUua2V5Q29kZT09NDkpe1xyXG5cdFx0Ly8x44KS5oq844GX44Gf44KJXHJcblx0XHR2aWRlbzEucGxheSgpO1xyXG5cdFx0c2VsZWN0X3ZpZGVvPTE7XHJcblx0fWVsc2UgaWYoZS5rZXlDb2RlPT01MCl7XHJcblx0XHQvLzLjgpLmirzjgZfjgZ/jgolcclxuXHRcdHZpZGVvMi5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89MjtcclxuXHR9XHJcbi8qXHJcblx0ZWxzZSBpZihlLmtleUNvZGU9PTUxKXtcclxuXHRcdHZpZGVvMy5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89MztcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTUyKXtcclxuXHRcdHZpZGVvNC5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89NDtcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTUzKXtcclxuXHRcdHZpZGVvNS5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89NTtcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTU0KXtcclxuXHRcdHZpZGVvNi5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89NjtcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTU1KXtcclxuXHRcdHZpZGVvNy5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89NztcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTU2KXtcclxuXHRcdHZpZGVvOC5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89ODtcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTU3KXtcclxuXHRcdHZpZGVvOS5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89OTtcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTQ4KXtcclxuXHRcdHZpZGVvMTAucGxheSgpO1xyXG5cdFx0c2VsZWN0X3ZpZGVvPTEwO1xyXG5cdH1lbHNlIGlmKGUua2V5Q29kZT09ODEpe1xyXG5cdFx0Ly9x44Oc44K/44OzXHJcblx0XHR2aWRlbzExLnBsYXkoKTtcclxuXHRcdHNlbGVjdF92aWRlbz0xMTtcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTg3KXtcclxuXHRcdC8vd+ODnOOCv+ODs1xyXG5cdFx0dmlkZW8xMi5wbGF5KCk7XHJcblx0XHRzZWxlY3RfdmlkZW89MTI7XHJcblx0fWVsc2UgaWYoZS5rZXlDb2RlPT02OSl7XHJcblx0XHQvL2Xjg5zjgr/jg7NcclxuXHRcdHZpZGVvMTMucGxheSgpO1xyXG5cdFx0c2VsZWN0X3ZpZGVvPTEzO1xyXG5cdH1lbHNlIGlmKGUua2V5Q29kZT09ODIpe1xyXG5cdFx0Ly9y44Oc44K/44OzXHJcblx0XHR2aWRlbzE0LnBsYXkoKTtcclxuXHRcdHNlbGVjdF92aWRlbz0xNDtcclxuXHR9XHJcbiovXHJcblx0Ly9z44Oc44K/44Oz44GvODNcclxuXHRpZihlLmtleUNvZGU9PTgzJiZmZnRfZmxhZz09ZmFsc2Upe1xyXG5cdFx0ZmZ0X2ZsYWc9dHJ1ZTtcclxuXHR9ZWxzZSBpZihlLmtleUNvZGU9PTgzJiZmZnRfZmxhZz09dHJ1ZSl7XHJcblx0XHRmZnRfZmxhZz1mYWxzZTtcclxuXHR9XHJcblx0Ly/jgrnjg5rjg7zjgrnjga8zMlxyXG5cdGlmKGUua2V5Q29kZT09MzIpe1xyXG5cdFx0aWYoc3BlZWQ9PTIwLjApe1xyXG5cdFx0XHRzcGVlZD0wLjA7XHJcblx0XHR9XHJcblx0XHRzcGVlZCs9MS4wO1xyXG5cdFx0Y29uc29sZS5sb2coc3BlZWQpO1xyXG5cdH1cclxufVxyXG4vL+WGjeeUn+WPr+iDveOBquODk+ODh+OCquOCv+OCpOODl+OCkuiqv+OBueOCi1xyXG5mdW5jdGlvbiBjaGVja1ZpZGVvVHlwZShfdmlkZW8pe1xyXG5cdGlmKF92aWRlby5jYW5QbGF5VHlwZShcInZpZGVvL2dpZlwiKT09PSdtYXliZScpe1xyXG5cdFx0cmV0dXJuICdnaWYnO1xyXG5cdH1lbHNlIGlmKF92aWRlby5jYW5QbGF5VHlwZShcInZpZGVvL21wNFwiKT09PSdtYXliZScpe1xyXG5cdFx0cmV0dXJuICdtcDQnO1xyXG5cdH1lbHNle1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG59XHJcblxyXG5vbmxvYWQ9ZnVuY3Rpb24oKXtcclxuXHRuYXZpZ2F0b3IuZ2V0TWVkaWE9bmF2aWdhdG9yLmdldFVzZXJNZWRpYXx8XHJcblx0bmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYXx8XHJcblx0bmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYXx8XHJcblx0bmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhO1xyXG5cclxuXHQvL+err+acq+OBruODk+ODh+OCquOAgemfs+WjsOOCueODiOODquODvOODoOOCkuaJgOW+l1xyXG5cdG5hdmlnYXRvci5nZXRNZWRpYSh7YXVkaW86dHJ1ZX0sXHJcblx0XHRmdW5jdGlvbihzdHJlYW0pe1xyXG5cdFx0XHR2YXIgYW5pbWF0aW9uSWQ7XHJcblx0XHRcdEF1ZGlvY29udGV4dD1uZXcgd2Via2l0QXVkaW9Db250ZXh0KCk7XHJcblx0XHRcdC8v44Oe44Kk44Kv6Z+z5aOw44Gu5omA5b6XXHJcblx0XHRcdHNvdXJjZT1BdWRpb2NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcclxuXHRcdFx0Ly/jgqLjg4rjg6njgqTjgrbjg7xcclxuXHRcdFx0YW5hbHlzZXI9QXVkaW9jb250ZXh0LmNyZWF0ZUFuYWx5c2VyKCk7XHJcblxyXG5cdFx0XHQvL+mrmOmAn+ODleODvOODquOCqOWkieaPm+OBruODh+ODvOOCv+OCteOCpOOCulxyXG5cdFx0XHRhbmFseXNlci5mZnRTaXplPTIwNDg7XHJcblx0XHRcdC8v5oyv5bmF44K544Oa44Kv44OI44Or44GM5YWl44Gj44Gm44GE44KL6YWN5YiXXHJcblx0XHRcdGZyZXF1ZW5jeT1uZXcgVWludDhBcnJheShhbmFseXNlci5mcmVxdWVuY3lCaW5Db3VudCk7XHJcblx0XHRcdC8v44GK44Gd44KJ44GP6Z+z5aOw44OH44O844K/44Go44Ki44OK44Op44Kk44K244O844KS44GP44Gj44Gk44GR44KLXHJcblx0XHRcdHNvdXJjZS5jb25uZWN0KGFuYWx5c2VyKTtcclxuXHRcdFx0aW5pdCgpO1xyXG5cclxuXHR9LGZ1bmN0aW9uKGVycil7XHJcblx0XHQvL+OCqOODqeODvOWHpueQhlxyXG5cdH0pO1xyXG5cclxuXHJcblx0dmFyIHNvY2tldCA9aW8oKTtcclxuXHJcblxyXG5cdC8v44K144O844OQ44O844GL44KJ44OH44O844K/44KS5Y+X44GR5Y+W44KLXHJcblx0c29ja2V0Lm9uKFwidmpBY3Rpb25Gcm9tU2VydmVyXCIsZnVuY3Rpb24obXNnKXtcclxuXHRcdCQoJyNtZXNzYWdlcycpLmFwcGVuZCgkKCc8bGk+JykudGV4dChtc2cpKTtcclxuXHRcdGlmKG1zZz09MSl7XHJcblx0XHRcdHZpZGVvMS5wbGF5KCk7XHJcblx0XHRcdHNlbGVjdF92aWRlbz0xO1xyXG5cdFx0fWVsc2UgaWYobXNnPT0yKXtcclxuXHRcdFx0dmlkZW8yLnBsYXkoKTtcclxuXHRcdFx0c2VsZWN0X3ZpZGVvPTI7XHJcblx0XHR9XHJcblx0fSk7XHJcbn1cclxuZnVuY3Rpb24gaW5pdCgpe1xyXG5cdC8vY2FudmFz44Ko44Os44Oh44Oz44OI44KS5omA5b6XXHJcblx0Yz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuXHRjLndpZHRoPTcyMDtcclxuXHRjLmhlaWdodD00ODA7XHJcbi8vXHRjLndpZHRoPXdpbmRvdy5pbm5lcldpZHRoO1xyXG4vL1x0Yy5oZWlnaHQ9d2luZG93LmlubmVySGVpZ2h0O1xyXG5cclxuXHR2aWRlbzE9dmlkZW9fY3JlYXRlKFwiLi4vaW1nL29yaWdpbmFsLlwiKTtcclxuXHR2aWRlbzI9dmlkZW9fY3JlYXRlKFwiLi4vaW1nL2hhbmQuXCIpO1xyXG5cdC8qXHJcblx0dmlkZW8zPXZpZGVvX2NyZWF0ZShcInBva2Vtb24uXCIpO1xyXG5cdHZpZGVvND12aWRlb19jcmVhdGUoXCJjYXJkY2FwdGVyMi5cIik7XHJcblx0dmlkZW81PXZpZGVvX2NyZWF0ZShcImNhcmRjYXB0ZXIzLlwiKTtcclxuXHR2aWRlbzY9dmlkZW9fY3JlYXRlKFwiY2FyZGNhcHRlcjQuXCIpO1xyXG5cdHZpZGVvNz12aWRlb19jcmVhdGUoXCJkYW5zaGkuXCIpO1xyXG5cdHZpZGVvOD12aWRlb19jcmVhdGUoXCJnaXBoeS5cIik7XHJcblx0dmlkZW85PXZpZGVvX2NyZWF0ZShcIm1hZ2ljLlwiKTtcclxuXHR2aWRlbzEwPXZpZGVvX2NyZWF0ZShcIm5pY2hpam8uXCIpO1xyXG5cdHZpZGVvMTE9dmlkZW9fY3JlYXRlKFwib3NvLlwiKTtcclxuXHR2aWRlbzEyPXZpZGVvX2NyZWF0ZShcIm9zbzIuXCIpO1xyXG5cdHZpZGVvMTM9dmlkZW9fY3JlYXRlKFwiU2FpbG9ybW9vbi5cIik7XHJcblx0dmlkZW8xND12aWRlb19jcmVhdGUoXCJTYWlsb3Jtb29uMi5cIik7XHJcbiovXHJcblxyXG5cdHZpZGVvX2FjdGlvbnModmlkZW8xKTtcclxuXHR2aWRlb19hY3Rpb25zKHZpZGVvMik7XHJcblx0LypcclxuXHR2aWRlb19hY3Rpb25zKHZpZGVvMyk7XHJcblx0dmlkZW9fYWN0aW9ucyh2aWRlbzQpO1xyXG5cdHZpZGVvX2FjdGlvbnModmlkZW81KTtcclxuXHR2aWRlb19hY3Rpb25zKHZpZGVvNik7XHJcblx0dmlkZW9fYWN0aW9ucyh2aWRlbzcpO1xyXG5cdHZpZGVvX2FjdGlvbnModmlkZW84KTtcclxuXHR2aWRlb19hY3Rpb25zKHZpZGVvOSk7XHJcblx0dmlkZW9fYWN0aW9ucyh2aWRlbzEwKTtcclxuXHR2aWRlb19hY3Rpb25zKHZpZGVvMTEpO1xyXG5cdHZpZGVvX2FjdGlvbnModmlkZW8xMik7XHJcblx0dmlkZW9fYWN0aW9ucyh2aWRlbzEzKTtcclxuXHR2aWRlb19hY3Rpb25zKHZpZGVvMTQpO1xyXG4qL1xyXG5cdFx0Ly/jg5zjgr/jg7PjgpLmirzjgZfjgZ/jgYvjganjgYbjgYtcclxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiICwgS2V5RG93bik7XHJcbn1cclxuZnVuY3Rpb24gdmlkZW9fYWN0aW9ucyhfdmlkZW8pe1xyXG5cdF92aWRlby5hZGRFdmVudExpc3RlbmVyKFwiY2FucGxheXRocm91Z2hcIixmdW5jdGlvbigpe1xyXG5cdFx0YWN0aW9uKCk7XHJcblx0fSx0cnVlKTtcclxuXHRfdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsZnVuY3Rpb24oKXtcclxuXHRcdF92aWRlby5wbGF5KCk7XHJcblx0fSx0cnVlKTtcclxuXHJcbn1cclxuZnVuY3Rpb24gYWN0aW9uKCl7XHJcblx0bG9hZF9udW0rKztcclxuXHQvKlxyXG5cdGlmKGxvYWRfbnVtPT0xNCl7XHJcblx0XHRyZW5kZXIoKTtcclxuXHR9Ki9cclxuXHRpZihsb2FkX251bT09Mil7XHJcblx0XHRyZW5kZXIoKTtcclxuXHR9XHJcbn1cclxuZnVuY3Rpb24gdmlkZW9fY3JlYXRlKF9zcmMpe1xyXG5cdC8v44OT44OH44Kq44Ko44Os44Oh44Oz44OI44KS55Sf5oiQXHJcblx0dmFyIHZpZGVvPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ2aWRlb1wiKTtcclxuXHQvL+ODk+ODh+OCquOCv+OCpOODl+OBruODgeOCp+ODg+OCr1xyXG5cdHZhciB2aWRlb0V4dD1jaGVja1ZpZGVvVHlwZSh2aWRlbyk7XHJcblx0aWYodmlkZW9FeHQ9PT1udWxsKXtcclxuXHRcdGFsZXJ0KFwibm90IHN1cHBvcnRlZFwiKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0Ly/jgr3jg7zjgrnjga7oqq3jgb/ovrzjgb9cclxuXHR2aWRlby5zcmM9X3NyYyt2aWRlb0V4dDtcclxuXHRyZXR1cm4gdmlkZW87XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcigpe1xyXG5cdC8v44OT44OH44Kq77yR44KS5YaN55SfXHJcblx0dmlkZW8xLnBsYXkoKTtcclxuXHRjLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIixtb3VzZU1vdmUsdHJ1ZSk7XHJcblx0dmFyIGdsPWMuZ2V0Q29udGV4dChcIndlYmdsXCIpfHxjLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcblxyXG5cdHZhciB2X3NoYWRlcj1jcmVhdGVfc2hhZGVyKFwidnNcIik7XHJcblx0dmFyIGZfc2hhZGVyPWNyZWF0ZV9zaGFkZXIoXCJmc1wiKTtcclxuXHJcblx0dmFyIHByZz1jcmVhdGVfcHJvZ3JhbSh2X3NoYWRlcixmX3NoYWRlcik7XHJcblx0dmFyIGF0dExvY2F0aW9uPW5ldyBBcnJheSgpO1xyXG5cdGF0dExvY2F0aW9uWzBdPWdsLmdldEF0dHJpYkxvY2F0aW9uKHByZyxcInBvc2l0aW9uXCIpO1xyXG5cdGF0dExvY2F0aW9uWzFdPWdsLmdldEF0dHJpYkxvY2F0aW9uKHByZyxcImNvbG9yXCIpO1xyXG5cdGF0dExvY2F0aW9uWzJdPWdsLmdldEF0dHJpYkxvY2F0aW9uKHByZyxcInRleHR1cmVDb29yZFwiKTtcclxuXHRhdHRMb2NhdGlvblszXT1nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsXCJpbnN0YW5jZVBvc2l0aW9uXCIpO1xyXG5cclxuXHR2YXIgYXR0U3RyaWRlPW5ldyBBcnJheSgpO1xyXG5cdGF0dFN0cmlkZVswXT0zO1xyXG5cdGF0dFN0cmlkZVsxXT00O1xyXG5cdGF0dFN0cmlkZVsyXT0yO1xyXG5cdGF0dFN0cmlkZVszXT0zO1xyXG5cclxuXHR2YXIgdW5pTG9jYXRpb249bmV3IEFycmF5KCk7XHJcblx0dW5pTG9jYXRpb25bMF09Z2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcIm12cE1hdHJpeFwiKTtcclxuXHR1bmlMb2NhdGlvblsxXT1nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLFwidGV4dHVyZVwiKTtcclxuXHJcblx0Ly/jgq3jg6Xjg7zjg5bjg4fjg7zjgr9cclxuXHR2YXIgY3ViZURhdGE9Y3ViZSgxLFsxLjAsMS4wLDEuMCwxLjBdKTtcclxuXHR2YXIgY1Bvc2l0aW9uPWNyZWF0ZV92Ym8oY3ViZURhdGEucCk7XHJcblx0dmFyIGNDb2xvcj1jcmVhdGVfdmJvKGN1YmVEYXRhLmMpO1xyXG5cdHZhciBjVGV4dHVyZUNvb3JkPWNyZWF0ZV92Ym8oY3ViZURhdGEudCk7XHJcblx0dmFyIGNWQk9MaXN0PVtjUG9zaXRpb24sY0NvbG9yLGNUZXh0dXJlQ29vcmRdO1xyXG5cdHZhciBjSW5kZXg9Y3JlYXRlX2libyhjdWJlRGF0YS5pKTtcclxuXHQvKuaLoeW8teapn+iDveOCkuacieWKueWMliovXHJcblx0dmFyIGV4dDtcclxuXHRleHQ9Z2wuZ2V0RXh0ZW5zaW9uKFwiQU5HTEVfaW5zdGFuY2VkX2FycmF5c1wiKTtcclxuXHRpZihleHQ9PW51bGwpe1xyXG5cdFx0YWxlcnQoXCJBTkdMRV9pbnN0YW5jZWRfYXJyYXlzIG5vdCBzdXBwb3J0ZWRcIik7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvL+WQhOOCpOODs+OCueOCv+ODs+OCueOBq+mBqeeUqOOBmeOCi+ODh+ODvOOCv1xyXG5cclxuXHQvL+OCpOODs+OCueOCv+ODs+OCueOBruaVsFxyXG5cdHZhciBpbnN0YW5jZUNvdW50PTEyNTtcclxuXHJcblx0Ly/jgqTjg7Pjgrnjgr/jg7PjgrnnlKjphY3liJdcclxuXHR2YXIgaW5zdGFuY2VQb3NpdGlvbnM9bmV3IEFycmF5KCk7XHJcblxyXG5cdC8v6YWN5YiX55So44Gu44K544OI44Op44Kk44OJXHJcblx0dmFyIG9mZnNldFBvc2l0aW9uPTM7XHJcblxyXG5cdGZvcih2YXIgaT0wO2k8aW5zdGFuY2VDb3VudDtpKyspe1xyXG5cdFx0aW5zdGFuY2VQb3NpdGlvbnNbaSpvZmZzZXRQb3NpdGlvbl09LShpJTUuMCkqMS41KzAuMDtcclxuXHRcdGluc3RhbmNlUG9zaXRpb25zW2kqb2Zmc2V0UG9zaXRpb24rMV09KE1hdGguZmxvb3IoaS81LjApJTUuMCkqMS41KzAuMDtcclxuXHRcdGluc3RhbmNlUG9zaXRpb25zW2kqb2Zmc2V0UG9zaXRpb24rMl09TWF0aC5mbG9vcihpLzI1LjApKjEuNSswLjA7XHJcblx0fVxyXG5cclxuXHQvL+mFjeWIl+OBi+OCiVZCT+OCkueUn+aIkFxyXG5cdHZhciBpUG9zaXRpb249Y3JlYXRlX3ZibyhpbnN0YW5jZVBvc2l0aW9ucyk7XHJcblxyXG5cdC8v44OI44O844Op44K544GuYXR0cmlidXRl6Zai6YCjXHJcblx0c2V0X2F0dHJpYnV0ZShjVkJPTGlzdCxhdHRMb2NhdGlvbixhdHRTdHJpZGUpO1xyXG5cdGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsY0luZGV4KTtcclxuXHJcblx0Ly/jgqTjg7Pjgrnjgr/jg7PjgrnnlKjjga7luqfmqJnkvY3nva5WQk/jgpLmnInlirnjgavjgZnjgotcclxuXHRnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUixpUG9zaXRpb24pO1xyXG5cdGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dExvY2F0aW9uWzNdKTtcclxuXHRnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGF0dExvY2F0aW9uWzNdLGF0dFN0cmlkZVszXSxnbC5GTE9BVCxmYWxzZSwwLDApO1xyXG5cdC8v44Kk44Oz44K544K/44Oz44K555So44Gu5pyJ5Yq55YyW44GX6Zmk5pWw44KS5oyH5a6a44GZ44KLXHJcblx0ZXh0LnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShhdHRMb2NhdGlvblszXSwxKTtcclxuXHQvL+WQhOeoruihjOWIl+OBrueUn+aIkOOBqOWIneacn+WMllxyXG5cdHZhciBtPW5ldyBtYXRJVigpO1xyXG5cdHZhciBtTWF0cml4PW0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcblx0dmFyIHZNYXRyaXg9bS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuXHR2YXIgcE1hdHJpeD1tLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG5cdHZhciB0bXBNYXRyaXg9bS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuXHR2YXIgbXZwTWF0cml4PW0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcblx0dmFyIGludk1hdHJpeD1tLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG5cclxuXHRnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XHJcblx0Z2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XHJcblx0Z2wuZW5hYmxlKGdsLkNVTExfRkFDRSk7XHJcblxyXG5cclxuXHRnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuXHJcblx0dmFyIHZpZGVvVGV4dHVyZTE9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlMj1udWxsO1xyXG5cdC8qXHJcblx0dmFyIHZpZGVvVGV4dHVyZTM9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlND1udWxsO1xyXG5cdHZhciB2aWRlb1RleHR1cmU1PW51bGw7XHJcblx0dmFyIHZpZGVvVGV4dHVyZTY9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlNz1udWxsO1xyXG5cdHZhciB2aWRlb1RleHR1cmU4PW51bGw7XHJcblx0dmFyIHZpZGVvVGV4dHVyZTk9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlMTA9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlMTE9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlMTI9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlMTM9bnVsbDtcclxuXHR2YXIgdmlkZW9UZXh0dXJlMTQ9bnVsbDtcclxuKi9cclxuXHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzEsMSk7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzIsMik7XHJcbi8qXHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzMsMyk7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzQsNCk7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzUsNSk7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzYsNik7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzcsNyk7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzgsOCk7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzksOSk7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzEwLDEwKTtcclxuXHRjcmVhdGVfdGV4dHVyZVZpZGVvKHZpZGVvMTEsMTEpO1xyXG5cdGNyZWF0ZV90ZXh0dXJlVmlkZW8odmlkZW8xMiwxMik7XHJcblx0Y3JlYXRlX3RleHR1cmVWaWRlbyh2aWRlbzEzLDEzKTtcclxuXHRjcmVhdGVfdGV4dHVyZVZpZGVvKHZpZGVvMTQsMTQpO1xyXG4qL1xyXG5cdC8v44Kr44Km44Oz44K/44Gu5a6j6KiAXHJcblx0dmFyIGNvdW50PTA7XHJcblx0dmFyIGNvdW50Mj0wO1xyXG5cclxuXHQvL+aBkuW4uOODq+ODvOODl1xyXG5cdChmdW5jdGlvbiBsb29wKCl7XHJcblx0XHR2YXIgc2NhbGVWYWx1ZT0xLjA7XHJcblx0XHRpZihmZnRfZmxhZz09dHJ1ZSl7XHJcblx0XHRcdGFuYWx5c2VyLmdldEJ5dGVGcmVxdWVuY3lEYXRhKGZyZXF1ZW5jeSk7XHJcblx0XHRcdC8vY29uc29sZS5sb2coZnJlcXVlbmN5WzYwXSk7XHJcblx0XHRcdHNjYWxlVmFsdWU9ZnJlcXVlbmN5WzUwXS81MDArMC42O1xyXG5cdFx0fVxyXG5cdFx0Y291bnQrKztcclxuXHRcdGlmIChjb3VudCAlIDEwID09IDApIHtcclxuXHRcdCAgICBjb3VudDIrKztcclxuXHRcdH1cclxuXHRcdGlmKHNlbGVjdF92aWRlbz09MSl7XHJcblx0XHRcdC8v44OG44Kv44K544OB44Oj44KS5pu05paw44GZ44KLXHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsbnVsbCk7XHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsdmlkZW9UZXh0dXJlMSk7XHJcblx0XHRcdGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwwLGdsLlJHQkEsZ2wuUkdCQSxnbC5VTlNJR05FRF9CWVRFLHZpZGVvMSk7XHJcblx0XHR9ZWxzZSBpZihzZWxlY3RfdmlkZW89PTIpe1xyXG5cdFx0XHQvL+ODhuOCr+OCueODgeODo+OCkuabtOaWsOOBmeOCi1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELG51bGwpO1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELHZpZGVvVGV4dHVyZTIpO1xyXG5cdFx0XHRnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsMCxnbC5SR0JBLGdsLlJHQkEsZ2wuVU5TSUdORURfQllURSx2aWRlbzIpO1xyXG5cdFx0fVxyXG5cdFx0LypcclxuXHRcdGVsc2UgaWYoc2VsZWN0X3ZpZGVvPT0zKXtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCxudWxsKTtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCx2aWRlb1RleHR1cmUzKTtcclxuXHRcdFx0Z2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELDAsZ2wuUkdCQSxnbC5SR0JBLGdsLlVOU0lHTkVEX0JZVEUsdmlkZW8zKTtcclxuXHRcdH1lbHNlIGlmKHNlbGVjdF92aWRlbz09NCl7XHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsbnVsbCk7XHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsdmlkZW9UZXh0dXJlNCk7XHJcblx0XHRcdGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwwLGdsLlJHQkEsZ2wuUkdCQSxnbC5VTlNJR05FRF9CWVRFLHZpZGVvNCk7XHJcblx0XHR9ZWxzZSBpZihzZWxlY3RfdmlkZW89PTUpe1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELG51bGwpO1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELHZpZGVvVGV4dHVyZTUpO1xyXG5cdFx0XHRnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsMCxnbC5SR0JBLGdsLlJHQkEsZ2wuVU5TSUdORURfQllURSx2aWRlbzUpO1xyXG5cdFx0fWVsc2UgaWYoc2VsZWN0X3ZpZGVvPT02KXtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCxudWxsKTtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCx2aWRlb1RleHR1cmU2KTtcclxuXHRcdFx0Z2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELDAsZ2wuUkdCQSxnbC5SR0JBLGdsLlVOU0lHTkVEX0JZVEUsdmlkZW82KTtcclxuXHRcdH1lbHNlIGlmKHNlbGVjdF92aWRlbz09Nyl7XHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsbnVsbCk7XHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsdmlkZW9UZXh0dXJlNyk7XHJcblx0XHRcdGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwwLGdsLlJHQkEsZ2wuUkdCQSxnbC5VTlNJR05FRF9CWVRFLHZpZGVvNyk7XHJcblx0XHR9ZWxzZSBpZihzZWxlY3RfdmlkZW89PTgpe1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELG51bGwpO1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELHZpZGVvVGV4dHVyZTgpO1xyXG5cdFx0XHRnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsMCxnbC5SR0JBLGdsLlJHQkEsZ2wuVU5TSUdORURfQllURSx2aWRlbzgpO1xyXG5cdFx0fWVsc2UgaWYoc2VsZWN0X3ZpZGVvPT05KXtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCxudWxsKTtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCx2aWRlb1RleHR1cmU5KTtcclxuXHRcdFx0Z2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELDAsZ2wuUkdCQSxnbC5SR0JBLGdsLlVOU0lHTkVEX0JZVEUsdmlkZW85KTtcclxuXHRcdH1lbHNlIGlmKHNlbGVjdF92aWRlbz09MTApe1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELG51bGwpO1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELHZpZGVvVGV4dHVyZTEwKTtcclxuXHRcdFx0Z2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELDAsZ2wuUkdCQSxnbC5SR0JBLGdsLlVOU0lHTkVEX0JZVEUsdmlkZW8xMCk7XHJcblx0XHR9ZWxzZSBpZihzZWxlY3RfdmlkZW89PTExKXtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCxudWxsKTtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCx2aWRlb1RleHR1cmUxMSk7XHJcblx0XHRcdGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwwLGdsLlJHQkEsZ2wuUkdCQSxnbC5VTlNJR05FRF9CWVRFLHZpZGVvMTEpO1xyXG5cdFx0fWVsc2UgaWYoc2VsZWN0X3ZpZGVvPT0xMil7XHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsbnVsbCk7XHJcblx0XHRcdGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsdmlkZW9UZXh0dXJlMTIpO1xyXG5cdFx0XHRnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsMCxnbC5SR0JBLGdsLlJHQkEsZ2wuVU5TSUdORURfQllURSx2aWRlbzEyKTtcclxuXHRcdH1lbHNlIGlmKHNlbGVjdF92aWRlbz09MTMpe1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELG51bGwpO1xyXG5cdFx0XHRnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELHZpZGVvVGV4dHVyZTEzKTtcclxuXHRcdFx0Z2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELDAsZ2wuUkdCQSxnbC5SR0JBLGdsLlVOU0lHTkVEX0JZVEUsdmlkZW8xMyk7XHJcblx0XHR9ZWxzZSBpZihzZWxlY3RfdmlkZW89PTE0KXtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCxudWxsKTtcclxuXHRcdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCx2aWRlb1RleHR1cmUxNCk7XHJcblx0XHRcdGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwwLGdsLlJHQkEsZ2wuUkdCQSxnbC5VTlNJR05FRF9CWVRFLHZpZGVvMTQpO1xyXG5cdFx0fSovXHJcblxyXG5cclxuXHRcdC8v44OT44Ol44O8w5fjg5fjg63jgrjjgqfjgq/jgrfjg6fjg7PluqfmqJnlpInmj5vooYzliJdcclxuXHRcdHZhciBleWVQb3NpdGlvbj1uZXcgQXJyYXkoKTtcclxuXHRcdHZhciBjYW1VcERpcmVjdGlvbj1uZXcgQXJyYXkoKTtcclxuXHRcdHEudG9WZWNJSUkoWzAuMCwwLjAsMTUuMF0scXQsZXllUG9zaXRpb24pO1xyXG5cdFx0cS50b1ZlY0lJSShbMC4wLDEuMCwwLjBdLHF0LGNhbVVwRGlyZWN0aW9uKTtcclxuXHRcdG0ubG9va0F0KGV5ZVBvc2l0aW9uLFswLjAsMC4wLDAuMF0sY2FtVXBEaXJlY3Rpb24sdk1hdHJpeCk7XHJcblx0XHRtLnBlcnNwZWN0aXZlKDQ1LGMud2lkdGgvYy5oZWlnaHQsMC4xLDUwLjAscE1hdHJpeCk7XHJcblx0XHRtLm11bHRpcGx5KHBNYXRyaXgsdk1hdHJpeCx0bXBNYXRyaXgpO1xyXG5cclxuXHRcdC8vY2FudmFz44KS5Yid5pyf5YyWXHJcblx0XHR2YXIgaHN2ID0gaHN2YShjb3VudDIgJSAzNjAsIDEsIDEsIDEpO1xyXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoaHN2WzBdLCBoc3ZbMV0sIGhzdlsyXSwgaHN2WzNdKTtcclxuXHRcdGdsLmNsZWFyRGVwdGgoMS4wKTtcclxuXHRcdGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcblx0XHQvL+OCreODpeODvOODluOBruODrOODs+OCv+ODquODs+OCsFxyXG5cdFx0bS5pZGVudGl0eShtTWF0cml4KTtcclxuXHRcdC8vbS5yb3RhdGUobU1hdHJpeCwoY291bnQlMzYwKSpNYXRoLlBJLzE4MCxbMC4wLDEuMCwwLjBdLG1NYXRyaXgpO1xyXG5cdFx0bS50cmFuc2xhdGUobU1hdHJpeCxbMC4wLDAuMCxzcGVlZF0sbU1hdHJpeCk7XHJcblx0XHRtLnNjYWxlKG1NYXRyaXgsW3NjYWxlVmFsdWUsc2NhbGVWYWx1ZSxzY2FsZVZhbHVlXSxtTWF0cml4KTtcclxuXHRcdG0ucm90YXRlKG1NYXRyaXgsTWF0aC5QSSxbMC4wLDAuMCwxLjBdLG1NYXRyaXgpO1xyXG5cdFx0bS5tdWx0aXBseSh0bXBNYXRyaXgsbU1hdHJpeCxtdnBNYXRyaXgpO1xyXG5cdFx0bS5pbnZlcnNlKG1NYXRyaXgsaW52TWF0cml4KTtcclxuXHRcdGdsLnVuaWZvcm1NYXRyaXg0ZnYodW5pTG9jYXRpb25bMF0sZmFsc2UsbXZwTWF0cml4KTtcclxuXHRcdGdsLnVuaWZvcm0xaSh1bmlMb2NhdGlvblsxXSwwKTtcclxuXHJcblx0XHRleHQuZHJhd0VsZW1lbnRzSW5zdGFuY2VkQU5HTEUoZ2wuVFJJQU5HTEVTLGN1YmVEYXRhLmkubGVuZ3RoLGdsLlVOU0lHTkVEX1NIT1JULDAsaW5zdGFuY2VDb3VudCk7XHJcblxyXG5cdFx0Z2wuZmx1c2goKTtcclxuXHRcdC8vcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGEpO1xyXG5cdFx0Ly9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYXJndW1lbnRzLmNhbGxlZSk7XHJcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XHJcblx0XHQvL3NldFRpbWVvdXQoYSwxMDAwLzMwKTtcclxuXHR9KSgpO1xyXG5cclxuXHQvL+OCt+OCp+ODvOODgOOCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5cdGZ1bmN0aW9uIGNyZWF0ZV9zaGFkZXIoaWQpe1xyXG5cdFx0dmFyIHNoYWRlcjtcclxuXHJcblx0XHR2YXIgc2NyaXB0RWxlbWVudD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcblxyXG5cdFx0aWYoIXNjcmlwdEVsZW1lbnQpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0c3dpdGNoKHNjcmlwdEVsZW1lbnQudHlwZSl7XHJcblx0XHRcdGNhc2UgJ3gtc2hhZGVyL3gtdmVydGV4JzpcclxuXHRcdFx0c2hhZGVyPWdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcclxuXHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRjYXNlICd4LXNoYWRlci94LWZyYWdtZW50JzpcclxuXHRcdFx0c2hhZGVyPWdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xyXG5cdFx0XHRicmVhaztcclxuXHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLHNjcmlwdEVsZW1lbnQudGV4dCk7XHJcblxyXG5cdFx0Z2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cdFx0Ly/jgrfjgqfjg7zjg4Djg7zjgYzmraPjgZfjgY/jgrPjg7Pjg5HjgqTjg6vjgZXjgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuXHRcdGlmKGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsZ2wuQ09NUElMRV9TVEFUVVMpKXtcclxuXHRcdFx0cmV0dXJuIHNoYWRlcjtcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRhbGVydChnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY3JlYXRlX3Byb2dyYW0odnMsZnMpe1xyXG5cdFx0Ly/jg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuXHRcdHZhciBwcm9ncmFtPWdsLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcblx0XHRnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSx2cyk7XHJcblx0XHRnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSxmcyk7XHJcblxyXG5cdFx0Z2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XHJcblxyXG5cdFx0aWYoZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLGdsLkxJTktfU1RBVFVTKSl7XHJcblx0XHRcdC8v5oiQ5Yqf44GX44Gm44GE44Gf44KJ44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS5pyJ5Yq544Gr44GZ44KLXHJcblx0XHRcdGdsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XHJcblxyXG5cdFx0XHQvL+ODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkui/lOOBl+OBpue1guS6hlxyXG5cdFx0XHRyZXR1cm4gcHJvZ3JhbTtcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRhbGVydChnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvL1ZCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5cdGZ1bmN0aW9uIGNyZWF0ZV92Ym8oZGF0YSl7XHJcblx0XHR2YXIgdmJvPWdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cdFx0Ly/jg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4lcclxuXHRcdGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLHZibyk7XHJcblx0XHQvL+ODkOODg+ODleOCoeOBq+ODh+ODvOOCv+OCkuOCu+ODg+ODiFxyXG5cdFx0Z2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsbmV3IEZsb2F0MzJBcnJheShkYXRhKSxnbC5TVEFUSUNfRFJBVyk7XHJcblx0XHQvL+ODkOODg+ODleOCoeOBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG5cdFx0Z2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsbnVsbCk7XHJcblxyXG5cdFx0cmV0dXJuIHZibztcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldF9hdHRyaWJ1dGUodmJvLGF0dEwsYXR0Uyl7XHJcblx0XHQvL+W8leaVsOOBqOOBl+OBpuWPl+OBkeWPluOBo+OBn+mFjeWIl+OCkuWHpueQhuOBmeOCi1xyXG5cdFx0Zm9yKHZhciBpIGluIHZibyl7XHJcblx0XHRcdGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLHZib1tpXSk7XHJcblx0XHRcdC8vYXR0cmlidXRlTG9jYXRpb27jgpLmnInlirnjgavjgZnjgotcclxuXHRcdFx0Z2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoYXR0TFtpXSk7XHJcblx0XHRcdC8vYXR0cmlidXRlTG9jYXRpb27jgpLpgJrnn6XjgZfnmbvpjLJcclxuXHRcdFx0Z2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRMW2ldLGF0dFNbaV0sZ2wuRkxPQVQsZmFsc2UsMCwwKTtcclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gY3JlYXRlX2libyhkYXRhKXtcclxuXHRcdHZhciBpYm89Z2wuY3JlYXRlQnVmZmVyKCk7XHJcblx0XHRnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGlibyk7XHJcblx0XHRnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLG5ldyBJbnQxNkFycmF5KGRhdGEpLGdsLlNUQVRJQ19EUkFXKTtcclxuXHRcdGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsbnVsbCk7XHJcblx0XHRyZXR1cm4gaWJvO1xyXG5cdH1cclxuXHQvL3ZpZGVv44Gu44OG44Kv44K544OB44Oj44KS5L2c5oiQXHJcblx0ZnVuY3Rpb24gY3JlYXRlX3RleHR1cmVWaWRlbyhfc291cmNlLF9udW1iZXIpe1xyXG5cdFx0dmFyIHZpZGVvVGV4dHVyZT1nbC5jcmVhdGVUZXh0dXJlKGdsLlRFWFRVUkVfMkQpO1xyXG5cdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCx2aWRlb1RleHR1cmUpO1xyXG5cdFx0Z2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELDAsZ2wuUkdCQSxnbC5SR0JBLGdsLlVOU0lHTkVEX0JZVEUsX3NvdXJjZSk7XHJcblx0XHRnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsZ2wuVEVYVFVSRV9NQUdfRklMVEVSLGdsLkxJTkVBUik7XHJcblx0XHRnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsZ2wuVEVYVFVSRV9NSU5fRklMVEVSLGdsLkxJTkVBUik7XHJcblx0XHRnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsZ2wuVEVYVFVSRV9XUkFQX1MsZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblx0XHRnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsZ2wuVEVYVFVSRV9XUkFQX1QsZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG5cdFx0Z2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCxudWxsKTtcclxuICAgICAgICBzd2l0Y2goX251bWJlcil7XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIHZpZGVvVGV4dHVyZTEgPSB2aWRlb1RleHR1cmU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICAgICAgdmlkZW9UZXh0dXJlMiA9IHZpZGVvVGV4dHVyZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICAgICAgdmlkZW9UZXh0dXJlMyA9IHZpZGVvVGV4dHVyZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgICAgICB2aWRlb1RleHR1cmU0ID0gdmlkZW9UZXh0dXJlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgNTpcclxuICAgICAgICAgICAgICAgIHZpZGVvVGV4dHVyZTUgPSB2aWRlb1RleHR1cmU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSA2OlxyXG4gICAgICAgICAgICAgICAgdmlkZW9UZXh0dXJlNiA9IHZpZGVvVGV4dHVyZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDc6XHJcbiAgICAgICAgICAgICAgICB2aWRlb1RleHR1cmU3ID0gdmlkZW9UZXh0dXJlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgODpcclxuICAgICAgICAgICAgICAgIHZpZGVvVGV4dHVyZTggPSB2aWRlb1RleHR1cmU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSA5OlxyXG4gICAgICAgICAgICAgICAgdmlkZW9UZXh0dXJlOSA9IHZpZGVvVGV4dHVyZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDEwOlxyXG4gICAgICAgICAgICAgICAgdmlkZW9UZXh0dXJlMTAgPSB2aWRlb1RleHR1cmU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxMTpcclxuICAgICAgICAgICAgICAgIHZpZGVvVGV4dHVyZTExID0gdmlkZW9UZXh0dXJlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMTI6XHJcbiAgICAgICAgICAgICAgICB2aWRlb1RleHR1cmUxMiA9IHZpZGVvVGV4dHVyZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDEzOlxyXG4gICAgICAgICAgICAgICAgdmlkZW9UZXh0dXJlMTMgPSB2aWRlb1RleHR1cmU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxNDpcclxuICAgICAgICAgICAgICAgIHZpZGVvVGV4dHVyZTE0ID0gdmlkZW9UZXh0dXJlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7Ki9cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHR9XHJcbn0iXX0=
