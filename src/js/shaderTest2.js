"use strict";
var c,cw,ch,mx,my,gl,run,eCheck;
var startTime;
var time=0.0;
var tempTime=0.0;
var fps=1000/30;
var count=0;
var tUniLocation=[];
var tvAttLocation;
var tvPosition;
var tvIndex;
var tprg;

var attStride = [];
var attLocation =[];
var uniLocation = [];
var VBOList;
var iIndex;
var fBuffer;
var prg;


// 各種行列の生成と初期化
var m = new matIV();
var mMatrix   = m.identity(m.create());
var vMatrix   = m.identity(m.create());
var pMatrix   = m.identity(m.create());
var tmpMatrix = m.identity(m.create());
var mvpMatrix = m.identity(m.create());

window.onload=function(){
	c=document.getElementById("canvas");
	// cw=512;
	// ch=512;
    cw=500;
    ch=300;
	c.width=cw;
	c.height=ch;

	eCheck=document.getElementById("check");

	c.addEventListener("mousemove",mouseMove,true);
	eCheck.addEventListener("change",checkChange,true);

	gl=c.getContext("webgl")||c.getContext("experimental-webgl");

/*---------------shader背景側---------------------*/
	tprg=create_program(gl,create_shader(gl,"tvs"),create_shader(gl,"tfs"));
	run=(tprg!==null);
	if(!run){
		eCheck.checked=false;
	}
	tUniLocation[0]=gl.getUniformLocation(tprg,"time");
	tUniLocation[1]=gl.getUniformLocation(tprg,"mouse");
	tUniLocation[2]=gl.getUniformLocation(tprg,"iResolution");

	var tPosition=[
	-1.0,1.0,0.0,
	1.0,1.0,0.0,
	-1.0,-1.0,0.0,
	1.0,-1.0,0.0,
	];
	var tIndex=[
	0,2,1,
	1,2,3
	];
	tvPosition=create_vbo(gl,tPosition);
	tvIndex=create_ibo(gl,tIndex);
	tvAttLocation=gl.getAttribLocation(tprg,"position");
	
 //    gl.bindBuffer(gl.ARRAY_BUFFER,tvPosition);
	// gl.enableVertexAttribArray(tvAttLocation);
	// gl.vertexAttribPointer(tvAttLocation,3,gl.FLOAT,false,0,0);
	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,tvIndex);

/*------------shaderをテクスチャに貼り付ける--------------*/
    var v_shader = create_shader(gl,'vs');
    var f_shader = create_shader(gl,'fs');
    
    // プログラムオブジェクトの生成とリンク
    prg = create_program(gl,v_shader, f_shader);
    
    // attributeLocationを配列に取得
    
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');
    
    // attributeの要素数を配列に格納
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;
    
    // 頂点の位置
    var position = [
        -1.0,  1.0,  0.0,
         1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    
    // 頂点色
    var color = [
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ];
    
    // テクスチャ座標
    var textureCoord = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    
    // 頂点インデックス
    var index = [
        0, 1, 2,
        3, 2, 1
    ];
    
    // VBOとIBOの生成
    var vPosition     = create_vbo(gl,position);
    var vColor        = create_vbo(gl,color);
    var vTextureCoord = create_vbo(gl,textureCoord);
    VBOList       = [vPosition, vColor, vTextureCoord];
    iIndex        = create_ibo(gl,index);
    
    
    // uniformLocationを配列に取得
    uniLocation[0]  = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1]  = gl.getUniformLocation(prg, 'texture');
    
    // // 各種行列の生成と初期化
    // var m = new matIV();
    // var mMatrix   = m.identity(m.create());
    // var vMatrix   = m.identity(m.create());
    // var pMatrix   = m.identity(m.create());
    // var tmpMatrix = m.identity(m.create());
    // var mvpMatrix = m.identity(m.create());
    
    // ビュー×プロジェクション座標変換行列
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);
    
    // 深度テストを有効にする
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);


    gl.activeTexture(gl.TEXTURE0);

    // フレームバッファオブジェクトの取得
    var fBufferWidth  = 512;
    var fBufferHeight = 512;
    fBuffer = create_framebuffer(gl,fBufferWidth, fBufferHeight);
/*------------------------------------------------------*/


	gl.clearColor(0.0,0.0,0.0,1.0);
	mx=0.5;my=0.5;
	startTime=new Date().getTime();

	render();

};
function render(){
	if(!run){
		return;
	}
	time=(new Date().getTime() - startTime)*0.001;
	count++;
    var rad=(count%360)*Math.PI/180;

    /*--フレームバッファをバインド--*/
    gl.bindFramebuffer(gl.FRAMEBUFFER,fBuffer.f);
    gl.clearColor(0.0,0.0,0.0,1.0);
//    gl.clearDepth(1.0);
//    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(tprg);
    //attributeの登録
    gl.bindBuffer(gl.ARRAY_BUFFER,tvPosition);
    gl.enableVertexAttribArray(tvAttLocation);
    gl.vertexAttribPointer(tvAttLocation,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,tvIndex);

//	console.log(time+tempTime);
	gl.uniform1f(tUniLocation[0],time+tempTime);
	gl.uniform2fv(tUniLocation[1],[mx,my]);
	gl.uniform2fv(tUniLocation[2],[cw,ch]);
	gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
//	gl.flush();
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);


    /*--shader背景を板ポリに写す--*/
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(prg);
    // VBOとIBOの登録
    set_attribute(gl,VBOList, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);

    m.identity(mMatrix);
    m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    //登録
    gl.bindTexture(gl.TEXTURE_2D,fBuffer.t);
    gl.uniform1i(uniLocation[1], 0);
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.flush();

	setTimeout(render,fps);
}
function checkChange(e){
	run=e.currentTarget.checked;
	if(run){
		startTime=new Date().getTime();
		render();
	}else{
		console.log("time"+time);
		console.log("tempTime"+tempTime);
		tempTime+=time;
	}
}
function mouseMove(e){
	mx=e.offsetX/cw;
	my=e.offsetY/ch;
}
// シェーダを生成する関数
function create_shader(_gl,_id){
    // シェーダを格納する変数
    var shader;
    
    // HTMLからscriptタグへの参照を取得
    var scriptElement = document.getElementById(_id);
    
    // scriptタグが存在しない場合は抜ける
    if(!scriptElement){return;}
    
    // scriptタグのtype属性をチェック
    switch(scriptElement.type){
        
        // 頂点シェーダの場合
        case 'x-shader/x-vertex':
            shader = _gl.createShader(_gl.VERTEX_SHADER);
            break;
            
        // フラグメントシェーダの場合
        case 'x-shader/x-fragment':
            shader = _gl.createShader(_gl.FRAGMENT_SHADER);
            break;
        default :
            return;
    }
    
    // 生成されたシェーダにソースを割り当てる
    _gl.shaderSource(shader, scriptElement.text);
    
    // シェーダをコンパイルする
    _gl.compileShader(shader);
    
    // シェーダが正しくコンパイルされたかチェック
    if(_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)){
        
        // 成功していたらシェーダを返して終了
        return shader;
    }else{
        
        // 失敗していたらエラーログをアラートする
        alert(_gl.getShaderInfoLog(shader));
    }
}
// プログラムオブジェクトを生成しシェーダをリンクする関数
function create_program(_gl,_vs, _fs){
    // プログラムオブジェクトの生成
    var program = _gl.createProgram();
    
    // プログラムオブジェクトにシェーダを割り当てる
    _gl.attachShader(program, _vs);
    _gl.attachShader(program, _fs);
    
    // シェーダをリンク
    _gl.linkProgram(program);
    
    // シェーダのリンクが正しく行なわれたかチェック
    if(_gl.getProgramParameter(program, _gl.LINK_STATUS)){
    
        // 成功していたらプログラムオブジェクトを有効にする
        _gl.useProgram(program);
        
        // プログラムオブジェクトを返して終了
        return program;
    }else{
        
        // 失敗していたらエラーログをアラートする
        alert(_gl.getProgramInfoLog(program));
    }
}
// VBOを生成する関数
function create_vbo(_gl,_data){
    // バッファオブジェクトの生成
    var vbo = _gl.createBuffer();
    
    // バッファをバインドする
    _gl.bindBuffer(_gl.ARRAY_BUFFER, vbo);
    
    // バッファにデータをセット
    _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(_data), _gl.STATIC_DRAW);
    
    // バッファのバインドを無効化
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    
    // 生成した VBO を返して終了
    return vbo;
}
// IBOを生成する関数
function create_ibo(_gl,_data){
    // バッファオブジェクトの生成
    var ibo = _gl.createBuffer();
    
    // バッファをバインドする
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, ibo);
    
    // バッファにデータをセット
    _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Int16Array(_data), _gl.STATIC_DRAW);
    
    // バッファのバインドを無効化
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, null);
    
    // 生成したIBOを返して終了
    return ibo;
}
function set_attribute(_gl,_vbo, _attL, _attS){
    // 引数として受け取った配列を処理する
    for(var i in _vbo){
        // バッファをバインドする
        _gl.bindBuffer(_gl.ARRAY_BUFFER, _vbo[i]);
        
        // attributeLocationを有効にする
        _gl.enableVertexAttribArray(_attL[i]);
        
        // attributeLocationを通知し登録する
        _gl.vertexAttribPointer(_attL[i], _attS[i], _gl.FLOAT, false, 0, 0);
    }
}
// フレームバッファをオブジェクトとして生成する関数
function create_framebuffer(_gl,_width, _height){
    // フレームバッファの生成
    var frameBuffer = _gl.createFramebuffer();
    
    // フレームバッファをWebGLにバインド
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, frameBuffer);
    
    // 深度バッファ用レンダーバッファの生成とバインド
    var depthRenderBuffer = _gl.createRenderbuffer();
    _gl.bindRenderbuffer(_gl.RENDERBUFFER, depthRenderBuffer);
    
    // レンダーバッファを深度バッファとして設定
    _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, _width, _height);
    
    // フレームバッファにレンダーバッファを関連付ける
    _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, depthRenderBuffer);
    
    // フレームバッファ用テクスチャの生成
    var fTexture = _gl.createTexture();
    
    // フレームバッファ用のテクスチャをバインド
    _gl.bindTexture(_gl.TEXTURE_2D, fTexture);
    
    // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _width, _height, 0, _gl.RGBA, _gl.UNSIGNED_BYTE, null);
    
    // テクスチャパラメータ
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
    
    // フレームバッファにテクスチャを関連付ける
    _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, fTexture, 0);
    
    // 各種オブジェクトのバインドを解除
    _gl.bindTexture(_gl.TEXTURE_2D, null);
    _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    
    // オブジェクトを返して終了
    return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
}
    
