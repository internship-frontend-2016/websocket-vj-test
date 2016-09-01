"use strict";
var count=0;
var speed=2;
//var rad=0;
function KeyDown(e){
    if(e.keyCode==37){
        //左
         count-=speed;
         if(count%2==1){
            speed++;
            console.log(speed);
         }
        //rad++;
    }else if(e.keyCode==39){
        //右
        count++;
    }
}
window.onload = function(){
    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    c.width = 256*2;
    c.height = 256*2;
    document.addEventListener("keydown" , KeyDown);
    // webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    // 頂点シェーダとフラグメントシェーダの生成
    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');
    
    // プログラムオブジェクトの生成とリンク
    var prg = create_program(v_shader, f_shader);
    
    // attributeLocationを配列に取得
    var attLocation = [];
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');
    
    // attributeの要素数を配列に格納
    var attStride = [];
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;

// 球体モデル

    var earthData     = sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0]);
    var ePosition     = create_vbo(earthData.p);
    var eColor        = create_vbo(earthData.c);
    var eTextureCoord = create_vbo(earthData.t);
    var eVBOList      = [ePosition,eColor, eTextureCoord];
    var eIndex        = create_ibo(earthData.i);

    // /// VBOとIBOの登録
    // set_attribute(eVBOList, attLocation, attStride);
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);
    
    // uniformLocationを配列に取得
    var uniLocation = [];
    uniLocation[0]  = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1]  = gl.getUniformLocation(prg, 'texture');
    
    // ブラーフィルター用シェーダ-start----------------------------------------
    
    // 頂点シェーダとフラグメントシェーダ、プログラムオブジェクトの生成
    v_shader = create_shader('bvs');
    f_shader = create_shader('bfs');
    var bPrg = create_program(v_shader, f_shader);
    
    // attributeLocationを配列に取得
    var bAttLocation = [];
    bAttLocation[0] = gl.getAttribLocation(bPrg, 'position');
    bAttLocation[1] = gl.getAttribLocation(bPrg, 'color');
    
    // attributeの要素数を配列に格納
    var bAttStride = [];
    bAttStride[0] = 3;
    bAttStride[1] = 4;
    
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
    
    // 頂点インデックス
    var index = [
        0, 1, 2,
        3, 2, 1
    ];
    
    // VBOとIBOの生成
    var vPosition     = create_vbo(position);
    var vColor        = create_vbo(color);
    var vVBOList      = [vPosition, vColor];
    var vIndex        = create_ibo(index);
    
    // uniformLocationを配列に取得
    var bUniLocation = [];
    bUniLocation[0] = gl.getUniformLocation(bPrg, 'mvpMatrix');
    bUniLocation[1] = gl.getUniformLocation(bPrg, 'texture');
    bUniLocation[2] = gl.getUniformLocation(bPrg, 'useBlur');
    
    // ブラーフィルター用-end--------------------------------------------------





    // 各種行列の生成と初期化
    var m = new matIV();
    var mMatrix   = m.identity(m.create());
    var vMatrix   = m.identity(m.create());
    var pMatrix   = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    
    // // ビュー×プロジェクション座標変換行列
    // m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    // m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    // m.multiply(pMatrix, vMatrix, tmpMatrix);
    
    // 深度テストを有効にする
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    // 有効にするテクスチャユニットを指定
    gl.activeTexture(gl.TEXTURE0);
    
    // テクスチャ用変数の宣言
    var texture = null;
    
    // テクスチャを生成
    create_texture('../img/test.jpg');
    
    // フレームバッファオブジェクトの取得
    var fBufferWidth  = 256*2;
    var fBufferHeight = 256*2;
    var fBuffer = create_framebuffer(fBufferWidth, fBufferHeight);
    // カウンタの宣言
//    var count = 0;
    var useBlur=true;
    // 恒常ループ
    (function loop(){
                // フレームバッファをバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
        // canvasを初期化
        gl.clearColor(1.0, 0.0, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(prg);
        /// VBOとIBOの登録
        set_attribute(eVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);

        // カウンタを元にラジアンを算出
//        count++;
        var rad = (count % 360) * Math.PI / 180;
        // ビュー×プロジェクション座標変換行列
        m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
        m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);
        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // モデル座標変換行列の生成
        m.identity(mMatrix);
        m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
        //m.scale(mMatrix, [80.0, 80.0, 80.0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        // uniform変数の登録と描画
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        // uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[1], 0);

        gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);
        // フレームバッファのバインドを解除
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);



        // canvasを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // プログラムオブジェクトの有効化(シェーダの切り替え)
        gl.useProgram(bPrg);
        
        
        // 板ポリゴンのVBOとIBOをセット
        set_attribute(vVBOList, bAttLocation, bAttStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
        
        // フレームバッファに描き込んだ内容をテクスチャとして適用
        gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);
        
        // ビュー×プロジェクション座標変換行列(正射影)
        m.lookAt([0.0, 0.0, 0.5], [0.0, 0.0, 0.0], [0, 1, 0], vMatrix);
        m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1, pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);
        
        // 板ポリゴンをレンダリング
        m.identity(mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        gl.uniformMatrix4fv(bUniLocation[0], false, mvpMatrix);
        gl.uniform1i(bUniLocation[1], 0);
        gl.uniform1i(bUniLocation[2], useBlur);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
        // コンテキストの再描画
        gl.flush();
        
        // ループのために再帰呼び出し
        //setTimeout(loop, 1000 / 30);
        requestAnimationFrame(loop);
    })();
    
    // シェーダを生成する関数
    function create_shader(id){
        // シェーダを格納する変数
        var shader;
        
        // HTMLからscriptタグへの参照を取得
        var scriptElement = document.getElementById(id);
        
        // scriptタグが存在しない場合は抜ける
        if(!scriptElement){return;}
        
        // scriptタグのtype属性をチェック
        switch(scriptElement.type){
            
            // 頂点シェーダの場合
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
                
            // フラグメントシェーダの場合
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default :
                return;
        }
        
        // 生成されたシェーダにソースを割り当てる
        gl.shaderSource(shader, scriptElement.text);
        
        // シェーダをコンパイルする
        gl.compileShader(shader);
        
        // シェーダが正しくコンパイルされたかチェック
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            
            // 成功していたらシェーダを返して終了
            return shader;
        }else{
            
            // 失敗していたらエラーログをアラートする
            alert(gl.getShaderInfoLog(shader));
        }
    }
    
    // プログラムオブジェクトを生成しシェーダをリンクする関数
    function create_program(vs, fs){
        // プログラムオブジェクトの生成
        var program = gl.createProgram();
        
        // プログラムオブジェクトにシェーダを割り当てる
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        
        // シェーダをリンク
        gl.linkProgram(program);
        
        // シェーダのリンクが正しく行なわれたかチェック
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        
            // 成功していたらプログラムオブジェクトを有効にする
            gl.useProgram(program);
            
            // プログラムオブジェクトを返して終了
            return program;
        }else{
            
            // 失敗していたらエラーログをアラートする
            alert(gl.getProgramInfoLog(program));
        }
    }
    
    // VBOを生成する関数
    function create_vbo(data){
        // バッファオブジェクトの生成
        var vbo = gl.createBuffer();
        
        // バッファをバインドする
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        
        // バッファにデータをセット
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        
        // バッファのバインドを無効化
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // 生成した VBO を返して終了
        return vbo;
    }
    
    // VBOをバインドし登録する関数
    function set_attribute(vbo, attL, attS){
        // 引数として受け取った配列を処理する
        for(var i in vbo){
            // バッファをバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
            
            // attributeLocationを有効にする
            gl.enableVertexAttribArray(attL[i]);
            
            // attributeLocationを通知し登録する
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }
    
    // IBOを生成する関数
    function create_ibo(data){
        // バッファオブジェクトの生成
        var ibo = gl.createBuffer();
        
        // バッファをバインドする
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        
        // バッファにデータをセット
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        
        // バッファのバインドを無効化
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
        // 生成したIBOを返して終了
        return ibo;
    }
    
    // テクスチャを生成する関数
    function create_texture(source){
        // イメージオブジェクトの生成
        var img = new Image();
        
        // データのオンロードをトリガーにする
        img.onload = function(){
            // テクスチャオブジェクトの生成
            var tex = gl.createTexture();
            
            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, tex);
            // テクスチャへイメージを適用
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

            // テクスチャへイメージを適用
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            
            // ミップマップを生成
            gl.generateMipmap(gl.TEXTURE_2D);
            
            // テクスチャのバインドを無効化
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            // 生成したテクスチャをグローバル変数に代入
            texture = tex;
        };
        
        // イメージオブジェクトのソースを指定
        img.src = source;
    }
        // フレームバッファをオブジェクトとして生成する関数
    function create_framebuffer(width, height){
        // フレームバッファの生成
        var frameBuffer = gl.createFramebuffer();
        
        // フレームバッファをWebGLにバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        
        // 深度バッファ用レンダーバッファの生成とバインド
        var depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        
        // レンダーバッファを深度バッファとして設定
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        
        // フレームバッファにレンダーバッファを関連付ける
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
        
        // フレームバッファ用テクスチャの生成
        var fTexture = gl.createTexture();
        
        // フレームバッファ用のテクスチャをバインド
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        
        // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        // テクスチャパラメータ
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // フレームバッファにテクスチャを関連付ける
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        
        // 各種オブジェクトのバインドを解除
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        // オブジェクトを返して終了
        return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
    }
};