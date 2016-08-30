(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// テクスチャ用変数の宣言
var texture = new Array();
var mx, my, cw, ch;

//フラグ
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
            // console.log(posZ[1]);
            // for(var i=0;i<texture.length;i++){
            //     if(posZ[i]==-100){
            //         /*うまくできていない*/
            //         // カメラより前にすすんだら、配列を減らす処理が微妙
            //         console.log("削除してます");
            //         texture.shift();
            //         posX.shift();
            //         posY.shift();
            //         posZ.shift();
            //         getnumber--;
            //         console.log(texture);
            //     }
            // }
            console.log(posZ);
            for (var i = 0; i < texture.length; i++) {
                // console.log(posZ[1]);
                posZ[i] -= 1.40;
                if (posZ[i] < -100) {
                    /*うまくできていない*/
                    // カメラより前にすすんだら、配列を減らす処理が微妙
                    console.log("削除してます");
                    texture.shift();
                    posX.shift();
                    posY.shift();
                    posZ.shift();
                    getnumber--;
                    console.log(texture);
                }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBQ0EsSUFBSSxVQUFRLElBQUksS0FBSixFQUFaO0FBQ0EsSUFBSSxFQUFKLEVBQU8sRUFBUCxFQUFVLEVBQVYsRUFBYSxFQUFiOztBQUVBO0FBQ0EsT0FBTyxNQUFQLEdBQWMsWUFBVTtBQUNwQixTQUFHLE9BQU8sVUFBVjtBQUNBLFNBQUcsT0FBTyxXQUFWO0FBQ0gsQ0FIRDtBQUlBLE9BQU8sTUFBUCxHQUFjLFlBQVU7QUFDcEI7QUFDQSxRQUFJLElBQUksU0FBUyxjQUFULENBQXdCLFFBQXhCLENBQVI7QUFDQSxTQUFHLE9BQU8sVUFBVjtBQUNBLFNBQUcsT0FBTyxXQUFWO0FBQ0EsTUFBRSxLQUFGLEdBQVUsRUFBVjtBQUNBLE1BQUUsTUFBRixHQUFXLEVBQVg7O0FBRUE7QUFDQSxNQUFFLGdCQUFGLENBQW1CLFdBQW5CLEVBQStCLFNBQS9CLEVBQXlDLElBQXpDO0FBQ0E7QUFDQSxRQUFJLEtBQUssRUFBRSxVQUFGLENBQWEsT0FBYixLQUF5QixFQUFFLFVBQUYsQ0FBYSxvQkFBYixDQUFsQzs7QUFFSjtBQUNJLFFBQUksT0FBSyxlQUFlLEVBQWYsRUFBa0IsY0FBYyxFQUFkLEVBQWlCLEtBQWpCLENBQWxCLEVBQTBDLGNBQWMsRUFBZCxFQUFpQixLQUFqQixDQUExQyxDQUFUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQUksZUFBYSxJQUFJLEtBQUosRUFBakI7QUFDQSxpQkFBYSxDQUFiLElBQWdCLEdBQUcsa0JBQUgsQ0FBc0IsSUFBdEIsRUFBMkIsTUFBM0IsQ0FBaEI7QUFDQSxpQkFBYSxDQUFiLElBQWdCLEdBQUcsa0JBQUgsQ0FBc0IsSUFBdEIsRUFBMkIsT0FBM0IsQ0FBaEI7QUFDQSxpQkFBYSxDQUFi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QUExRDtBQUNBLFFBQUksYUFBSixDQUFrQixJQUFJLFVBQXRCLEVBQWtDLElBQUksY0FBdEMsRUFBc0QsSUFBSSxhQUExRDs7QUFFQTtBQUNBLFFBQUksb0JBQUosQ0FBeUIsSUFBSSxXQUE3QixFQUEwQyxJQUFJLGlCQUE5QyxFQUFpRSxJQUFJLFVBQXJFLEVBQWlGLFFBQWpGLEVBQTJGLENBQTNGOztBQUVBO0FBQ0EsUUFBSSxXQUFKLENBQWdCLElBQUksVUFBcEIsRUFBZ0MsSUFBaEM7QUFDQSxRQUFJLGdCQUFKLENBQXFCLElBQUksWUFBekIsRUFBdUMsSUFBdkM7QUFDQSxRQUFJLGVBQUosQ0FBb0IsSUFBSSxXQUF4QixFQUFxQyxJQUFyQzs7QUFFQTtBQUNBLFdBQU8sRUFBQyxHQUFJLFdBQUwsRUFBa0IsR0FBSSxpQkFBdEIsRUFBeUMsR0FBSSxRQUE3QyxFQUFQO0FBQ0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8g44OG44Kv44K544OB44Oj55So5aSJ5pWw44Gu5a6j6KiAXHJcbnZhciB0ZXh0dXJlPW5ldyBBcnJheSgpO1xyXG52YXIgbXgsbXksY3csY2g7XHJcblxyXG4vL+ODleODqeOCsFxyXG53aW5kb3cucmVzaXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxufVxyXG53aW5kb3cub25sb2FkPWZ1bmN0aW9uKCl7XHJcbiAgICAvLyBjYW52YXPjgqjjg6zjg6Hjg7Pjg4jjgpLlj5blvpdcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xyXG4gICAgY3c9d2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjaD13aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICBjLndpZHRoID0gY3c7XHJcbiAgICBjLmhlaWdodCA9IGNoO1xyXG5cclxuICAgIC8vY2FudmFz5LiK44Gn44Oe44Km44K544GM5YuV44GE44Gf44KJXHJcbiAgICBjLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIixtb3VzZU1vdmUsdHJ1ZSk7XHJcbiAgICAvLyB3ZWJnbOOCs+ODs+ODhuOCreOCueODiOOCkuWPluW+l1xyXG4gICAgdmFyIGdsID0gYy5nZXRDb250ZXh0KCd3ZWJnbCcpIHx8IGMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t6IOM5pmv5YG0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgdmFyIHRwcmc9Y3JlYXRlX3Byb2dyYW0oZ2wsY3JlYXRlX3NoYWRlcihnbCxcInR2c1wiKSxjcmVhdGVfc2hhZGVyKGdsLFwidGZzXCIpKTtcclxuICAgIC8v5pmC6ZaT44KS44Go44KB44KL5YuV5L2cXHJcbiAgICAvLyBydW49KHRwcmchPW51bGwpO1xyXG4gICAgLy8gaWYoIXJ1bil7XHJcbiAgICAvLyAgICAgZUNoZWNrLmNoZWNrZWQ9ZmFsc2U7XHJcbiAgICAvLyB9XHJcbiAgICB2YXIgdFVuaUxvY2F0aW9uPW5ldyBBcnJheSgpO1xyXG4gICAgdFVuaUxvY2F0aW9uWzBdPWdsLmdldFVuaWZvcm1Mb2NhdGlvbih0cHJnLFwidGltZVwiKTtcclxuICAgIHRVbmlMb2NhdGlvblsxXT1nbC5nZXRVbmlmb3JtTG9jYXRpb24odHByZyxcIm1vdXNlXCIpO1xyXG4gICAgdFVuaUxvY2F0aW9uWzJdPWdsLmdldFVuaWZvcm1Mb2NhdGlvbih0cHJnLFwiaVJlc29sdXRpb25cIik7XHJcblxyXG4gICAgdmFyIHRQb3NpdGlvbj1bXHJcbiAgICAtMS4wLDEuMCwwLjAsXHJcbiAgICAxLjAsMS4wLDAuMCxcclxuICAgIC0xLjAsLTEuMCwwLjAsXHJcbiAgICAxLjAsLTEuMCwwLjAsXHJcbiAgICBdXHJcbiAgICB2YXIgdEluZGV4PVtcclxuICAgIDAsMiwxLFxyXG4gICAgMSwyLDNcclxuICAgIF1cclxuICAgIHZhciB0dlBvc2l0aW9uPWNyZWF0ZV92Ym8oZ2wsdFBvc2l0aW9uKTtcclxuICAgIHZhciB0dkluZGV4PWNyZWF0ZV9pYm8oZ2wsdEluZGV4KTtcclxuICAgIHZhciB0dkF0dExvY2F0aW9uPWdsLmdldEF0dHJpYkxvY2F0aW9uKHRwcmcsXCJwb3NpdGlvblwiKTtcclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS3jg4bjgq/jgrnjg4Hjg6PlgbQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgLy8g6aCC54K544K344Kn44O844OA44Go44OV44Op44Kw44Oh44Oz44OI44K344Kn44O844OA44Gu55Sf5oiQXHJcbiAgICB2YXIgdl9zaGFkZXIgPSBjcmVhdGVfc2hhZGVyKGdsLCd2cycpO1xyXG4gICAgdmFyIGZfc2hhZGVyID0gY3JlYXRlX3NoYWRlcihnbCwnZnMnKTtcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkOOBqOODquODs+OCr1xyXG4gICAgdmFyIHByZyA9IGNyZWF0ZV9wcm9ncmFtKGdsLHZfc2hhZGVyLCBmX3NoYWRlcik7XHJcblxyXG4gICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLphY3liJfjgavlj5blvpdcclxuICAgIHZhciBhdHRMb2NhdGlvbiA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0TG9jYXRpb25bMF0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdwb3NpdGlvbicpO1xyXG4gICAgYXR0TG9jYXRpb25bMV0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdjb2xvcicpO1xyXG4gICAgYXR0TG9jYXRpb25bMl0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXh0dXJlQ29vcmQnKTtcclxuICAgIC8vIGF0dHJpYnV0ZeOBruimgee0oOaVsOOCkumFjeWIl+OBq+agvOe0jVxyXG4gICAgdmFyIGF0dFN0cmlkZSA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDQ7XHJcbiAgICBhdHRTdHJpZGVbMl0gPSAyO1xyXG4gICAgLy8g6aCC54K544Gu5L2N572uXHJcbiAgICB2YXIgcG9zaXRpb24gPSBbXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAwLjAsXHJcbiAgICAgICAgIDEuMCwgLTEuMCwgIDAuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueiJslxyXG4gICAgdmFyIGNvbG9yID0gW1xyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOODhuOCr+OCueODgeODo+W6p+aomVxyXG4gICAgdmFyIHRleHR1cmVDb29yZCA9IFtcclxuICAgICAgICAwLjAsIDAuMCxcclxuICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgdmFyIGluZGV4ID0gW1xyXG4gICAgICAgIDAsIDEsIDIsXHJcbiAgICAgICAgMywgMiwgMVxyXG4gICAgXTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueUn+aIkFxyXG4gICAgdmFyIHZQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKGdsLHBvc2l0aW9uKTtcclxuICAgIHZhciB2Q29sb3IgICAgICAgID0gY3JlYXRlX3ZibyhnbCxjb2xvcik7XHJcbiAgICB2YXIgdlRleHR1cmVDb29yZCA9IGNyZWF0ZV92Ym8oZ2wsdGV4dHVyZUNvb3JkKTtcclxuICAgIHZhciBWQk9MaXN0ICAgICAgID0gW3ZQb3NpdGlvbiwgdkNvbG9yLCB2VGV4dHVyZUNvb3JkXTtcclxuICAgIHZhciBpSW5kZXggICAgICAgID0gY3JlYXRlX2libyhnbCxpbmRleCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybUxvY2F0aW9u44KS6YWN5YiX44Gr5Y+W5b6XXHJcbiAgICB2YXIgdW5pTG9jYXRpb24gPSBuZXcgQXJyYXkoKTtcclxuICAgIHVuaUxvY2F0aW9uWzBdICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICdtdnBNYXRyaXgnKTtcclxuICAgIHVuaUxvY2F0aW9uWzFdICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd0ZXh0dXJlJyk7XHJcbiAgICAvLyDlkITnqK7ooYzliJfjga7nlJ/miJDjgajliJ3mnJ/ljJZcclxuICAgIHZhciBtID0gbmV3IG1hdElWKCk7XHJcbiAgICB2YXIgbU1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB2TWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHBNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdG1wTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBtdnBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgLy8g44OT44Ol44O8w5fjg5fjg63jgrjjgqfjgq/jgrfjg6fjg7PluqfmqJnlpInmj5vooYzliJdcclxuICAgIG0ubG9va0F0KFswLjAsIDAuMCwgNS4wXSwgWzAsIDAsIDBdLCBbMCwgMSwgMF0sIHZNYXRyaXgpO1xyXG4gICAgbS5wZXJzcGVjdGl2ZSg0NSwgYy53aWR0aCAvIGMuaGVpZ2h0LCAwLjEsIDEwMCwgcE1hdHJpeCk7XHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcbiAgICAvLyDmt7Hluqbjg4bjgrnjg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcclxuICAgIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xyXG4gICAgLy8g5pyJ5Yq544Gr44GZ44KL44OG44Kv44K544OB44Oj44Om44OL44OD44OI44KS5oyH5a6aXHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NYPW5ldyBBcnJheSgpO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga555bqn5qiZXHJcbiAgICB2YXIgcG9zWT1uZXcgQXJyYXkoKTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueuW6p+aomVxyXG4gICAgdmFyIHBvc1o9bmV3IEFycmF5KCk7XHJcbiAgICAvL+ODhuOCr+OCueODgeODo+WRvOOBsOOCjOOBn+OCiVxyXG4gICAgdmFyIHNvY2tldCA9aW8oKTtcclxuXHJcbiAgICAvL3NvY2tldOOBruOCpOODmeODs+ODiOOBjOS9leWbnuOBjeOBn+OBi+OBl+OCieOBueOCi1xyXG4gICAgdmFyIGdldG51bWJlcj0wO1xyXG4gICAgLy/jgrXjg7zjg5Djg7zjgYvjgonjg4fjg7zjgr/jgpLlj5fjgZHlj5bjgotcclxuXHJcbiAgICBzb2NrZXQub24oXCJwdXNoSW1hZ2VGcm9tU2VydmVyXCIsZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgY3JlYXRlX3RleHR1cmUoZ2wsZGF0YS5pbWdkYXRhLGdldG51bWJlcik7XHJcbiAgICAgICAgcG9zWFtnZXRudW1iZXJdPWRhdGEueCo1LjA7XHJcbiAgICAgICAgcG9zWVtnZXRudW1iZXJdPWRhdGEueSo1LjA7XHJcbiAgICAgICAgcG9zWltnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2V0bnVtYmVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0dXJlKTtcclxuICAgICAgICBnZXRudW1iZXIrKztcclxuXHJcbiAgICB9KTtcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBruWPluW+l1xyXG4gICAgdmFyIGZCdWZmZXJXaWR0aCAgPSBjdztcclxuICAgIHZhciBmQnVmZmVySGVpZ2h0ID0gY2g7XHJcbiAgICB2YXIgZkJ1ZmZlciA9IGNyZWF0ZV9mcmFtZWJ1ZmZlcihnbCxmQnVmZmVyV2lkdGgsIGZCdWZmZXJIZWlnaHQpO1xyXG4gICAgLy8g44Kr44Km44Oz44K/44Gu5a6j6KiAXHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdmFyIGNvdW50Mj0wO1xyXG4gICAgbXg9MC41O215PTAuNTtcclxuICAgIHZhciBzdGFydFRpbWU9bmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAvL+ODluODrOODs+ODieODleOCoeODs+OCr1xyXG4gICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSxnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcclxuICAgIC8vIOaBkuW4uOODq+ODvOODl1xyXG4gICAgKGZ1bmN0aW9uIGxvb3AoKXtcclxuXHJcbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0t44OV44Os44O844Og44OQ44OD44OV44KhLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbiAgICAgICAgLy/mmYLplpNcclxuICAgICAgICB2YXIgdGltZT0obmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpKjAuMDAxO1xyXG4gICAgICAgIC8qLS3jg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4ktLSovXHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLGZCdWZmZXIuZik7XHJcbiAgICAgICAgZ2wuY2xlYXJDb2xvcigwLjAsMC4wLDAuMCwxLjApO1xyXG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICBnbC51c2VQcm9ncmFtKHRwcmcpO1xyXG4gICAgICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkueEoeWKueOBq+OBmeOCi1xyXG4gICAgICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xyXG4gICAgICAgIC8vYXR0cmlidXRl44Gu55m76YyyXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsdHZQb3NpdGlvbik7XHJcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodHZBdHRMb2NhdGlvbik7XHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih0dkF0dExvY2F0aW9uLDMsZ2wuRkxPQVQsZmFsc2UsMCwwKTtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLHR2SW5kZXgpO1xyXG5cclxuICAgICAgICBnbC51bmlmb3JtMWYodFVuaUxvY2F0aW9uWzBdLHRpbWUpO1xyXG4gICAgICAgIGdsLnVuaWZvcm0yZnYodFVuaUxvY2F0aW9uWzFdLFtteCxteV0pO1xyXG4gICAgICAgIGdsLnVuaWZvcm0yZnYodFVuaUxvY2F0aW9uWzJdLFtjdyxjaF0pO1xyXG4gICAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsNixnbC5VTlNJR05FRF9TSE9SVCwwKTtcclxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsbnVsbCk7XHJcbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0t44OV44Os44O844Og44OQ44OD44OV44KhLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gICAgICAgIC8vIGNhbnZhc+OCkuWIneacn+WMllxyXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgICAgICBnbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICAvLyDjgqvjgqbjg7Pjgr/jgpLlhYPjgavjg6njgrjjgqLjg7PjgpLnrpflh7pcclxuICAgICAgICBjb3VudCsrO1xyXG5cclxuICAgICAgICAvLyBpZiAoY291bnQgJSAxMCA9PSAwKSB7XHJcbiAgICAgICAgLy8gICAgIGNvdW50MisrO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICB2YXIgcmFkID0gKGNvdW50ICUgMzYwKSAqIE1hdGguUEkgLyAxODA7XHJcblxyXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0t6IOM5pmv44OG44Kv44K544OB44OjKOOCquODleOCueOCr+ODquODvOODs+ODrOODs+OCv+ODquODs+OCsCktLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgICAgIGdsLnVzZVByb2dyYW0ocHJnKTtcclxuICAgICAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLnhKHlirnjgavjgZnjgotcclxuICAgICAgICBnbC5kaXNhYmxlKGdsLkJMRU5EKTtcclxuICAgICAgICAvLyBWQk/jgahJQk/jga7nmbvpjLJcclxuICAgICAgICBzZXRfYXR0cmlidXRlKGdsLFZCT0xpc3QsIGF0dExvY2F0aW9uLCBhdHRTdHJpZGUpO1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlJbmRleCk7XHJcbi8q56e75YuV44CB5Zue6Lui44CB5ouh5aSn57iu5bCPKi9cclxuICAgICAgICBtLmlkZW50aXR5KG1NYXRyaXgpO1xyXG4gICAgICAgIG0udHJhbnNsYXRlKG1NYXRyaXgsWzAuMCwwLjAsLTk1LjBdLG1NYXRyaXgpO1xyXG4gICAgICAgIG0uc2NhbGUobU1hdHJpeCxbMTAwLjAsNzAuMCwxLjBdLG1NYXRyaXgpO1xyXG4gICAgICAgIG0ubXVsdGlwbHkodG1wTWF0cml4LCBtTWF0cml4LCBtdnBNYXRyaXgpO1xyXG4gICAgICAgIC8vdW5pZm9ybeOCkueZu+mMslxyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsZkJ1ZmZlci50KTtcclxuICAgICAgICBnbC51bmlmb3JtMWkodW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYodW5pTG9jYXRpb25bMF0sIGZhbHNlLCBtdnBNYXRyaXgpO1xyXG4gICAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsIDYsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICAgICAgLyrjg4bjgq/jgrnjg4Hjg6MqL1xyXG4gICAgICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XHJcbiAgICAgICBpZih0ZXh0dXJlKXtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocG9zWlsxXSk7XHJcbiAgICAgICAgICAgIC8vIGZvcih2YXIgaT0wO2k8dGV4dHVyZS5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgLy8gICAgIGlmKHBvc1pbaV09PS0xMDApe1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIC8q44GG44G+44GP44Gn44GN44Gm44GE44Gq44GEKi9cclxuICAgICAgICAgICAgLy8gICAgICAgICAvLyDjgqvjg6Hjg6njgojjgorliY3jgavjgZnjgZnjgpPjgaDjgonjgIHphY3liJfjgpLmuJvjgonjgZnlh6bnkIbjgYzlvq7lpplcclxuICAgICAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgLy8gICAgICAgICB0ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgcG9zWC5zaGlmdCgpO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHBvc1kuc2hpZnQoKTtcclxuICAgICAgICAgICAgLy8gICAgICAgICBwb3NaLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgZ2V0bnVtYmVyLS07XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2codGV4dHVyZSk7XHJcbiAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgY29uc29sZS5sb2cocG9zWik7XHJcbiAgICAgICAgICAgZm9yKHZhciBpPTA7aTx0ZXh0dXJlLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhwb3NaWzFdKTtcclxuICAgICAgICAgICAgcG9zWltpXS09MS40MDtcclxuICAgICAgICAgICAgaWYocG9zWltpXTwtMTAwKXtcclxuICAgICAgICAgICAgICAgIC8q44GG44G+44GP44Gn44GN44Gm44GE44Gq44GEKi9cclxuICAgICAgICAgICAgICAgIC8vIOOCq+ODoeODqeOCiOOCiuWJjeOBq+OBmeOBmeOCk+OBoOOCieOAgemFjeWIl+OCkua4m+OCieOBmeWHpueQhuOBjOW+ruWmmVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBwb3NYLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBwb3NZLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBwb3NaLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBnZXRudW1iZXItLTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHR1cmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJpbmRQbGF0ZVBvbHkoZ2wsbSxtTWF0cml4LHJhZCx0bXBNYXRyaXgsbXZwTWF0cml4LHVuaUxvY2F0aW9uLGluZGV4LGkscG9zWFtpXSxwb3NZW2ldLHBvc1pbaV0pO1xyXG4gICAgICAgICAgIH1cclxuICAgICAgIH1cclxuICAgICAgICAvLyDjgrPjg7Pjg4bjgq3jgrnjg4jjga7lho3mj4/nlLtcclxuICAgICAgICBnbC5mbHVzaCgpO1xyXG5cclxuICAgICAgICAvLyDjg6vjg7zjg5fjga7jgZ/jgoHjgavlho3luLDlkbzjgbPlh7rjgZdcclxuICAgICAgICAvL3NldFRpbWVvdXQobG9vcCwgMTAwMCAvIDMwKTtcclxuICAgICAgICAvL+OCv+ODluOBjOmdnuOCouOCr+ODhuOCo+ODluOBruWgtOWQiOOBr0ZQU+OCkuiQveOBqOOBmVxyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcclxuICAgIH0pKCk7XHJcblxyXG59O1xyXG5mdW5jdGlvbiBtb3VzZU1vdmUoZSl7XHJcbiAgICBteD1lLm9mZnNldFgvY3c7XHJcbiAgICBteT1lLm9mZnNldFkvY2g7XHJcbn1cclxuZnVuY3Rpb24gYmluZFBsYXRlUG9seShfZ2wsX20sX21NYXRyaXgsX3JhZCxfdG1wTWF0cml4LF9tdnBNYXRyaXgsX3VuaUxvY2F0aW9uLF9pbmRleCxfbnVtYmVyLF9wb3NYLF9wb3NZLF9wb3NaKXtcclxuICAgIC8vIOODouODh+ODq+W6p+aomeWkieaPm+ihjOWIl+OBrueUn+aIkFxyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFtfcG9zWCxfcG9zWSxfcG9zWl0sX21NYXRyaXgpO1xyXG4vLyAgICBfbS5yb3RhdGUoX21NYXRyaXgsIF9yYWQsIFswLCAxLCAwXSwgX21NYXRyaXgpO1xyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZVtfbnVtYmVyXSk7XHJcbiAgICBcclxuICAgIC8vIHVuaWZvcm3lpInmlbDjgavjg4bjgq/jgrnjg4Hjg6PjgpLnmbvpjLJcclxuICAgX2dsLnVuaWZvcm0xaShfdW5pTG9jYXRpb25bMV0sIDApO1xyXG5cclxuICAgIC8vIHVuaWZvcm3lpInmlbDjga7nmbvpjLLjgajmj4/nlLtcclxuICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KF91bmlMb2NhdGlvblswXSwgZmFsc2UsIF9tdnBNYXRyaXgpO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLCBfaW5kZXgubGVuZ3RoLCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG4gICAgXHJcbn1cclxuXHJcbi8vIOOCt+OCp+ODvOODgOOCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfc2hhZGVyKF9nbCxfaWQpe1xyXG4gICAgLy8g44K344Kn44O844OA44KS5qC857SN44GZ44KL5aSJ5pWwXHJcbiAgICB2YXIgc2hhZGVyO1xyXG4gICAgXHJcbiAgICAvLyBIVE1M44GL44KJc2NyaXB044K/44Kw44G444Gu5Y+C54Wn44KS5Y+W5b6XXHJcbiAgICB2YXIgc2NyaXB0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKF9pZCk7XHJcbiAgICBcclxuICAgIC8vIHNjcmlwdOOCv+OCsOOBjOWtmOWcqOOBl+OBquOBhOWgtOWQiOOBr+aKnOOBkeOCi1xyXG4gICAgaWYoIXNjcmlwdEVsZW1lbnQpe3JldHVybjt9XHJcbiAgICBcclxuICAgIC8vIHNjcmlwdOOCv+OCsOOBrnR5cGXlsZ7mgKfjgpLjg4Hjgqfjg4Pjgq9cclxuICAgIHN3aXRjaChzY3JpcHRFbGVtZW50LnR5cGUpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOmggueCueOCt+OCp+ODvOODgOOBruWgtOWQiFxyXG4gICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtdmVydGV4JzpcclxuICAgICAgICAgICAgc2hhZGVyID0gX2dsLmNyZWF0ZVNoYWRlcihfZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyDjg5Xjg6njgrDjg6Hjg7Pjg4jjgrfjgqfjg7zjg4Djga7loLTlkIhcclxuICAgICAgICBjYXNlICd4LXNoYWRlci94LWZyYWdtZW50JzpcclxuICAgICAgICAgICAgc2hhZGVyID0gX2dsLmNyZWF0ZVNoYWRlcihfZ2wuRlJBR01FTlRfU0hBREVSKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GV44KM44Gf44K344Kn44O844OA44Gr44K944O844K544KS5Ymy44KK5b2T44Gm44KLXHJcbiAgICBfZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc2NyaXB0RWxlbWVudC50ZXh0KTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44KS44Kz44Oz44OR44Kk44Or44GZ44KLXHJcbiAgICBfZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgYzmraPjgZfjgY/jgrPjg7Pjg5HjgqTjg6vjgZXjgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgIGlmKF9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBfZ2wuQ09NUElMRV9TVEFUVVMpKXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjgrfjgqfjg7zjg4DjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gc2hhZGVyO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5aSx5pWX44GX44Gm44GE44Gf44KJ44Ko44Op44O844Ot44Kw44KS44Ki44Op44O844OI44GZ44KLXHJcbiAgICAgICAgYWxlcnQoX2dsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSk7XHJcbiAgICB9XHJcbn1cclxuLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GX44K344Kn44O844OA44KS44Oq44Oz44Kv44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9wcm9ncmFtKF9nbCxfdnMsIF9mcyl7XHJcbiAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBwcm9ncmFtID0gX2dsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgIFxyXG4gICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gr44K344Kn44O844OA44KS5Ymy44KK5b2T44Gm44KLXHJcbiAgICBfZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIF92cyk7XHJcbiAgICBfZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIF9mcyk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOCkuODquODs+OCr1xyXG4gICAgX2dsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4Djga7jg6rjg7Pjgq/jgYzmraPjgZfjgY/ooYzjgarjgo/jgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgIGlmKF9nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIF9nbC5MSU5LX1NUQVRVUykpe1xyXG4gICAgXHJcbiAgICAgICAgLy8g5oiQ5Yqf44GX44Gm44GE44Gf44KJ44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICAgICAgX2dsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW07XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDlpLHmlZfjgZfjgabjgYTjgZ/jgonjgqjjg6njg7zjg63jgrDjgpLjgqLjg6njg7zjg4jjgZnjgotcclxuICAgICAgICBhbGVydChfZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkpO1xyXG4gICAgfVxyXG59XHJcbi8vIFZCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfdmJvKF9nbCxfZGF0YSl7XHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciB2Ym8gPSBfZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkFSUkFZX0JVRkZFUiwgdmJvKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gr44OH44O844K/44KS44K744OD44OIXHJcbiAgICBfZ2wuYnVmZmVyRGF0YShfZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KF9kYXRhKSwgX2dsLlNUQVRJQ19EUkFXKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GX44GfIFZCTyDjgpLov5TjgZfjgabntYLkuoZcclxuICAgIHJldHVybiB2Ym87XHJcbn1cclxuLy8gVkJP44KS44OQ44Kk44Oz44OJ44GX55m76Yyy44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGUoX2dsLF92Ym8sIF9hdHRMLCBfYXR0Uyl7XHJcbiAgICAvLyDlvJXmlbDjgajjgZfjgablj5fjgZHlj5bjgaPjgZ/phY3liJfjgpLlh6bnkIbjgZnjgotcclxuICAgIGZvcih2YXIgaSBpbiBfdmJvKXtcclxuICAgICAgICAvLyDjg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCBfdmJvW2ldKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgICAgIF9nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShfYXR0TFtpXSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLpgJrnn6XjgZfnmbvpjLLjgZnjgotcclxuICAgICAgICBfZ2wudmVydGV4QXR0cmliUG9pbnRlcihfYXR0TFtpXSwgX2F0dFNbaV0sIF9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgfVxyXG59XHJcbi8vIElCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfaWJvKF9nbCxfZGF0YSl7XHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBpYm8gPSBfZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpYm8pO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgavjg4fjg7zjgr/jgpLjgrvjg4Pjg4hcclxuICAgIF9nbC5idWZmZXJEYXRhKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IEludDE2QXJyYXkoX2RhdGEpLCBfZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOeUn+aIkOOBl+OBn0lCT+OCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIGlibztcclxufVxyXG5cclxuLy8g44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV90ZXh0dXJlKF9nbCxfc291cmNlLF9uKXtcclxuICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4fjg7zjgr/jga7jgqrjg7Pjg63jg7zjg4njgpLjg4jjg6rjgqzjg7zjgavjgZnjgotcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciB0ZXggPSBfZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgbjjgqTjg6Hjg7zjgrjjgpLpgannlKhcclxuICAgICAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgaW1nKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NQUdfRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01JTl9GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9TLF9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1QsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG5cclxuICAgICAgICAvLyDjg5/jg4Pjg5fjg57jg4Pjg5fjgpLnlJ/miJBcclxuICAgICAgICBfZ2wuZ2VuZXJhdGVNaXBtYXAoX2dsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g55Sf5oiQ44GX44Gf44OG44Kv44K544OB44Oj44KS44Kw44Ot44O844OQ44Or5aSJ5pWw44Gr5Luj5YWlXHJcbiAgICAgICAgdGV4dHVyZVtfbl0gPSB0ZXg7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7jgr3jg7zjgrnjgpLmjIflrppcclxuICAgIGltZy5zcmMgPSBfc291cmNlO1xyXG59XHJcbi8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCkuOCquODluOCuOOCp+OCr+ODiOOBqOOBl+OBpueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfZnJhbWVidWZmZXIoX2dsLF93aWR0aCwgX2hlaWdodCl7XHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjga7nlJ/miJBcclxuICAgIHZhciBmcmFtZUJ1ZmZlciA9IF9nbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpJXZWJHTOOBq+ODkOOCpOODs+ODiVxyXG4gICAgX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsIGZyYW1lQnVmZmVyKTtcclxuICAgIFxyXG4gICAgLy8g5rex5bqm44OQ44OD44OV44Kh55So44Os44Oz44OA44O844OQ44OD44OV44Kh44Gu55Sf5oiQ44Go44OQ44Kk44Oz44OJXHJcbiAgICB2YXIgZGVwdGhSZW5kZXJCdWZmZXIgPSBfZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XHJcbiAgICBfZ2wuYmluZFJlbmRlcmJ1ZmZlcihfZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOODrOODs+ODgOODvOODkOODg+ODleOCoeOCkua3seW6puODkOODg+ODleOCoeOBqOOBl+OBpuioreWumlxyXG4gICAgX2dsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoX2dsLlJFTkRFUkJVRkZFUiwgX2dsLkRFUFRIX0NPTVBPTkVOVDE2LCBfd2lkdGgsIF9oZWlnaHQpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgavjg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqHjgpLplqLpgKPku5jjgZHjgotcclxuICAgIF9nbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsIF9nbC5ERVBUSF9BVFRBQ0hNRU5ULCBfZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOODhuOCr+OCueODgeODo+OBrueUn+aIkFxyXG4gICAgdmFyIGZUZXh0dXJlID0gX2dsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh55So44Gu44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIGZUZXh0dXJlKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh55So44Gu44OG44Kv44K544OB44Oj44Gr44Kr44Op44O855So44Gu44Oh44Oi44Oq6aCY5Z+f44KS56K65L+dXHJcbiAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF93aWR0aCwgX2hlaWdodCwgMCwgX2dsLlJHQkEsIF9nbC5VTlNJR05FRF9CWVRFLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g44OG44Kv44K544OB44Oj44OR44Op44Oh44O844K/XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgX2dsLkxJTkVBUik7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgX2dsLkxJTkVBUik7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfV1JBUF9TLCBfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfV1JBUF9ULCBfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOBq+ODhuOCr+OCueODgeODo+OCkumWoumAo+S7mOOBkeOCi1xyXG4gICAgX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKF9nbC5GUkFNRUJVRkZFUiwgX2dsLkNPTE9SX0FUVEFDSE1FTlQwLCBfZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUsIDApO1xyXG4gICAgXHJcbiAgICAvLyDlkITnqK7jgqrjg5bjgrjjgqfjgq/jg4jjga7jg5DjgqTjg7Pjg4njgpLop6PpmaRcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICBfZ2wuYmluZFJlbmRlcmJ1ZmZlcihfZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g44Kq44OW44K444Kn44Kv44OI44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICByZXR1cm4ge2YgOiBmcmFtZUJ1ZmZlciwgZCA6IGRlcHRoUmVuZGVyQnVmZmVyLCB0IDogZlRleHR1cmV9O1xyXG59XHJcbiAgICBcclxuIl19
