(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// テクスチャ用変数の宣言
var texture = new Array();
var mx, my, cw, ch;

//フラグ
var AppearBack = new Array();
var DropFromUp = new Array();

window.resize = function () {
    cw = window.innerWidth;
    ch = window.innerHeight;
};
window.onload = function () {
    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    cw = window.innerWidth;
    ch = window.innerHeight;
    c.width = cw;
    c.height = ch;

    //canvas上でマウスが動いたら
    c.addEventListener("mousemove", mouseMove, true);
    // webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    /*-----------------------------背景側-----------------------------*/
    var tprg = create_program(gl, create_shader(gl, "tvs"), create_shader(gl, "tfs"));
    //時間をとめる動作
    // run=(tprg!=null);
    // if(!run){
    //     eCheck.checked=false;
    // }
    var tUniLocation = new Array();
    tUniLocation[0] = gl.getUniformLocation(tprg, "time");
    tUniLocation[1] = gl.getUniformLocation(tprg, "mouse");
    tUniLocation[2] = gl.getUniformLocation(tprg, "iResolution");

    var tPosition = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
    var tIndex = [0, 2, 1, 1, 2, 3];
    var tvPosition = create_vbo(gl, tPosition);
    var tvIndex = create_ibo(gl, tIndex);
    var tvAttLocation = gl.getAttribLocation(tprg, "position");

    /*-----------------------------テクスチャ側---------------------------------------------*/
    // 頂点シェーダとフラグメントシェーダの生成
    var v_shader = create_shader(gl, 'vs');
    var f_shader = create_shader(gl, 'fs');
    // プログラムオブジェクトの生成とリンク
    var prg = create_program(gl, v_shader, f_shader);

    // attributeLocationを配列に取得
    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');
    // attributeの要素数を配列に格納
    var attStride = new Array();
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;
    // 頂点の位置
    var position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
    // 頂点色
    var color = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
    // テクスチャ座標
    var textureCoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    // 頂点インデックス
    var index = [0, 1, 2, 3, 2, 1];
    // VBOとIBOの生成
    var vPosition = create_vbo(gl, position);
    var vColor = create_vbo(gl, color);
    var vTextureCoord = create_vbo(gl, textureCoord);
    var VBOList = [vPosition, vColor, vTextureCoord];
    var iIndex = create_ibo(gl, index);

    // uniformLocationを配列に取得
    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'texture');
    // 各種行列の生成と初期化
    var m = new matIV();
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    // ビュー×プロジェクション座標変換行列
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);
    // 深度テストを有効にする
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // 有効にするテクスチャユニットを指定
    gl.activeTexture(gl.TEXTURE0);

    //テクスチャのy座標
    var posX = new Array();
    //テクスチャのy座標
    var posY = new Array();
    //テクスチャのz座標
    var posZ = new Array();
    //テクスチャ呼ばれたら
    var socket = io();

    //socketのイベントが何回きたかしらべる
    var getnumber = 0;
    //サーバーからデータを受け取る

    socket.on("pushImageFromServer", function (data) {
        console.log(data);
        create_texture(gl, data.imgdata, getnumber);
        /*
        console.log("data.AppearBack"+data.AppearBack);
        console.log("data.DropFromUp"+data.DropFromUp);
        if(typeof data.AppearBack === "undefined"){
            AppearBack[getnumber]=false;
        }else{
            AppearBack[getnumber]=data.AppearBack;
        }
        if(typeof data.DropFromUp === "undefined"){
            console.log("typeof_data.DropFromUp_true");
            DropFromUp[getnumber]=false;
        }else{
            DropFromUp[getnumber]=data.DropFromUp;
        }
        console.log("AppearBack"+AppearBack);
        console.log("DropFromUp"+DropFromUp);
          if(AppearBack[getnumber]){
            posY[getnumber]=0;
            posZ[getnumber]=-105;
        }
        if(DropFromUp[getnumber]){
            posY[getnumber]=4;
            posZ[getnumber]=0;
        }
        console.log(posY);
        console.log(posZ);
        */
        posX[getnumber] = data.x * 5.0;
        posY[getnumber] = data.y * 5.0;
        posZ[getnumber] = 0;
        console.log(getnumber);
        console.log(texture);
        getnumber++;
    });
    // フレームバッファオブジェクトの取得
    var fBufferWidth = cw;
    var fBufferHeight = ch;
    var fBuffer = create_framebuffer(gl, fBufferWidth, fBufferHeight);
    // カウンタの宣言
    var count = 0;
    var count2 = 0;
    mx = 0.5;my = 0.5;
    var startTime = new Date().getTime();
    //ブレンドファンク
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // 恒常ループ
    (function loop() {

        /*-------------------フレームバッファ----------------------*/
        //時間
        var time = (new Date().getTime() - startTime) * 0.001;
        /*--フレームバッファをバインド--*/
        gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(tprg);
        // ブレンディングを無効にする
        gl.disable(gl.BLEND);
        //attributeの登録
        gl.bindBuffer(gl.ARRAY_BUFFER, tvPosition);
        gl.enableVertexAttribArray(tvAttLocation);
        gl.vertexAttribPointer(tvAttLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tvIndex);

        gl.uniform1f(tUniLocation[0], time);
        gl.uniform2fv(tUniLocation[1], [mx, my]);
        gl.uniform2fv(tUniLocation[2], [cw, ch]);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        /*-------------------フレームバッファ----------------------*/

        // canvasを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンタを元にラジアンを算出
        count++;

        // if (count % 10 == 0) {
        //     count2++;
        // }
        var rad = count % 360 * Math.PI / 180;

        /*------------------背景テクスチャ(オフスクリーンレンタリング)---------------------*/
        gl.useProgram(prg);
        // ブレンディングを無効にする
        gl.disable(gl.BLEND);
        // VBOとIBOの登録
        set_attribute(gl, VBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);
        /*移動、回転、拡大縮小*/
        m.identity(mMatrix);
        m.translate(mMatrix, [0.0, 0.0, -95.0], mMatrix);
        m.scale(mMatrix, [100.0, 70.0, 1.0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        //uniformを登録
        gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);
        gl.uniform1i(uniLocation[1], 0);
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        /*テクスチャ*/
        // ブレンディングを有効にする
        gl.enable(gl.BLEND);
        if (texture) {
            /*
                for(var i=0;i<texture.length;i++){
                    if(posZ[i]==7){
                        // カメラより前にすすんだら、配列を減らす処理が微妙
                        texture.shift();
                        posZ.shift();
                        posY.shift();
                        getnumber--;
                        console.log(texture);
                    }
                }*/
            for (var i = 0; i < texture.length; i++) {
                /*
                if(AppearBack[i]){
                    posZ[i]+=0.80;
                }
                if(DropFromUp[i]){
                    posY[i]-=0.40;
                }*/
                posZ[i] -= 1.40;
                //console.log();
                bindPlatePoly(gl, m, mMatrix, rad, tmpMatrix, mvpMatrix, uniLocation, index, i, posX[i], posY[i], posZ[i]);
            }
        }
        // コンテキストの再描画
        gl.flush();

        // ループのために再帰呼び出し
        //setTimeout(loop, 1000 / 30);
        //タブが非アクティブの場合はFPSを落とす
        requestAnimationFrame(loop);
    })();
};
function mouseMove(e) {
    mx = e.offsetX / cw;
    my = e.offsetY / ch;
}
function bindPlatePoly(_gl, _m, _mMatrix, _rad, _tmpMatrix, _mvpMatrix, _uniLocation, _index, _number, _posX, _posY, _posZ) {
    // モデル座標変換行列の生成
    _m.identity(_mMatrix);
    _m.translate(_mMatrix, [_posX, _posY, _posZ], _mMatrix);
    //    _m.rotate(_mMatrix, _rad, [0, 1, 0], _mMatrix);
    _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);

    // テクスチャをバインドする
    _gl.bindTexture(_gl.TEXTURE_2D, texture[_number]);

    // uniform変数にテクスチャを登録
    _gl.uniform1i(_uniLocation[1], 0);

    // uniform変数の登録と描画
    _gl.uniformMatrix4fv(_uniLocation[0], false, _mvpMatrix);
    _gl.drawElements(_gl.TRIANGLES, _index.length, _gl.UNSIGNED_SHORT, 0);
}

// シェーダを生成する関数
function create_shader(_gl, _id) {
    // シェーダを格納する変数
    var shader;

    // HTMLからscriptタグへの参照を取得
    var scriptElement = document.getElementById(_id);

    // scriptタグが存在しない場合は抜ける
    if (!scriptElement) {
        return;
    }

    // scriptタグのtype属性をチェック
    switch (scriptElement.type) {

        // 頂点シェーダの場合
        case 'x-shader/x-vertex':
            shader = _gl.createShader(_gl.VERTEX_SHADER);
            break;

        // フラグメントシェーダの場合
        case 'x-shader/x-fragment':
            shader = _gl.createShader(_gl.FRAGMENT_SHADER);
            break;
        default:
            return;
    }

    // 生成されたシェーダにソースを割り当てる
    _gl.shaderSource(shader, scriptElement.text);

    // シェーダをコンパイルする
    _gl.compileShader(shader);

    // シェーダが正しくコンパイルされたかチェック
    if (_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {

        // 成功していたらシェーダを返して終了
        return shader;
    } else {

        // 失敗していたらエラーログをアラートする
        alert(_gl.getShaderInfoLog(shader));
    }
}
// プログラムオブジェクトを生成しシェーダをリンクする関数
function create_program(_gl, _vs, _fs) {
    // プログラムオブジェクトの生成
    var program = _gl.createProgram();

    // プログラムオブジェクトにシェーダを割り当てる
    _gl.attachShader(program, _vs);
    _gl.attachShader(program, _fs);

    // シェーダをリンク
    _gl.linkProgram(program);

    // シェーダのリンクが正しく行なわれたかチェック
    if (_gl.getProgramParameter(program, _gl.LINK_STATUS)) {

        // 成功していたらプログラムオブジェクトを有効にする
        _gl.useProgram(program);

        // プログラムオブジェクトを返して終了
        return program;
    } else {

        // 失敗していたらエラーログをアラートする
        alert(_gl.getProgramInfoLog(program));
    }
}
// VBOを生成する関数
function create_vbo(_gl, _data) {
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
// VBOをバインドし登録する関数
function set_attribute(_gl, _vbo, _attL, _attS) {
    // 引数として受け取った配列を処理する
    for (var i in _vbo) {
        // バッファをバインドする
        _gl.bindBuffer(_gl.ARRAY_BUFFER, _vbo[i]);

        // attributeLocationを有効にする
        _gl.enableVertexAttribArray(_attL[i]);

        // attributeLocationを通知し登録する
        _gl.vertexAttribPointer(_attL[i], _attS[i], _gl.FLOAT, false, 0, 0);
    }
}
// IBOを生成する関数
function create_ibo(_gl, _data) {
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

// テクスチャを生成する関数
function create_texture(_gl, _source, _n) {
    // イメージオブジェクトの生成
    var img = new Image();

    // データのオンロードをトリガーにする
    img.onload = function () {
        // テクスチャオブジェクトの生成
        var tex = _gl.createTexture();

        // テクスチャをバインドする
        _gl.bindTexture(_gl.TEXTURE_2D, tex);

        // テクスチャへイメージを適用
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, img);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

        // ミップマップを生成
        _gl.generateMipmap(_gl.TEXTURE_2D);

        // テクスチャのバインドを無効化
        _gl.bindTexture(_gl.TEXTURE_2D, null);

        // 生成したテクスチャをグローバル変数に代入
        texture[_n] = tex;
    };

    // イメージオブジェクトのソースを指定
    img.src = _source;
}
// フレームバッファをオブジェクトとして生成する関数
function create_framebuffer(_gl, _width, _height) {
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
    return { f: frameBuffer, d: depthRenderBuffer, t: fTexture };
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBQ0EsSUFBSSxVQUFRLElBQUksS0FBSixFQUFaO0FBQ0EsSUFBSSxFQUFKLEVBQU8sRUFBUCxFQUFVLEVBQVYsRUFBYSxFQUFiOztBQUVBO0FBQ0EsSUFBSSxhQUFXLElBQUksS0FBSixFQUFmO0FBQ0EsSUFBSSxhQUFXLElBQUksS0FBSixFQUFmOztBQUVBLE9BQU8sTUFBUCxHQUFjLFlBQVU7QUFDcEIsU0FBRyxPQUFPLFVBQVY7QUFDQSxTQUFHLE9BQU8sV0FBVjtBQUNILENBSEQ7QUFJQSxPQUFPLE1BQVAsR0FBYyxZQUFVO0FBQ3BCO0FBQ0EsUUFBSSxJQUFJLFNBQVMsY0FBVCxDQUF3QixRQUF4QixDQUFSO0FBQ0EsU0FBRyxPQUFPLFVBQVY7QUFDQSxTQUFHLE9BQU8sV0FBVjtBQUNBLE1BQUUsS0FBRixHQUFVLEVBQVY7QUFDQSxNQUFFLE1BQUYsR0FBVyxFQUFYOztBQUVBO0FBQ0EsTUFBRSxnQkFBRixDQUFtQixXQUFuQixFQUErQixTQUEvQixFQUF5QyxJQUF6QztBQUNBO0FBQ0EsUUFBSSxLQUFLLEVBQUUsVUFBRixDQUFhLE9BQWIsS0FBeUIsRUFBRSxVQUFGLENBQWEsb0JBQWIsQ0FBbEM7O0FBRUo7QUFDSSxRQUFJLE9BQUssZUFBZSxFQUFmLEVBQWtCLGNBQWMsRUFBZCxFQUFpQixLQUFqQixDQUFsQixFQUEwQyxjQUFjLEVBQWQsRUFBaUIsS0FBakIsQ0FBMUMsQ0FBVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFJLGVBQWEsSUFBSSxLQUFKLEVBQWpCO0FBQ0EsaUJBQWEsQ0FBYixJQUFnQixHQUFHLGtCQUFILENBQXNCLElBQXRCLEVBQTJCLE1BQTNCLENBQWhCO0FBQ0EsaUJBQWEsQ0FBYixJ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QWpGLEVBQTJGLENBQTNGOztBQUVBO0FBQ0EsUUFBSSxXQUFKLENBQWdCLElBQUksVUFBcEIsRUFBZ0MsSUFBaEM7QUFDQSxRQUFJLGdCQUFKLENBQXFCLElBQUksWUFBekIsRUFBdUMsSUFBdkM7QUFDQSxRQUFJLGVBQUosQ0FBb0IsSUFBSSxXQUF4QixFQUFxQyxJQUFyQzs7QUFFQTtBQUNBLFdBQU8sRUFBQyxHQUFJLFdBQUwsRUFBa0IsR0FBSSxpQkFBdEIsRUFBeUMsR0FBSSxRQUE3QyxFQUFQO0FBQ0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8g44OG44Kv44K544OB44Oj55So5aSJ5pWw44Gu5a6j6KiAXHJcbnZhciB0ZXh0dXJlPW5ldyBBcnJheSgpO1xyXG52YXIgbXgsbXksY3csY2g7XHJcblxyXG4vL+ODleODqeOCsFxyXG52YXIgQXBwZWFyQmFjaz1uZXcgQXJyYXkoKTtcclxudmFyIERyb3BGcm9tVXA9bmV3IEFycmF5KCk7XHJcblxyXG53aW5kb3cucmVzaXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxufVxyXG53aW5kb3cub25sb2FkPWZ1bmN0aW9uKCl7XHJcbiAgICAvLyBjYW52YXPjgqjjg6zjg6Hjg7Pjg4jjgpLlj5blvpdcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xyXG4gICAgY3c9d2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjaD13aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICBjLndpZHRoID0gY3c7XHJcbiAgICBjLmhlaWdodCA9IGNoO1xyXG5cclxuICAgIC8vY2FudmFz5LiK44Gn44Oe44Km44K544GM5YuV44GE44Gf44KJXHJcbiAgICBjLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIixtb3VzZU1vdmUsdHJ1ZSk7XHJcbiAgICAvLyB3ZWJnbOOCs+ODs+ODhuOCreOCueODiOOCkuWPluW+l1xyXG4gICAgdmFyIGdsID0gYy5nZXRDb250ZXh0KCd3ZWJnbCcpIHx8IGMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t6IOM5pmv5YG0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgdmFyIHRwcmc9Y3JlYXRlX3Byb2dyYW0oZ2wsY3JlYXRlX3NoYWRlcihnbCxcInR2c1wiKSxjcmVhdGVfc2hhZGVyKGdsLFwidGZzXCIpKTtcclxuICAgIC8v5pmC6ZaT44KS44Go44KB44KL5YuV5L2cXHJcbiAgICAvLyBydW49KHRwcmchPW51bGwpO1xyXG4gICAgLy8gaWYoIXJ1bil7XHJcbiAgICAvLyAgICAgZUNoZWNrLmNoZWNrZWQ9ZmFsc2U7XHJcbiAgICAvLyB9XHJcbiAgICB2YXIgdFVuaUxvY2F0aW9uPW5ldyBBcnJheSgpO1xyXG4gICAgdFVuaUxvY2F0aW9uWzBdPWdsLmdldFVuaWZvcm1Mb2NhdGlvbih0cHJnLFwidGltZVwiKTtcclxuICAgIHRVbmlMb2NhdGlvblsxXT1nbC5nZXRVbmlmb3JtTG9jYXRpb24odHByZyxcIm1vdXNlXCIpO1xyXG4gICAgdFVuaUxvY2F0aW9uWzJdPWdsLmdldFVuaWZvcm1Mb2NhdGlvbih0cHJnLFwiaVJlc29sdXRpb25cIik7XHJcblxyXG4gICAgdmFyIHRQb3NpdGlvbj1bXHJcbiAgICAtMS4wLDEuMCwwLjAsXHJcbiAgICAxLjAsMS4wLDAuMCxcclxuICAgIC0xLjAsLTEuMCwwLjAsXHJcbiAgICAxLjAsLTEuMCwwLjAsXHJcbiAgICBdXHJcbiAgICB2YXIgdEluZGV4PVtcclxuICAgIDAsMiwxLFxyXG4gICAgMSwyLDNcclxuICAgIF1cclxuICAgIHZhciB0dlBvc2l0aW9uPWNyZWF0ZV92Ym8oZ2wsdFBvc2l0aW9uKTtcclxuICAgIHZhciB0dkluZGV4PWNyZWF0ZV9pYm8oZ2wsdEluZGV4KTtcclxuICAgIHZhciB0dkF0dExvY2F0aW9uPWdsLmdldEF0dHJpYkxvY2F0aW9uKHRwcmcsXCJwb3NpdGlvblwiKTtcclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS3jg4bjgq/jgrnjg4Hjg6PlgbQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgLy8g6aCC54K544K344Kn44O844OA44Go44OV44Op44Kw44Oh44Oz44OI44K344Kn44O844OA44Gu55Sf5oiQXHJcbiAgICB2YXIgdl9zaGFkZXIgPSBjcmVhdGVfc2hhZGVyKGdsLCd2cycpO1xyXG4gICAgdmFyIGZfc2hhZGVyID0gY3JlYXRlX3NoYWRlcihnbCwnZnMnKTtcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkOOBqOODquODs+OCr1xyXG4gICAgdmFyIHByZyA9IGNyZWF0ZV9wcm9ncmFtKGdsLHZfc2hhZGVyLCBmX3NoYWRlcik7XHJcblxyXG4gICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLphY3liJfjgavlj5blvpdcclxuICAgIHZhciBhdHRMb2NhdGlvbiA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0TG9jYXRpb25bMF0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdwb3NpdGlvbicpO1xyXG4gICAgYXR0TG9jYXRpb25bMV0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdjb2xvcicpO1xyXG4gICAgYXR0TG9jYXRpb25bMl0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXh0dXJlQ29vcmQnKTtcclxuICAgIC8vIGF0dHJpYnV0ZeOBruimgee0oOaVsOOCkumFjeWIl+OBq+agvOe0jVxyXG4gICAgdmFyIGF0dFN0cmlkZSA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDQ7XHJcbiAgICBhdHRTdHJpZGVbMl0gPSAyO1xyXG4gICAgLy8g6aCC54K544Gu5L2N572uXHJcbiAgICB2YXIgcG9zaXRpb24gPSBbXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAwLjAsXHJcbiAgICAgICAgIDEuMCwgLTEuMCwgIDAuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueiJslxyXG4gICAgdmFyIGNvbG9yID0gW1xyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOODhuOCr+OCueODgeODo+W6p+aomVxyXG4gICAgdmFyIHRleHR1cmVDb29yZCA9IFtcclxuICAgICAgICAwLjAsIDAuMCxcclxuICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgdmFyIGluZGV4ID0gW1xyXG4gICAgICAgIDAsIDEsIDIsXHJcbiAgICAgICAgMywgMiwgMVxyXG4gICAgXTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueUn+aIkFxyXG4gICAgdmFyIHZQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKGdsLHBvc2l0aW9uKTtcclxuICAgIHZhciB2Q29sb3IgICAgICAgID0gY3JlYXRlX3ZibyhnbCxjb2xvcik7XHJcbiAgICB2YXIgdlRleHR1cmVDb29yZCA9IGNyZWF0ZV92Ym8oZ2wsdGV4dHVyZUNvb3JkKTtcclxuICAgIHZhciBWQk9MaXN0ICAgICAgID0gW3ZQb3NpdGlvbiwgdkNvbG9yLCB2VGV4dHVyZUNvb3JkXTtcclxuICAgIHZhciBpSW5kZXggICAgICAgID0gY3JlYXRlX2libyhnbCxpbmRleCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybUxvY2F0aW9u44KS6YWN5YiX44Gr5Y+W5b6XXHJcbiAgICB2YXIgdW5pTG9jYXRpb24gPSBuZXcgQXJyYXkoKTtcclxuICAgIHVuaUxvY2F0aW9uWzBdICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICdtdnBNYXRyaXgnKTtcclxuICAgIHVuaUxvY2F0aW9uWzFdICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd0ZXh0dXJlJyk7XHJcbiAgICAvLyDlkITnqK7ooYzliJfjga7nlJ/miJDjgajliJ3mnJ/ljJZcclxuICAgIHZhciBtID0gbmV3IG1hdElWKCk7XHJcbiAgICB2YXIgbU1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB2TWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHBNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdG1wTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBtdnBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgLy8g44OT44Ol44O8w5fjg5fjg63jgrjjgqfjgq/jgrfjg6fjg7PluqfmqJnlpInmj5vooYzliJdcclxuICAgIG0ubG9va0F0KFswLjAsIDAuMCwgNS4wXSwgWzAsIDAsIDBdLCBbMCwgMSwgMF0sIHZNYXRyaXgpO1xyXG4gICAgbS5wZXJzcGVjdGl2ZSg0NSwgYy53aWR0aCAvIGMuaGVpZ2h0LCAwLjEsIDEwMCwgcE1hdHJpeCk7XHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcbiAgICAvLyDmt7Hluqbjg4bjgrnjg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcclxuICAgIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xyXG4gICAgLy8g5pyJ5Yq544Gr44GZ44KL44OG44Kv44K544OB44Oj44Om44OL44OD44OI44KS5oyH5a6aXHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NYPW5ldyBBcnJheSgpO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga555bqn5qiZXHJcbiAgICB2YXIgcG9zWT1uZXcgQXJyYXkoKTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueuW6p+aomVxyXG4gICAgdmFyIHBvc1o9bmV3IEFycmF5KCk7XHJcbiAgICAvL+ODhuOCr+OCueODgeODo+WRvOOBsOOCjOOBn+OCiVxyXG4gICAgdmFyIHNvY2tldCA9aW8oKTtcclxuXHJcbiAgICAvL3NvY2tldOOBruOCpOODmeODs+ODiOOBjOS9leWbnuOBjeOBn+OBi+OBl+OCieOBueOCi1xyXG4gICAgdmFyIGdldG51bWJlcj0wO1xyXG4gICAgLy/jgrXjg7zjg5Djg7zjgYvjgonjg4fjg7zjgr/jgpLlj5fjgZHlj5bjgotcclxuXHJcbiAgICBzb2NrZXQub24oXCJwdXNoSW1hZ2VGcm9tU2VydmVyXCIsZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgY3JlYXRlX3RleHR1cmUoZ2wsZGF0YS5pbWdkYXRhLGdldG51bWJlcik7XHJcbiAgICAgICAgLypcclxuICAgICAgICBjb25zb2xlLmxvZyhcImRhdGEuQXBwZWFyQmFja1wiK2RhdGEuQXBwZWFyQmFjayk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJkYXRhLkRyb3BGcm9tVXBcIitkYXRhLkRyb3BGcm9tVXApO1xyXG4gICAgICAgIGlmKHR5cGVvZiBkYXRhLkFwcGVhckJhY2sgPT09IFwidW5kZWZpbmVkXCIpe1xyXG4gICAgICAgICAgICBBcHBlYXJCYWNrW2dldG51bWJlcl09ZmFsc2U7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIEFwcGVhckJhY2tbZ2V0bnVtYmVyXT1kYXRhLkFwcGVhckJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGVvZiBkYXRhLkRyb3BGcm9tVXAgPT09IFwidW5kZWZpbmVkXCIpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInR5cGVvZl9kYXRhLkRyb3BGcm9tVXBfdHJ1ZVwiKTtcclxuICAgICAgICAgICAgRHJvcEZyb21VcFtnZXRudW1iZXJdPWZhbHNlO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBEcm9wRnJvbVVwW2dldG51bWJlcl09ZGF0YS5Ecm9wRnJvbVVwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhcIkFwcGVhckJhY2tcIitBcHBlYXJCYWNrKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRyb3BGcm9tVXBcIitEcm9wRnJvbVVwKTtcclxuXHJcbiAgICAgICAgaWYoQXBwZWFyQmFja1tnZXRudW1iZXJdKXtcclxuICAgICAgICAgICAgcG9zWVtnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgICAgIHBvc1pbZ2V0bnVtYmVyXT0tMTA1O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihEcm9wRnJvbVVwW2dldG51bWJlcl0pe1xyXG4gICAgICAgICAgICBwb3NZW2dldG51bWJlcl09NDtcclxuICAgICAgICAgICAgcG9zWltnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHBvc1kpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHBvc1opO1xyXG4gICAgICAgICovXHJcbiAgICAgICAgcG9zWFtnZXRudW1iZXJdPWRhdGEueCo1LjA7XHJcbiAgICAgICAgcG9zWVtnZXRudW1iZXJdPWRhdGEueSo1LjA7XHJcbiAgICAgICAgcG9zWltnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2V0bnVtYmVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0dXJlKTtcclxuICAgICAgICBnZXRudW1iZXIrKztcclxuXHJcbiAgICB9KTtcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBruWPluW+l1xyXG4gICAgdmFyIGZCdWZmZXJXaWR0aCAgPSBjdztcclxuICAgIHZhciBmQnVmZmVySGVpZ2h0ID0gY2g7XHJcbiAgICB2YXIgZkJ1ZmZlciA9IGNyZWF0ZV9mcmFtZWJ1ZmZlcihnbCxmQnVmZmVyV2lkdGgsIGZCdWZmZXJIZWlnaHQpO1xyXG4gICAgLy8g44Kr44Km44Oz44K/44Gu5a6j6KiAXHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdmFyIGNvdW50Mj0wO1xyXG4gICAgbXg9MC41O215PTAuNTtcclxuICAgIHZhciBzdGFydFRpbWU9bmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAvL+ODluODrOODs+ODieODleOCoeODs+OCr1xyXG4gICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSxnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcclxuICAgIC8vIOaBkuW4uOODq+ODvOODl1xyXG4gICAgKGZ1bmN0aW9uIGxvb3AoKXtcclxuXHJcbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0t44OV44Os44O844Og44OQ44OD44OV44KhLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbiAgICAgICAgLy/mmYLplpNcclxuICAgICAgICB2YXIgdGltZT0obmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpKjAuMDAxO1xyXG4gICAgICAgIC8qLS3jg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4ktLSovXHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLGZCdWZmZXIuZik7XHJcbiAgICAgICAgZ2wuY2xlYXJDb2xvcigwLjAsMC4wLDAuMCwxLjApO1xyXG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICBnbC51c2VQcm9ncmFtKHRwcmcpO1xyXG4gICAgICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkueEoeWKueOBq+OBmeOCi1xyXG4gICAgICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xyXG4gICAgICAgIC8vYXR0cmlidXRl44Gu55m76YyyXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsdHZQb3NpdGlvbik7XHJcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodHZBdHRMb2NhdGlvbik7XHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih0dkF0dExvY2F0aW9uLDMsZ2wuRkxPQVQsZmFsc2UsMCwwKTtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLHR2SW5kZXgpO1xyXG5cclxuICAgICAgICBnbC51bmlmb3JtMWYodFVuaUxvY2F0aW9uWzBdLHRpbWUpO1xyXG4gICAgICAgIGdsLnVuaWZvcm0yZnYodFVuaUxvY2F0aW9uWzFdLFtteCxteV0pO1xyXG4gICAgICAgIGdsLnVuaWZvcm0yZnYodFVuaUxvY2F0aW9uWzJdLFtjdyxjaF0pO1xyXG4gICAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsNixnbC5VTlNJR05FRF9TSE9SVCwwKTtcclxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsbnVsbCk7XHJcbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0t44OV44Os44O844Og44OQ44OD44OV44KhLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gICAgICAgIC8vIGNhbnZhc+OCkuWIneacn+WMllxyXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgICAgICBnbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICAvLyDjgqvjgqbjg7Pjgr/jgpLlhYPjgavjg6njgrjjgqLjg7PjgpLnrpflh7pcclxuICAgICAgICBjb3VudCsrO1xyXG5cclxuICAgICAgICAvLyBpZiAoY291bnQgJSAxMCA9PSAwKSB7XHJcbiAgICAgICAgLy8gICAgIGNvdW50MisrO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICB2YXIgcmFkID0gKGNvdW50ICUgMzYwKSAqIE1hdGguUEkgLyAxODA7XHJcblxyXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0t6IOM5pmv44OG44Kv44K544OB44OjKOOCquODleOCueOCr+ODquODvOODs+ODrOODs+OCv+ODquODs+OCsCktLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgICAgIGdsLnVzZVByb2dyYW0ocHJnKTtcclxuICAgICAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLnhKHlirnjgavjgZnjgotcclxuICAgICAgICBnbC5kaXNhYmxlKGdsLkJMRU5EKTtcclxuICAgICAgICAvLyBWQk/jgahJQk/jga7nmbvpjLJcclxuICAgICAgICBzZXRfYXR0cmlidXRlKGdsLFZCT0xpc3QsIGF0dExvY2F0aW9uLCBhdHRTdHJpZGUpO1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlJbmRleCk7XHJcbi8q56e75YuV44CB5Zue6Lui44CB5ouh5aSn57iu5bCPKi9cclxuICAgICAgICBtLmlkZW50aXR5KG1NYXRyaXgpO1xyXG4gICAgICAgIG0udHJhbnNsYXRlKG1NYXRyaXgsWzAuMCwwLjAsLTk1LjBdLG1NYXRyaXgpO1xyXG4gICAgICAgIG0uc2NhbGUobU1hdHJpeCxbMTAwLjAsNzAuMCwxLjBdLG1NYXRyaXgpO1xyXG4gICAgICAgIG0ubXVsdGlwbHkodG1wTWF0cml4LCBtTWF0cml4LCBtdnBNYXRyaXgpO1xyXG4gICAgICAgIC8vdW5pZm9ybeOCkueZu+mMslxyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsZkJ1ZmZlci50KTtcclxuICAgICAgICBnbC51bmlmb3JtMWkodW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYodW5pTG9jYXRpb25bMF0sIGZhbHNlLCBtdnBNYXRyaXgpO1xyXG4gICAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsIDYsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICAgICAgLyrjg4bjgq/jgrnjg4Hjg6MqL1xyXG4gICAgICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XHJcbiAgICAgICBpZih0ZXh0dXJlKXtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgICBmb3IodmFyIGk9MDtpPHRleHR1cmUubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihwb3NaW2ldPT03KXtcclxuICAgICAgICAgICAgICAgICAgICAvLyDjgqvjg6Hjg6njgojjgorliY3jgavjgZnjgZnjgpPjgaDjgonjgIHphY3liJfjgpLmuJvjgonjgZnlh6bnkIbjgYzlvq7lpplcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zWi5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc1kuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBnZXRudW1iZXItLTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0ZXh0dXJlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgZm9yKHZhciBpPTA7aTx0ZXh0dXJlLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICBpZihBcHBlYXJCYWNrW2ldKXtcclxuICAgICAgICAgICAgICAgIHBvc1pbaV0rPTAuODA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoRHJvcEZyb21VcFtpXSl7XHJcbiAgICAgICAgICAgICAgICBwb3NZW2ldLT0wLjQwO1xyXG4gICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgcG9zWltpXS09MS40MDtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygpO1xyXG4gICAgICAgICAgICBiaW5kUGxhdGVQb2x5KGdsLG0sbU1hdHJpeCxyYWQsdG1wTWF0cml4LG12cE1hdHJpeCx1bmlMb2NhdGlvbixpbmRleCxpLHBvc1hbaV0scG9zWVtpXSxwb3NaW2ldKTtcclxuICAgICAgICAgICB9XHJcbiAgICAgICB9XHJcbiAgICAgICAgLy8g44Kz44Oz44OG44Kt44K544OI44Gu5YaN5o+P55S7XHJcbiAgICAgICAgZ2wuZmx1c2goKTtcclxuXHJcbiAgICAgICAgLy8g44Or44O844OX44Gu44Gf44KB44Gr5YaN5biw5ZG844Gz5Ye644GXXHJcbiAgICAgICAgLy9zZXRUaW1lb3V0KGxvb3AsIDEwMDAgLyAzMCk7XHJcbiAgICAgICAgLy/jgr/jg5bjgYzpnZ7jgqLjgq/jg4bjgqPjg5bjga7loLTlkIjjga9GUFPjgpLokL3jgajjgZlcclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XHJcbiAgICB9KSgpO1xyXG5cclxufTtcclxuZnVuY3Rpb24gbW91c2VNb3ZlKGUpe1xyXG4gICAgbXg9ZS5vZmZzZXRYL2N3O1xyXG4gICAgbXk9ZS5vZmZzZXRZL2NoO1xyXG59XHJcbmZ1bmN0aW9uIGJpbmRQbGF0ZVBvbHkoX2dsLF9tLF9tTWF0cml4LF9yYWQsX3RtcE1hdHJpeCxfbXZwTWF0cml4LF91bmlMb2NhdGlvbixfaW5kZXgsX251bWJlcixfcG9zWCxfcG9zWSxfcG9zWil7XHJcbiAgICAvLyDjg6Ljg4fjg6vluqfmqJnlpInmj5vooYzliJfjga7nlJ/miJBcclxuICAgIF9tLmlkZW50aXR5KF9tTWF0cml4KTtcclxuICAgIF9tLnRyYW5zbGF0ZShfbU1hdHJpeCxbX3Bvc1gsX3Bvc1ksX3Bvc1pdLF9tTWF0cml4KTtcclxuLy8gICAgX20ucm90YXRlKF9tTWF0cml4LCBfcmFkLCBbMCwgMSwgMF0sIF9tTWF0cml4KTtcclxuICAgIF9tLm11bHRpcGx5KF90bXBNYXRyaXgsIF9tTWF0cml4LCBfbXZwTWF0cml4KTtcclxuICAgIFxyXG4gICAgLy8g44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIHRleHR1cmVbX251bWJlcl0pO1xyXG4gICAgXHJcbiAgICAvLyB1bmlmb3Jt5aSJ5pWw44Gr44OG44Kv44K544OB44Oj44KS55m76YyyXHJcbiAgIF9nbC51bmlmb3JtMWkoX3VuaUxvY2F0aW9uWzFdLCAwKTtcclxuXHJcbiAgICAvLyB1bmlmb3Jt5aSJ5pWw44Gu55m76Yyy44Go5o+P55S7XHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfdW5pTG9jYXRpb25bMF0sIGZhbHNlLCBfbXZwTWF0cml4KTtcclxuICAgIF9nbC5kcmF3RWxlbWVudHMoX2dsLlRSSUFOR0xFUywgX2luZGV4Lmxlbmd0aCwgX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuICAgIFxyXG59XHJcblxyXG4vLyDjgrfjgqfjg7zjg4DjgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3NoYWRlcihfZ2wsX2lkKXtcclxuICAgIC8vIOOCt+OCp+ODvOODgOOCkuagvOe0jeOBmeOCi+WkieaVsFxyXG4gICAgdmFyIHNoYWRlcjtcclxuICAgIFxyXG4gICAgLy8gSFRNTOOBi+OCiXNjcmlwdOOCv+OCsOOBuOOBruWPgueFp+OCkuWPluW+l1xyXG4gICAgdmFyIHNjcmlwdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChfaWQpO1xyXG4gICAgXHJcbiAgICAvLyBzY3JpcHTjgr/jgrDjgYzlrZjlnKjjgZfjgarjgYTloLTlkIjjga/mipzjgZHjgotcclxuICAgIGlmKCFzY3JpcHRFbGVtZW50KXtyZXR1cm47fVxyXG4gICAgXHJcbiAgICAvLyBzY3JpcHTjgr/jgrDjga50eXBl5bGe5oCn44KS44OB44Kn44OD44KvXHJcbiAgICBzd2l0Y2goc2NyaXB0RWxlbWVudC50eXBlKXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDpoILngrnjgrfjgqfjg7zjg4Djga7loLTlkIhcclxuICAgICAgICBjYXNlICd4LXNoYWRlci94LXZlcnRleCc6XHJcbiAgICAgICAgICAgIHNoYWRlciA9IF9nbC5jcmVhdGVTaGFkZXIoX2dsLlZFUlRFWF9TSEFERVIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy8g44OV44Op44Kw44Oh44Oz44OI44K344Kn44O844OA44Gu5aC05ZCIXHJcbiAgICAgICAgY2FzZSAneC1zaGFkZXIveC1mcmFnbWVudCc6XHJcbiAgICAgICAgICAgIHNoYWRlciA9IF9nbC5jcmVhdGVTaGFkZXIoX2dsLkZSQUdNRU5UX1NIQURFUik7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQgOlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIOeUn+aIkOOBleOCjOOBn+OCt+OCp+ODvOODgOOBq+OCveODvOOCueOCkuWJsuOCiuW9k+OBpuOCi1xyXG4gICAgX2dsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNjcmlwdEVsZW1lbnQudGV4dCk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOCkuOCs+ODs+ODkeOCpOODq+OBmeOCi1xyXG4gICAgX2dsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44GM5q2j44GX44GP44Kz44Oz44OR44Kk44Or44GV44KM44Gf44GL44OB44Kn44OD44KvXHJcbiAgICBpZihfZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgX2dsLkNPTVBJTEVfU1RBVFVTKSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5oiQ5Yqf44GX44Gm44GE44Gf44KJ44K344Kn44O844OA44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgcmV0dXJuIHNoYWRlcjtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOWkseaVl+OBl+OBpuOBhOOBn+OCieOCqOODqeODvOODreOCsOOCkuOCouODqeODvOODiOOBmeOCi1xyXG4gICAgICAgIGFsZXJ0KF9nbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xyXG4gICAgfVxyXG59XHJcbi8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkueUn+aIkOOBl+OCt+OCp+ODvOODgOOCkuODquODs+OCr+OBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfcHJvZ3JhbShfZ2wsX3ZzLCBfZnMpe1xyXG4gICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICB2YXIgcHJvZ3JhbSA9IF9nbC5jcmVhdGVQcm9ncmFtKCk7XHJcbiAgICBcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBq+OCt+OCp+ODvOODgOOCkuWJsuOCiuW9k+OBpuOCi1xyXG4gICAgX2dsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBfdnMpO1xyXG4gICAgX2dsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBfZnMpO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgpLjg6rjg7Pjgq9cclxuICAgIF9nbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44Gu44Oq44Oz44Kv44GM5q2j44GX44GP6KGM44Gq44KP44KM44Gf44GL44OB44Kn44OD44KvXHJcbiAgICBpZihfZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBfZ2wuTElOS19TVEFUVVMpKXtcclxuICAgIFxyXG4gICAgICAgIC8vIOaIkOWKn+OBl+OBpuOBhOOBn+OCieODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgICAgIF9nbC51c2VQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5aSx5pWX44GX44Gm44GE44Gf44KJ44Ko44Op44O844Ot44Kw44KS44Ki44Op44O844OI44GZ44KLXHJcbiAgICAgICAgYWxlcnQoX2dsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pKTtcclxuICAgIH1cclxufVxyXG4vLyBWQk/jgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3ZibyhfZ2wsX2RhdGEpe1xyXG4gICAgLy8g44OQ44OD44OV44Kh44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICB2YXIgdmJvID0gX2dsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsIHZibyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBq+ODh+ODvOOCv+OCkuOCu+ODg+ODiFxyXG4gICAgX2dsLmJ1ZmZlckRhdGEoX2dsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShfZGF0YSksIF9nbC5TVEFUSUNfRFJBVyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkFSUkFZX0JVRkZFUiwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOeUn+aIkOOBl+OBnyBWQk8g44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICByZXR1cm4gdmJvO1xyXG59XHJcbi8vIFZCT+OCkuODkOOCpOODs+ODieOBl+eZu+mMsuOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlKF9nbCxfdmJvLCBfYXR0TCwgX2F0dFMpe1xyXG4gICAgLy8g5byV5pWw44Go44GX44Gm5Y+X44GR5Y+W44Gj44Gf6YWN5YiX44KS5Yem55CG44GZ44KLXHJcbiAgICBmb3IodmFyIGkgaW4gX3Zibyl7XHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgX2dsLmJpbmRCdWZmZXIoX2dsLkFSUkFZX0JVRkZFUiwgX3Zib1tpXSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLmnInlirnjgavjgZnjgotcclxuICAgICAgICBfZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoX2F0dExbaV0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGF0dHJpYnV0ZUxvY2F0aW9u44KS6YCa55+l44GX55m76Yyy44GZ44KLXHJcbiAgICAgICAgX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoX2F0dExbaV0sIF9hdHRTW2ldLCBfZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuICAgIH1cclxufVxyXG4vLyBJQk/jgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX2libyhfZ2wsX2RhdGEpe1xyXG4gICAgLy8g44OQ44OD44OV44Kh44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICB2YXIgaWJvID0gX2dsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaWJvKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gr44OH44O844K/44KS44K744OD44OIXHJcbiAgICBfZ2wuYnVmZmVyRGF0YShfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBJbnQxNkFycmF5KF9kYXRhKSwgX2dsLlNUQVRJQ19EUkFXKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xyXG4gICAgXHJcbiAgICAvLyDnlJ/miJDjgZfjgZ9JQk/jgpLov5TjgZfjgabntYLkuoZcclxuICAgIHJldHVybiBpYm87XHJcbn1cclxuXHJcbi8vIOODhuOCr+OCueODgeODo+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfdGV4dHVyZShfZ2wsX3NvdXJjZSxfbil7XHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgIFxyXG4gICAgLy8g44OH44O844K/44Gu44Kq44Oz44Ot44O844OJ44KS44OI44Oq44Ks44O844Gr44GZ44KLXHJcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgICAgICB2YXIgdGV4ID0gX2dsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIHRleCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44G444Kk44Oh44O844K444KS6YGp55SoXHJcbiAgICAgICAgX2dsLnRleEltYWdlMkQoX2dsLlRFWFRVUkVfMkQsIDAsIF9nbC5SR0JBLCBfZ2wuUkdCQSwgX2dsLlVOU0lHTkVEX0JZVEUsIGltZyk7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUixfZ2wuTElORUFSKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NSU5fRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX1dSQVBfUyxfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9ULF9nbC5DTEFNUF9UT19FREdFKTtcclxuXHJcbiAgICAgICAgLy8g44Of44OD44OX44Oe44OD44OX44KS55Sf5oiQXHJcbiAgICAgICAgX2dsLmdlbmVyYXRlTWlwbWFwKF9nbC5URVhUVVJFXzJEKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgICAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOeUn+aIkOOBl+OBn+ODhuOCr+OCueODgeODo+OCkuOCsOODreODvOODkOODq+WkieaVsOOBq+S7o+WFpVxyXG4gICAgICAgIHRleHR1cmVbX25dID0gdGV4O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu44K944O844K544KS5oyH5a6aXHJcbiAgICBpbWcuc3JjID0gX3NvdXJjZTtcclxufVxyXG4vLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLjgqrjg5bjgrjjgqfjgq/jg4jjgajjgZfjgabnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX2ZyYW1lYnVmZmVyKF9nbCxfd2lkdGgsIF9oZWlnaHQpe1xyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44Gu55Sf5oiQXHJcbiAgICB2YXIgZnJhbWVCdWZmZXIgPSBfZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44KSV2ViR0zjgavjg5DjgqTjg7Pjg4lcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBmcmFtZUJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOa3seW6puODkOODg+ODleOCoeeUqOODrOODs+ODgOODvOODkOODg+ODleOCoeOBrueUn+aIkOOBqOODkOOCpOODs+ODiVxyXG4gICAgdmFyIGRlcHRoUmVuZGVyQnVmZmVyID0gX2dsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgX2dsLmJpbmRSZW5kZXJidWZmZXIoX2dsLlJFTkRFUkJVRkZFUiwgZGVwdGhSZW5kZXJCdWZmZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqHjgpLmt7Hluqbjg5Djg4Pjg5XjgqHjgajjgZfjgaboqK3lrppcclxuICAgIF9nbC5yZW5kZXJidWZmZXJTdG9yYWdlKF9nbC5SRU5ERVJCVUZGRVIsIF9nbC5ERVBUSF9DT01QT05FTlQxNiwgX3dpZHRoLCBfaGVpZ2h0KTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44Gr44Os44Oz44OA44O844OQ44OD44OV44Kh44KS6Zai6YCj5LuY44GR44KLXHJcbiAgICBfZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBfZ2wuREVQVEhfQVRUQUNITUVOVCwgX2dsLlJFTkRFUkJVRkZFUiwgZGVwdGhSZW5kZXJCdWZmZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHnlKjjg4bjgq/jgrnjg4Hjg6Pjga7nlJ/miJBcclxuICAgIHZhciBmVGV4dHVyZSA9IF9nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOOBruODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODiVxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBmVGV4dHVyZSk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOOBruODhuOCr+OCueODgeODo+OBq+OCq+ODqeODvOeUqOOBruODoeODouODqumgmOWfn+OCkueiuuS/nVxyXG4gICAgX2dsLnRleEltYWdlMkQoX2dsLlRFWFRVUkVfMkQsIDAsIF9nbC5SR0JBLCBfd2lkdGgsIF9oZWlnaHQsIDAsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+ODkeODqeODoeODvOOCv1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX01BR19GSUxURVIsIF9nbC5MSU5FQVIpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX01JTl9GSUxURVIsIF9nbC5MSU5FQVIpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX1dSQVBfUywgX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX1dSQVBfVCwgX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgavjg4bjgq/jgrnjg4Hjg6PjgpLplqLpgKPku5jjgZHjgotcclxuICAgIF9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChfZ2wuRlJBTUVCVUZGRVIsIF9nbC5DT0xPUl9BVFRBQ0hNRU5UMCwgX2dsLlRFWFRVUkVfMkQsIGZUZXh0dXJlLCAwKTtcclxuICAgIFxyXG4gICAgLy8g5ZCE56iu44Kq44OW44K444Kn44Kv44OI44Gu44OQ44Kk44Oz44OJ44KS6Kej6ZmkXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgX2dsLmJpbmRSZW5kZXJidWZmZXIoX2dsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XHJcbiAgICBfZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOOCquODluOCuOOCp+OCr+ODiOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIHtmIDogZnJhbWVCdWZmZXIsIGQgOiBkZXB0aFJlbmRlckJ1ZmZlciwgdCA6IGZUZXh0dXJlfTtcclxufVxyXG4gICAgXHJcbiJdfQ==
