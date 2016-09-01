(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
// テクスチャ用変数の宣言

var texture = [];
//球体背景のテクスチャ
var sphereTexture = null;

//マウスの位置、画像の大きさ、背景シェーダーに渡すもの
var mx, my, cw, ch;
//背景を切り替えるもの
var select = 1;
//webglのいろんなものが入ってる
var gl;
//3番背景のときに背景を動かすときにつかう
var sphereCountW = 0;
var sphereCountH = 0;
window.resize = function () {
    cw = window.innerWidth;
    ch = window.innerHeight;
};
window.onload = function () {
    var socket = io();
    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    cw = window.innerWidth;
    ch = window.innerHeight;
    c.width = cw;
    c.height = ch;

    //キーが押されたら
    document.addEventListener("keydown", KeyDown);
    //canvas上でマウスが動いたら
    c.addEventListener("mousemove", mouseMove, true);
    // webglコンテキストを取得
    gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    // 背景側の初期設定
    var backgroundData = initBackground(gl, "tvs", "tfs");

    var intensiveData = initBackground(gl, "tvs", "intensiveFs");

    // 全体のプログラムオブジェクトの生成とリンク
    //sphereSceneの初期設定
    var inSphereData = initInSphere(gl);
    // 全体的の初期設定
    var overallData = initOverall(gl);

    // 各種行列の生成と初期化
    var m = new matIV();
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    // ビュー×プロジェクション座標変換行列
    var eyePosition = [0.0, 0.0, 5.0];
    var centerPosition = [0.0, 0.0, 0.0];
    var upPosition = [0.0, 1.0, 0.0];
    m.lookAt(eyePosition, centerPosition, upPosition, vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);
    // 深度テストを有効にする
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // 有効にするテクスチャユニットを指定
    gl.activeTexture(gl.TEXTURE0);

    //テクスチャのy座標
    var posX = [];
    //テクスチャのy座標
    var posY = [];
    //テクスチャのz座標
    var posZ = [];
    //socketのイベントが何回きたかしらべる
    var getnumber = 0;

    var joFrag = false;

    //サーバーからデータを受け取る
    socket.on("pushImageFromServer", function (data) {
        console.log(data);
        if (joFrag) {
            create_texture(gl, "../img/joe.jpg", getnumber);
        } else {
            create_texture(gl, data.imgdata, getnumber);
        }
        posX[getnumber] = data.x * 5.0;
        posY[getnumber] = data.y * 5.0;
        posZ[getnumber] = 0;
        console.log(getnumber);
        console.log(texture);
        getnumber++;
    });
    //joさんボタンを押したかどうかをチェック
    socket.on("pushJoFragFromServer", function (data) {
        console.log(data.joFrag);
        if (data.joFrag === true) {
            joFrag = true;
        }
    });
    //最初にjoさんフラグをfalseにするようにメッセージを送る
    socket.emit("pushJoFragFromScreen", {
        joFrag: false
    });

    // フレームバッファオブジェクトの取得
    var fBufferWidth = cw;
    var fBufferHeight = ch;
    var fBuffer = create_framebuffer(gl, fBufferWidth, fBufferHeight);
    // カウンタの宣言
    var count = 0;
    var count2 = 0;
    //一応
    mx = 0.5;my = 0.5;
    var startTime = new Date().getTime();

    //ブレンドファンクしてるぞ
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // 恒常ループ
    (function loop() {
        // カウンタを元にラジアンを算出
        count++;
        if (count % 10 === 0) {
            count2++;
        }
        var hsv = hsva(count2 % 360, 1, 1, 1);
        var rad = count % 360 * Math.PI / 180;
        /*-------------------フレームバッファ----------------------*/
        //時間
        var time = (new Date().getTime() - startTime) * 0.001;
        /*--フレームバッファをバインド--*/
        if (select == 1) {
            bindBackground(gl, fBuffer, backgroundData, time, mx, my, cw, ch, hsv);
        } else if (select == 2) {
            bindBackground(gl, fBuffer, intensiveData, time, mx, my, cw, ch, hsv);
        }

        //全体的な
        //shaderBackgroundの場合
        if (select == 1 || select == 2) {
            bindOverall(gl, overallData, fBuffer, m, mMatrix, tmpMatrix, mvpMatrix, rad, texture, posX, posY, posZ, getnumber);
        } else if (select == 3) {
            bindInSphere(c, gl, overallData, [0, 0, 0], [0, 1, 0], inSphereData, fBuffer, m, mMatrix, pMatrix, tmpMatrix, mvpMatrix, rad, texture, posX, posY, posZ, getnumber, sphereCountW, sphereCountH);
        }
        // コンテキストの再描画
        gl.flush();
        //タブが非アクティブの場合はFPSを落とす
        requestAnimationFrame(loop);
    })();
};
function KeyDown(e) {
    if (e.keyCode == 49) {
        //1を押したら
        select = 1;
    } else if (e.keyCode == 50) {
        //2を押したら
        select = 2;
    } else if (e.keyCode == 51) {
        select = 3;
        createSphereTexture(gl, "../img/test.jpg");
    }

    //十字キー
    if (e.keyCode == 37) {
        //左
        sphereCountW--;
    } else if (e.keyCode == 39) {
        //右
        sphereCountW++;
    } else if (e.keyCode == 38) {
        //上
        sphereCountH--;
    } else if (e.keyCode == 40) {
        //下
        sphereCountH++;
    }
}
function mouseMove(e) {
    mx = e.offsetX / cw;
    my = e.offsetY / ch;
}
function initBackground(_gl, _vsId, _fsId) {
    var prg = create_program(_gl, create_shader(_gl, _vsId), create_shader(_gl, _fsId));
    var uniLocation = [];
    uniLocation[0] = _gl.getUniformLocation(prg, "time");
    uniLocation[1] = _gl.getUniformLocation(prg, "mouse");
    uniLocation[2] = _gl.getUniformLocation(prg, "iResolution");
    uniLocation[3] = _gl.getUniformLocation(prg, "hsv");

    var Position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
    var Index = [0, 2, 1, 1, 2, 3];
    var vPosition = create_vbo(_gl, Position);
    var vIndex = create_ibo(_gl, Index);
    var vAttLocation = _gl.getAttribLocation(prg, "position");

    return { prg: prg, uniLocation: uniLocation, vPosition: vPosition, vIndex: vIndex, attLocation: vAttLocation };
}
function initInSphere(_gl) {
    var earthData = sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0]);
    var ePosition = create_vbo(_gl, earthData.p);
    var eColor = create_vbo(_gl, earthData.c);
    var eTextureCoord = create_vbo(_gl, earthData.t);
    var eVBOList = [ePosition, eColor, eTextureCoord];
    var eIndex = create_ibo(_gl, earthData.i);

    return { VBOList: eVBOList, iIndex: eIndex, index: earthData.i };
}
function initOverall(_gl) {
    // // プログラムオブジェクトの生成とリンク
    var prg = create_program(_gl, create_shader(_gl, 'vs'), create_shader(_gl, 'fs'));

    // attributeLocationを配列に取得
    var attLocation = [];
    attLocation[0] = _gl.getAttribLocation(prg, 'position');
    attLocation[1] = _gl.getAttribLocation(prg, 'color');
    attLocation[2] = _gl.getAttribLocation(prg, 'textureCoord');
    // attributeの要素数を配列に格納
    var attStride = [];
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
    var vPosition = create_vbo(_gl, position);
    var vColor = create_vbo(_gl, color);
    var vTextureCoord = create_vbo(_gl, textureCoord);
    var VBOList = [vPosition, vColor, vTextureCoord];
    var iIndex = create_ibo(_gl, index);

    // uniformLocationを配列に取得
    var uniLocation = [];
    uniLocation[0] = _gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = _gl.getUniformLocation(prg, 'texture');

    return { prg: prg, attLocation: attLocation, attStride: attStride, VBOList: VBOList, iIndex: iIndex, uniLocation: uniLocation };
}
function bindBackground(_gl, _fBuffer, _backgroundData, _time, _mx, _my, _cw, _ch, _hsv) {
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, _fBuffer.f);
    _gl.clearColor(0.0, 0.0, 0.0, 1.0);
    _gl.clear(_gl.COLOR_BUFFER_BIT);

    _gl.useProgram(_backgroundData.prg);
    // ブレンディングを無効にする
    _gl.disable(_gl.BLEND);
    //attributeの登録
    _gl.bindBuffer(_gl.ARRAY_BUFFER, _backgroundData.vPosition);
    _gl.enableVertexAttribArray(_backgroundData.vAttLocation);
    _gl.vertexAttribPointer(_backgroundData.vAttLocation, 3, _gl.FLOAT, false, 0, 0);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _backgroundData.vIndex);

    _gl.uniform1f(_backgroundData.uniLocation[0], _time);
    _gl.uniform2fv(_backgroundData.uniLocation[1], [_mx, _my]);
    _gl.uniform2fv(_backgroundData.uniLocation[2], [_cw, _ch]);
    _gl.uniform4fv(_backgroundData.uniLocation[3], [_hsv[0], _hsv[1], _hsv[2], _hsv[3]]);
    _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);

    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
}
function bindOverall(_gl, _overallData, _fBuffer, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _rad, _texture, _posX, _posY, _posZ, _getnumber) {
    // canvasを初期化
    _gl.clearColor(0.0, 0.0, 0.0, 1.0);
    _gl.clearDepth(1.0);
    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);

    /*------------------背景テクスチャ(オフスクリーンレンタリング)---------------------*/
    _gl.useProgram(_overallData.prg);
    // ブレンディングを無効にする
    _gl.disable(_gl.BLEND);
    // VBOとIBOの登録
    set_attribute(_gl, _overallData.VBOList, _overallData.attLocation, _overallData.attStride);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _overallData.iIndex);
    /*移動、回転、拡大縮小*/
    _m.identity(_mMatrix);
    _m.translate(_mMatrix, [0.0, 0.0, -95.0], _mMatrix);
    _m.scale(_mMatrix, [100.0, 70.0, 1.0], _mMatrix);
    _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);
    //uniformを登録
    _gl.bindTexture(_gl.TEXTURE_2D, _fBuffer.t);
    _gl.uniform1i(_overallData.uniLocation[1], 0);
    _gl.uniformMatrix4fv(_overallData.uniLocation[0], false, _mvpMatrix);
    _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);

    /*テクスチャ*/
    // ブレンディングを有効にする
    _gl.enable(_gl.BLEND);
    if (_texture) {
        for (var i = 0; i < _texture.length; i++) {
            _posZ[i] -= 0.40;
            if (_posZ[i] < -100) {
                // カメラより前にすすんだら、配列を減らす処理が微妙
                console.log("削除してます");
                _texture.shift();
                _posX.shift();
                _posY.shift();
                _posZ.shift();
                _getnumber--;
            }
            bindPlatePoly(_gl, _m, _mMatrix, _rad, _tmpMatrix, _mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i]);
        }
    }
}
function bindInSphere(_c, _gl, _overallData, _centerPosition, _upPosition, _inSphereData, _fBuffer, _m, _mMatrix, _pMatrix, _tmpMatrix, _mvpMatrix, _rad, _texture, _posX, _posY, _posZ, _getnumber, _sphereCountW, _sphereCountH) {
    var radW = _sphereCountW % 360 * Math.PI / 180;
    var radH = _sphereCountH % 360 * Math.PI / 180;

    // var radW = 0;
    // var radH = 0;


    var m = new matIV();
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    // ビュー×プロジェクション座標変換行列
    var eyePosition = [0.0, 0.0, 5.0];
    var centerPosition = [0.0, 0.0, 0.0];
    var upPosition = [0.0, 1.0, 0.0];
    //m.lookAt(eyePosition, centerPosition, upPosition, vMatrix);
    m.perspective(45, _c.width / _c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    /*------------------カメラを回転させているけど、まだカメラの向きがいまいち-----------------------------*/
    centerPosition = [eyePosition[0] + Math.cos(radW) * 5.0, eyePosition[1] + Math.sin(radH) * 5.0, eyePosition[2] + Math.sin(radW) * 5.0];
    console.log(centerPosition);
    // ビュー×プロジェクション座標変換行列
    m.lookAt(eyePosition, centerPosition, upPosition, vMatrix);

    m.multiply(pMatrix, vMatrix, tmpMatrix);

    // canvasを初期化
    _gl.clearColor(0.0, 0.0, 0.0, 1.0);
    _gl.clearDepth(1.0);
    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);

    _gl.useProgram(_overallData.prg);
    // ブレンディングを無効にする
    _gl.disable(_gl.BLEND);
    // VBOとIBOの登録
    set_attribute(_gl, _inSphereData.VBOList, _overallData.attLocation, _overallData.attStride);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _inSphereData.iIndex);
    /*移動、回転、拡大縮小*/
    /*
        _m.identity(_mMatrix);
        //_m.translate(_mMatrix,[0.0,0.0,5.0],_mMatrix);
        _m.rotate(_mMatrix, 180, [1, 0, 0], _mMatrix);
    
        // _m.rotate(_mMatrix, radH, [1, 0, 0], _mMatrix);
        // _m.rotate(_mMatrix, radW, [0, 1, 0], _mMatrix);
        _m.scale(_mMatrix,[2.0,2.0,2.0],_mMatrix);
        _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);
    */
    m.identity(mMatrix);
    //m.translate(mMatrix,[0.0,0.0,5.0],mMatrix);
    m.rotate(mMatrix, 180, [1, 0, 0], mMatrix);

    // _m.rotate(_mMatrix, radH, [1, 0, 0], _mMatrix);
    // _m.rotate(_mMatrix, radW, [0, 1, 0], _mMatrix);
    //m.scale(mMatrix,[10.0,10.0,10.0],mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    //uniformを登録
    _gl.bindTexture(_gl.TEXTURE_2D, sphereTexture);
    _gl.uniform1i(_overallData.uniLocation[1], 0);
    // _gl.uniformMatrix4fv(_overallData.uniLocation[0], false, _mvpMatrix);

    _gl.uniformMatrix4fv(_overallData.uniLocation[0], false, mvpMatrix);

    _gl.drawElements(_gl.TRIANGLES, _inSphereData.index.length, _gl.UNSIGNED_SHORT, 0);

    // VBOとIBOの登録
    set_attribute(_gl, _overallData.VBOList, _overallData.attLocation, _overallData.attStride);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _overallData.iIndex);
    _gl.enable(_gl.BLEND);
    if (_texture) {
        for (var i = 0; i < _texture.length; i++) {
            //_posZ[i]-=0.40;
            //_posY[i]=3.0;
            _posZ[i] = 4.5;
            //console.log("posY[i]"+_posY[i]);
            if (_posZ[i] < -100) {
                // カメラより前にすすんだら、配列を減らす処理が微妙
                console.log("削除してます");
                _texture.shift();
                _posX.shift();
                _posY.shift();
                _posZ.shift();
                _getnumber--;
            }
            bindPlatePoly(_gl, _m, mMatrix, _rad, tmpMatrix, mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i]);
        }
    }
}
function bindPlatePoly(_gl, _m, _mMatrix, _rad, _tmpMatrix, _mvpMatrix, _uniLocation, _number, _posX, _posY, _posZ) {
    // モデル座標変換行列の生成
    _m.identity(_mMatrix);
    _m.translate(_mMatrix, [_posX, _posY, _posZ], _mMatrix);
    _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);

    // テクスチャをバインドする
    _gl.bindTexture(_gl.TEXTURE_2D, texture[_number]);

    // uniform変数にテクスチャを登録
    _gl.uniform1i(_uniLocation[1], 0);

    // uniform変数の登録と描画
    _gl.uniformMatrix4fv(_uniLocation[0], false, _mvpMatrix);
    _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);
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
// テクスチャを生成する関数
function createSphereTexture(_gl, _source) {
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
        sphereTexture = tex;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQUNBLElBQUksVUFBUSxFQUFaO0FBQ0E7QUFDQSxJQUFJLGdCQUFjLElBQWxCOztBQUVBO0FBQ0EsSUFBSSxFQUFKLEVBQU8sRUFBUCxFQUFVLEVBQVYsRUFBYSxFQUFiO0FBQ0E7QUFDQSxJQUFJLFNBQU8sQ0FBWDtBQUNBO0FBQ0EsSUFBSSxFQUFKO0FBQ0E7QUFDQSxJQUFJLGVBQWEsQ0FBakI7QUFDQSxJQUFJLGVBQWEsQ0FBakI7QUFDQSxPQUFPLE1BQVAsR0FBYyxZQUFVO0FBQ3BCLFNBQUcsT0FBTyxVQUFWO0FBQ0EsU0FBRyxPQUFPLFdBQVY7QUFDSCxDQUhEO0FBSUEsT0FBTyxNQUFQLEdBQWMsWUFBVTtBQUNwQixRQUFJLFNBQVEsSUFBWjtBQUNBO0FBQ0EsUUFBSSxJQUFJLFNBQVMsY0FBVCxDQUF3QixRQUF4QixDQUFSO0FBQ0EsU0FBRyxPQUFPLFVBQVY7QUFDQSxTQUFHLE9BQU8sV0FBVjtBQUNBLE1BQUUsS0FBRixHQUFVLEVBQVY7QUFDQSxNQUFFLE1BQUYsR0FBVyxFQUFYOztBQUVBO0FBQ0EsYUFBUyxnQkFBVCxDQUEwQixTQUExQixFQUFzQyxPQUF0QztBQUNBO0FBQ0EsTUFBRSxnQkFBRixDQUFtQixXQUFuQixFQUErQixTQUEvQixFQUF5QyxJQUF6QztBQUNBO0FBQ0EsU0FBSyxFQUFFLFVBQUYsQ0FBYSxPQUFiLEtBQXlCLEVBQUUsVUFBRixDQUFhLG9CQUFiLENBQTlCOztBQUVBO0FBQ0EsUUFBSSxpQkFBZSxlQUFlLEVBQWYsRUFBa0IsS0FBbEIsRUFBd0IsS0FBeEIsQ0FBbkI7O0FBRUEsUUFBSSxnQkFBYyxlQUFlLEVBQWYsRUFBa0IsS0FBbEIsRUFBd0IsYUFBeEIsQ0FBbEI7O0FBRUE7QUFD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QUNBLFFBQUksV0FBVyxJQUFJLGFBQUosRUFBZjs7QUFFQTtBQUNBLFFBQUksV0FBSixDQUFnQixJQUFJLFVBQXBCLEVBQWdDLFFBQWhDOztBQUVBO0FBQ0EsUUFBSSxVQUFKLENBQWUsSUFBSSxVQUFuQixFQUErQixDQUEvQixFQUFrQyxJQUFJLElBQXRDLEVBQTRDLE1BQTVDLEVBQW9ELE9BQXBELEVBQTZELENBQTdELEVBQWdFLElBQUksSUFBcEUsRUFBMEUsSUFBSSxhQUE5RSxFQUE2RixJQUE3Rjs7QUFFQTtBQUNBLFFBQUksYUFBSixDQUFrQixJQUFJLFVBQXRCLEVBQWtDLElBQUksa0JBQXRDLEVBQTBELElBQUksTUFBOUQ7QUFDQSxRQUFJLGFBQUosQ0FBa0IsSUFBSSxVQUF0QixFQUFrQyxJQUFJLGtCQUF0QyxFQUEwRCxJQUFJLE1BQTlEO0FBQ0EsUUFBSSxhQUFKLENBQWtCLElBQUksVUFBdEIsRUFBa0MsSUFBSSxjQUF0QyxFQUFzRCxJQUFJLGFBQTFEO0FBQ0EsUUFBSSxhQUFKLENBQWtCLElBQUksVUFBdEIsRUFBa0MsSUFBSSxjQUF0QyxFQUFzRCxJQUFJLGFBQTFEOztBQUVBO0FBQ0EsUUFBSSxvQkFBSixDQUF5QixJQUFJLFdBQTdCLEVBQTBDLElBQUksaUJBQTlDLEVBQWlFLElBQUksVUFBckUsRUFBaUYsUUFBakYsRUFBMkYsQ0FBM0Y7O0FBRUE7QUFDQSxRQUFJLFdBQUosQ0FBZ0IsSUFBSSxVQUFwQixFQUFnQyxJQUFoQztBQUNBLFFBQUksZ0JBQUosQ0FBcUIsSUFBSSxZQUF6QixFQUF1QyxJQUF2QztBQUNBLFFBQUksZUFBSixDQUFvQixJQUFJLFdBQXhCLEVBQXFDLElBQXJDOztBQUVBO0FBQ0EsV0FBTyxFQUFDLEdBQUksV0FBTCxFQUFrQixHQUFJLGlCQUF0QixFQUF5QyxHQUFJLFFBQTdDLEVBQVA7QUFDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcbi8vIOODhuOCr+OCueODgeODo+eUqOWkieaVsOOBruWuo+iogFxyXG52YXIgdGV4dHVyZT1bXTtcclxuLy/nkIPkvZPog4zmma/jga7jg4bjgq/jgrnjg4Hjg6NcclxudmFyIHNwaGVyZVRleHR1cmU9bnVsbDtcclxuXHJcbi8v44Oe44Km44K544Gu5L2N572u44CB55S75YOP44Gu5aSn44GN44GV44CB6IOM5pmv44K344Kn44O844OA44O844Gr5rih44GZ44KC44GuXHJcbnZhciBteCxteSxjdyxjaDtcclxuLy/og4zmma/jgpLliIfjgormm7/jgYjjgovjgoLjga5cclxudmFyIHNlbGVjdD0xO1xyXG4vL3dlYmds44Gu44GE44KN44KT44Gq44KC44Gu44GM5YWl44Gj44Gm44KLXHJcbnZhciBnbDtcclxuLy8z55Wq6IOM5pmv44Gu44Go44GN44Gr6IOM5pmv44KS5YuV44GL44GZ44Go44GN44Gr44Gk44GL44GGXHJcbnZhciBzcGhlcmVDb3VudFc9MDtcclxudmFyIHNwaGVyZUNvdW50SD0wO1xyXG53aW5kb3cucmVzaXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxufTtcclxud2luZG93Lm9ubG9hZD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHNvY2tldCA9aW8oKTtcclxuICAgIC8vIGNhbnZhc+OCqOODrOODoeODs+ODiOOCkuWPluW+l1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIGMud2lkdGggPSBjdztcclxuICAgIGMuaGVpZ2h0ID0gY2g7XHJcblxyXG4gICAgLy/jgq3jg7zjgYzmirzjgZXjgozjgZ/jgolcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIgLCBLZXlEb3duKTtcclxuICAgIC8vY2FudmFz5LiK44Gn44Oe44Km44K544GM5YuV44GE44Gf44KJXHJcbiAgICBjLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIixtb3VzZU1vdmUsdHJ1ZSk7XHJcbiAgICAvLyB3ZWJnbOOCs+ODs+ODhuOCreOCueODiOOCkuWPluW+l1xyXG4gICAgZ2wgPSBjLmdldENvbnRleHQoJ3dlYmdsJykgfHwgYy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcclxuXHJcbiAgICAvLyDog4zmma/lgbTjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBiYWNrZ3JvdW5kRGF0YT1pbml0QmFja2dyb3VuZChnbCxcInR2c1wiLFwidGZzXCIpO1xyXG5cclxuICAgIHZhciBpbnRlbnNpdmVEYXRhPWluaXRCYWNrZ3JvdW5kKGdsLFwidHZzXCIsXCJpbnRlbnNpdmVGc1wiKTtcclxuXHJcbiAgICAvLyDlhajkvZPjga7jg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJDjgajjg6rjg7Pjgq9cclxuICAgIC8vc3BoZXJlU2NlbmXjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBpblNwaGVyZURhdGE9aW5pdEluU3BoZXJlKGdsKTtcclxuICAgIC8vIOWFqOS9k+eahOOBruWIneacn+ioreWumlxyXG4gICAgdmFyIG92ZXJhbGxEYXRhPWluaXRPdmVyYWxsKGdsKTtcclxuXHJcblxyXG4gICAgLy8g5ZCE56iu6KGM5YiX44Gu55Sf5oiQ44Go5Yid5pyf5YyWXHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIC8vIOODk+ODpeODvMOX44OX44Ot44K444Kn44Kv44K344On44Oz5bqn5qiZ5aSJ5o+b6KGM5YiXXHJcbiAgICB2YXIgZXllUG9zaXRpb249WzAuMCwgMC4wLCA1LjBdO1xyXG4gICAgdmFyIGNlbnRlclBvc2l0aW9uPVswLjAsIDAuMCwgMC4wXTtcclxuICAgIHZhciB1cFBvc2l0aW9uPVswLjAsIDEuMCwgMC4wXTtcclxuICAgIG0ubG9va0F0KGV5ZVBvc2l0aW9uLCBjZW50ZXJQb3NpdGlvbiwgdXBQb3NpdGlvbiwgdk1hdHJpeCk7XHJcbiAgICBtLnBlcnNwZWN0aXZlKDQ1LCBjLndpZHRoIC8gYy5oZWlnaHQsIDAuMSwgMTAwLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuICAgIC8vIOa3seW6puODhuOCueODiOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xyXG4gICAgZ2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XHJcbiAgICAvLyDmnInlirnjgavjgZnjgovjg4bjgq/jgrnjg4Hjg6Pjg6bjg4vjg4Pjg4jjgpLmjIflrppcclxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xyXG5cclxuICAgIC8v44OG44Kv44K544OB44Oj44GueeW6p+aomVxyXG4gICAgdmFyIHBvc1g9W107XHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NZPVtdO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga565bqn5qiZXHJcbiAgICB2YXIgcG9zWj1bXTtcclxuICAgIC8vc29ja2V044Gu44Kk44OZ44Oz44OI44GM5L2V5Zue44GN44Gf44GL44GX44KJ44G544KLXHJcbiAgICB2YXIgZ2V0bnVtYmVyPTA7XHJcblxyXG4gICAgdmFyIGpvRnJhZz1mYWxzZTtcclxuXHJcbiAgICAvL+OCteODvOODkOODvOOBi+OCieODh+ODvOOCv+OCkuWPl+OBkeWPluOCi1xyXG4gICAgc29ja2V0Lm9uKFwicHVzaEltYWdlRnJvbVNlcnZlclwiLGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgIGlmKGpvRnJhZyl7XHJcbiAgICAgICAgICAgIGNyZWF0ZV90ZXh0dXJlKGdsLFwiLi4vaW1nL2pvZS5qcGdcIixnZXRudW1iZXIpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBjcmVhdGVfdGV4dHVyZShnbCxkYXRhLmltZ2RhdGEsZ2V0bnVtYmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcG9zWFtnZXRudW1iZXJdPWRhdGEueCo1LjA7XHJcbiAgICAgICAgcG9zWVtnZXRudW1iZXJdPWRhdGEueSo1LjA7XHJcbiAgICAgICAgcG9zWltnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2V0bnVtYmVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0dXJlKTtcclxuICAgICAgICBnZXRudW1iZXIrKztcclxuICAgIH0pO1xyXG4gICAgLy9qb+OBleOCk+ODnOOCv+ODs+OCkuaKvOOBl+OBn+OBi+OBqeOBhuOBi+OCkuODgeOCp+ODg+OCr1xyXG4gICAgc29ja2V0Lm9uKFwicHVzaEpvRnJhZ0Zyb21TZXJ2ZXJcIixmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmpvRnJhZyk7XHJcbiAgICAgICAgaWYoZGF0YS5qb0ZyYWc9PT10cnVlKXtcclxuICAgICAgICAgICAgam9GcmFnPXRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvL+acgOWIneOBq2pv44GV44KT44OV44Op44Kw44KSZmFsc2XjgavjgZnjgovjgojjgYbjgavjg6Hjg4Pjgrvjg7zjgrjjgpLpgIHjgotcclxuICAgIHNvY2tldC5lbWl0KFwicHVzaEpvRnJhZ0Zyb21TY3JlZW5cIix7XHJcbiAgICAgICAgICAgIGpvRnJhZzpmYWxzZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBruWPluW+l1xyXG4gICAgdmFyIGZCdWZmZXJXaWR0aCAgPSBjdztcclxuICAgIHZhciBmQnVmZmVySGVpZ2h0ID0gY2g7XHJcbiAgICB2YXIgZkJ1ZmZlciA9IGNyZWF0ZV9mcmFtZWJ1ZmZlcihnbCxmQnVmZmVyV2lkdGgsIGZCdWZmZXJIZWlnaHQpO1xyXG4gICAgLy8g44Kr44Km44Oz44K/44Gu5a6j6KiAXHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdmFyIGNvdW50Mj0wO1xyXG4gICAgLy/kuIDlv5xcclxuICAgIG14PTAuNTtteT0wLjU7XHJcbiAgICB2YXIgc3RhcnRUaW1lPW5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgIC8v44OW44Os44Oz44OJ44OV44Kh44Oz44Kv44GX44Gm44KL44GeXHJcbiAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xyXG4gICAgLy8g5oGS5bi444Or44O844OXXHJcbiAgICAoZnVuY3Rpb24gbG9vcCgpe1xyXG4gICAgICAgIC8vIOOCq+OCpuODs+OCv+OCkuWFg+OBq+ODqeOCuOOCouODs+OCkueul+WHulxyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgaWYgKGNvdW50ICUgMTAgPT09IDApIHtcclxuICAgICAgICAgICAgY291bnQyKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBoc3Y9aHN2YShjb3VudDIlMzYwLDEsMSwxKTtcclxuICAgICAgICB2YXIgcmFkID0gKGNvdW50ICUgMzYwKSAqIE1hdGguUEkgLyAxODA7XHJcbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0t44OV44Os44O844Og44OQ44OD44OV44KhLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbiAgICAgICAgLy/mmYLplpNcclxuICAgICAgICB2YXIgdGltZT0obmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpKjAuMDAxO1xyXG4gICAgICAgIC8qLS3jg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4ktLSovXHJcbiAgICAgICAgaWYoc2VsZWN0PT0xKXtcclxuICAgICAgICAgICAgYmluZEJhY2tncm91bmQoZ2wsZkJ1ZmZlcixiYWNrZ3JvdW5kRGF0YSx0aW1lLG14LG15LGN3LGNoLGhzdik7XHJcbiAgICAgICAgfWVsc2UgaWYoc2VsZWN0PT0yKXtcclxuICAgICAgICAgICAgYmluZEJhY2tncm91bmQoZ2wsZkJ1ZmZlcixpbnRlbnNpdmVEYXRhLHRpbWUsbXgsbXksY3csY2gsaHN2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8v5YWo5L2T55qE44GqXHJcbiAgICAgICAgLy9zaGFkZXJCYWNrZ3JvdW5k44Gu5aC05ZCIXHJcbiAgICAgICAgaWYoc2VsZWN0PT0xfHxzZWxlY3Q9PTIpe1xyXG4gICAgICAgICAgICBiaW5kT3ZlcmFsbChnbCxvdmVyYWxsRGF0YSxmQnVmZmVyLG0sbU1hdHJpeCx0bXBNYXRyaXgsbXZwTWF0cml4LHJhZCx0ZXh0dXJlLHBvc1gscG9zWSxwb3NaLGdldG51bWJlcik7XHJcbiAgICAgICAgfWVsc2UgaWYoc2VsZWN0PT0zKXtcclxuICAgICAgICAgICAgYmluZEluU3BoZXJlKGMsZ2wsb3ZlcmFsbERhdGEsWzAsIDAsIDBdLFswLCAxLCAwXSxpblNwaGVyZURhdGEsZkJ1ZmZlcixtLG1NYXRyaXgscE1hdHJpeCx0bXBNYXRyaXgsbXZwTWF0cml4LHJhZCx0ZXh0dXJlLHBvc1gscG9zWSxwb3NaLGdldG51bWJlcixzcGhlcmVDb3VudFcsc3BoZXJlQ291bnRIKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g44Kz44Oz44OG44Kt44K544OI44Gu5YaN5o+P55S7XHJcbiAgICAgICAgZ2wuZmx1c2goKTtcclxuICAgICAgICAvL+OCv+ODluOBjOmdnuOCouOCr+ODhuOCo+ODluOBruWgtOWQiOOBr0ZQU+OCkuiQveOBqOOBmVxyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcclxuICAgIH0pKCk7XHJcblxyXG59O1xyXG5mdW5jdGlvbiBLZXlEb3duKGUpe1xyXG4gICAgaWYoZS5rZXlDb2RlPT00OSl7XHJcbiAgICAgICAgLy8x44KS5oq844GX44Gf44KJXHJcbiAgICAgICAgc2VsZWN0PTE7XHJcbiAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTUwKXtcclxuICAgICAgICAvLzLjgpLmirzjgZfjgZ/jgolcclxuICAgICAgICBzZWxlY3Q9MjtcclxuICAgIH1lbHNlIGlmKGUua2V5Q29kZT09NTEpe1xyXG4gICAgICAgIHNlbGVjdD0zO1xyXG4gICAgICAgIGNyZWF0ZVNwaGVyZVRleHR1cmUoZ2wsXCIuLi9pbWcvdGVzdC5qcGdcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy/ljYHlrZfjgq3jg7xcclxuICAgICAgICBpZihlLmtleUNvZGU9PTM3KXtcclxuICAgICAgICAgICAgLy/lt6ZcclxuICAgICAgICAgICAgc3BoZXJlQ291bnRXLS07XHJcbiAgICAgICAgfWVsc2UgaWYoZS5rZXlDb2RlPT0zOSl7XHJcbiAgICAgICAgICAgIC8v5Y+zXHJcbiAgICAgICAgICAgIHNwaGVyZUNvdW50VysrO1xyXG4gICAgICAgIH1lbHNlIGlmKGUua2V5Q29kZT09Mzgpe1xyXG4gICAgICAgICAgICAvL+S4ilxyXG4gICAgICAgICAgICBzcGhlcmVDb3VudEgtLTtcclxuICAgICAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTQwKXtcclxuICAgICAgICAgICAgLy/kuItcclxuICAgICAgICAgICAgc3BoZXJlQ291bnRIKys7XHJcbiAgICAgICAgfVxyXG5cclxufVxyXG5mdW5jdGlvbiBtb3VzZU1vdmUoZSl7XHJcbiAgICBteD1lLm9mZnNldFgvY3c7XHJcbiAgICBteT1lLm9mZnNldFkvY2g7XHJcbn1cclxuZnVuY3Rpb24gaW5pdEJhY2tncm91bmQoX2dsLF92c0lkLF9mc0lkKXtcclxuICAgIHZhciBwcmc9Y3JlYXRlX3Byb2dyYW0oX2dsLGNyZWF0ZV9zaGFkZXIoX2dsLF92c0lkKSxjcmVhdGVfc2hhZGVyKF9nbCxfZnNJZCkpO1xyXG4gICAgdmFyIHVuaUxvY2F0aW9uPVtdO1xyXG4gICAgdW5pTG9jYXRpb25bMF09X2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsXCJ0aW1lXCIpO1xyXG4gICAgdW5pTG9jYXRpb25bMV09X2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsXCJtb3VzZVwiKTtcclxuICAgIHVuaUxvY2F0aW9uWzJdPV9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLFwiaVJlc29sdXRpb25cIik7XHJcbiAgICB1bmlMb2NhdGlvblszXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcImhzdlwiKTtcclxuXHJcbiAgICB2YXIgUG9zaXRpb249W1xyXG4gICAgLTEuMCwxLjAsMC4wLFxyXG4gICAgMS4wLDEuMCwwLjAsXHJcbiAgICAtMS4wLC0xLjAsMC4wLFxyXG4gICAgMS4wLC0xLjAsMC4wLFxyXG4gICAgXTtcclxuICAgIHZhciBJbmRleD1bXHJcbiAgICAwLDIsMSxcclxuICAgIDEsMiwzXHJcbiAgICBdO1xyXG4gICAgdmFyIHZQb3NpdGlvbj1jcmVhdGVfdmJvKF9nbCxQb3NpdGlvbik7XHJcbiAgICB2YXIgdkluZGV4PWNyZWF0ZV9pYm8oX2dsLEluZGV4KTtcclxuICAgIHZhciB2QXR0TG9jYXRpb249X2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZyxcInBvc2l0aW9uXCIpO1xyXG5cclxuICAgIHJldHVybntwcmc6cHJnLHVuaUxvY2F0aW9uOnVuaUxvY2F0aW9uLHZQb3NpdGlvbjp2UG9zaXRpb24sdkluZGV4OnZJbmRleCxhdHRMb2NhdGlvbjp2QXR0TG9jYXRpb259O1xyXG59XHJcbmZ1bmN0aW9uIGluaXRJblNwaGVyZShfZ2wpe1xyXG4gICAgdmFyIGVhcnRoRGF0YSAgICAgPSBzcGhlcmUoNjQsIDY0LCAxLjAsIFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcclxuICAgIHZhciBlUG9zaXRpb24gICAgID0gY3JlYXRlX3ZibyhfZ2wsZWFydGhEYXRhLnApO1xyXG4gICAgdmFyIGVDb2xvciAgICAgICAgPSBjcmVhdGVfdmJvKF9nbCxlYXJ0aERhdGEuYyk7XHJcbiAgICB2YXIgZVRleHR1cmVDb29yZCA9IGNyZWF0ZV92Ym8oX2dsLGVhcnRoRGF0YS50KTtcclxuICAgIHZhciBlVkJPTGlzdCAgICAgID0gW2VQb3NpdGlvbixlQ29sb3IsIGVUZXh0dXJlQ29vcmRdO1xyXG4gICAgdmFyIGVJbmRleCAgICAgICAgPSBjcmVhdGVfaWJvKF9nbCxlYXJ0aERhdGEuaSk7XHJcblxyXG4gICAgcmV0dXJuIHtWQk9MaXN0OmVWQk9MaXN0LGlJbmRleDplSW5kZXgsaW5kZXg6ZWFydGhEYXRhLml9XHJcbn1cclxuZnVuY3Rpb24gaW5pdE92ZXJhbGwoX2dsLCl7XHJcbiAgICAvLyAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJDjgajjg6rjg7Pjgq9cclxuICAgICB2YXIgcHJnID0gY3JlYXRlX3Byb2dyYW0oX2dsLGNyZWF0ZV9zaGFkZXIoX2dsLCd2cycpLCBjcmVhdGVfc2hhZGVyKF9nbCwnZnMnKSk7XHJcblxyXG4gICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLphY3liJfjgavlj5blvpdcclxuICAgIHZhciBhdHRMb2NhdGlvbiA9IFtdO1xyXG4gICAgYXR0TG9jYXRpb25bMF0gPSBfZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAncG9zaXRpb24nKTtcclxuICAgIGF0dExvY2F0aW9uWzFdID0gX2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZywgJ2NvbG9yJyk7XHJcbiAgICBhdHRMb2NhdGlvblsyXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXh0dXJlQ29vcmQnKTtcclxuICAgIC8vIGF0dHJpYnV0ZeOBruimgee0oOaVsOOCkumFjeWIl+OBq+agvOe0jVxyXG4gICAgdmFyIGF0dFN0cmlkZSA9IFtdO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDQ7XHJcbiAgICBhdHRTdHJpZGVbMl0gPSAyO1xyXG4gICAgLy8g6aCC54K544Gu5L2N572uXHJcbiAgICB2YXIgcG9zaXRpb24gPSBbXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAwLjAsXHJcbiAgICAgICAgIDEuMCwgLTEuMCwgIDAuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueiJslxyXG4gICAgdmFyIGNvbG9yID0gW1xyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOODhuOCr+OCueODgeODo+W6p+aomVxyXG4gICAgdmFyIHRleHR1cmVDb29yZCA9IFtcclxuICAgICAgICAwLjAsIDAuMCxcclxuICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgdmFyIGluZGV4ID0gW1xyXG4gICAgICAgIDAsIDEsIDIsXHJcbiAgICAgICAgMywgMiwgMVxyXG4gICAgXTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueUn+aIkFxyXG4gICAgdmFyIHZQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKF9nbCxwb3NpdGlvbik7XHJcbiAgICB2YXIgdkNvbG9yICAgICAgICA9IGNyZWF0ZV92Ym8oX2dsLGNvbG9yKTtcclxuICAgIHZhciB2VGV4dHVyZUNvb3JkID0gY3JlYXRlX3ZibyhfZ2wsdGV4dHVyZUNvb3JkKTtcclxuICAgIHZhciBWQk9MaXN0ICAgICAgID0gW3ZQb3NpdGlvbiwgdkNvbG9yLCB2VGV4dHVyZUNvb3JkXTtcclxuICAgIHZhciBpSW5kZXggICAgICAgID0gY3JlYXRlX2libyhfZ2wsaW5kZXgpO1xyXG5cclxuICAgIC8vIHVuaWZvcm1Mb2NhdGlvbuOCkumFjeWIl+OBq+WPluW+l1xyXG4gICAgdmFyIHVuaUxvY2F0aW9uID0gW107XHJcbiAgICB1bmlMb2NhdGlvblswXSAgPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ212cE1hdHJpeCcpO1xyXG4gICAgdW5pTG9jYXRpb25bMV0gID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd0ZXh0dXJlJyk7XHJcblxyXG4gICAgcmV0dXJue3ByZzpwcmcsYXR0TG9jYXRpb246YXR0TG9jYXRpb24sYXR0U3RyaWRlOmF0dFN0cmlkZSxWQk9MaXN0OlZCT0xpc3QsaUluZGV4OmlJbmRleCx1bmlMb2NhdGlvbjp1bmlMb2NhdGlvbn07XHJcbn1cclxuZnVuY3Rpb24gYmluZEJhY2tncm91bmQoX2dsLF9mQnVmZmVyLF9iYWNrZ3JvdW5kRGF0YSxfdGltZSxfbXgsX215LF9jdyxfY2gsX2hzdil7XHJcbiAgICBfZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUixfZkJ1ZmZlci5mKTtcclxuICAgIF9nbC5jbGVhckNvbG9yKDAuMCwwLjAsMC4wLDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIF9nbC51c2VQcm9ncmFtKF9iYWNrZ3JvdW5kRGF0YS5wcmcpO1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS54Sh5Yq544Gr44GZ44KLXHJcbiAgICBfZ2wuZGlzYWJsZShfZ2wuQkxFTkQpO1xyXG4gICAgLy9hdHRyaWJ1dGXjga7nmbvpjLJcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsX2JhY2tncm91bmREYXRhLnZQb3NpdGlvbik7XHJcbiAgICBfZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoX2JhY2tncm91bmREYXRhLnZBdHRMb2NhdGlvbik7XHJcbiAgICBfZ2wudmVydGV4QXR0cmliUG9pbnRlcihfYmFja2dyb3VuZERhdGEudkF0dExvY2F0aW9uLDMsX2dsLkZMT0FULGZhbHNlLDAsMCk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsX2JhY2tncm91bmREYXRhLnZJbmRleCk7XHJcblxyXG4gICAgX2dsLnVuaWZvcm0xZihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMF0sX3RpbWUpO1xyXG4gICAgX2dsLnVuaWZvcm0yZnYoX2JhY2tncm91bmREYXRhLnVuaUxvY2F0aW9uWzFdLFtfbXgsX215XSk7XHJcbiAgICBfZ2wudW5pZm9ybTJmdihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMl0sW19jdyxfY2hdKTtcclxuICAgIF9nbC51bmlmb3JtNGZ2KF9iYWNrZ3JvdW5kRGF0YS51bmlMb2NhdGlvblszXSxbX2hzdlswXSxfaHN2WzFdLF9oc3ZbMl0sX2hzdlszXV0pO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLDYsX2dsLlVOU0lHTkVEX1NIT1JULDApO1xyXG5cclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLG51bGwpO1xyXG5cclxufVxyXG5mdW5jdGlvbiBiaW5kT3ZlcmFsbChfZ2wsX292ZXJhbGxEYXRhLF9mQnVmZmVyLF9tLF9tTWF0cml4LF90bXBNYXRyaXgsX212cE1hdHJpeCxfcmFkLF90ZXh0dXJlLF9wb3NYLF9wb3NZLF9wb3NaLF9nZXRudW1iZXIpe1xyXG4gICAgLy8gY2FudmFz44KS5Yid5pyf5YyWXHJcbiAgICBfZ2wuY2xlYXJDb2xvcigwLjAsMC4wLDAuMCwxLjApO1xyXG4gICAgX2dsLmNsZWFyRGVwdGgoMS4wKTtcclxuICAgIF9nbC5jbGVhcihfZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IF9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLeiDjOaZr+ODhuOCr+OCueODgeODoyjjgqrjg5Xjgrnjgq/jg6rjg7zjg7Pjg6zjg7Pjgr/jg6rjg7PjgrApLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuICAgIF9nbC51c2VQcm9ncmFtKF9vdmVyYWxsRGF0YS5wcmcpO1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS54Sh5Yq544Gr44GZ44KLXHJcbiAgICBfZ2wuZGlzYWJsZShfZ2wuQkxFTkQpO1xyXG4gICAgLy8gVkJP44GoSUJP44Gu55m76YyyXHJcbiAgICBzZXRfYXR0cmlidXRlKF9nbCxfb3ZlcmFsbERhdGEuVkJPTGlzdCwgX292ZXJhbGxEYXRhLmF0dExvY2F0aW9uLCBfb3ZlcmFsbERhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX292ZXJhbGxEYXRhLmlJbmRleCk7XHJcbiAgICAvKuenu+WLleOAgeWbnui7ouOAgeaLoeWkp+e4ruWwjyovXHJcbiAgICBfbS5pZGVudGl0eShfbU1hdHJpeCk7XHJcbiAgICBfbS50cmFuc2xhdGUoX21NYXRyaXgsWzAuMCwwLjAsLTk1LjBdLF9tTWF0cml4KTtcclxuICAgIF9tLnNjYWxlKF9tTWF0cml4LFsxMDAuMCw3MC4wLDEuMF0sX21NYXRyaXgpO1xyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgLy91bmlmb3Jt44KS55m76YyyXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsX2ZCdWZmZXIudCk7XHJcbiAgICBfZ2wudW5pZm9ybTFpKF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvblsxXSwgMCk7XHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMF0sIGZhbHNlLCBfbXZwTWF0cml4KTtcclxuICAgIF9nbC5kcmF3RWxlbWVudHMoX2dsLlRSSUFOR0xFUywgNiwgX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICAvKuODhuOCr+OCueODgeODoyovXHJcbiAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLmnInlirnjgavjgZnjgotcclxuICAgIF9nbC5lbmFibGUoX2dsLkJMRU5EKTtcclxuICAgaWYoX3RleHR1cmUpe1xyXG4gICAgICAgZm9yKHZhciBpPTA7aTxfdGV4dHVyZS5sZW5ndGg7aSsrKXtcclxuICAgICAgICBfcG9zWltpXS09MC40MDtcclxuICAgICAgICBpZihfcG9zWltpXTwtMTAwKXtcclxuICAgICAgICAgICAgLy8g44Kr44Oh44Op44KI44KK5YmN44Gr44GZ44GZ44KT44Gg44KJ44CB6YWN5YiX44KS5rib44KJ44GZ5Yem55CG44GM5b6u5aaZXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5YmK6Zmk44GX44Gm44G+44GZXCIpO1xyXG4gICAgICAgICAgICBfdGV4dHVyZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWi5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfZ2V0bnVtYmVyLS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJpbmRQbGF0ZVBvbHkoX2dsLF9tLF9tTWF0cml4LF9yYWQsX3RtcE1hdHJpeCxfbXZwTWF0cml4LF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvbixpLF9wb3NYW2ldLF9wb3NZW2ldLF9wb3NaW2ldKTtcclxuICAgICAgIH1cclxuICAgfVxyXG59XHJcbmZ1bmN0aW9uIGJpbmRJblNwaGVyZShfYyxfZ2wsX292ZXJhbGxEYXRhLF9jZW50ZXJQb3NpdGlvbixfdXBQb3NpdGlvbixfaW5TcGhlcmVEYXRhLF9mQnVmZmVyLF9tLF9tTWF0cml4LF9wTWF0cml4LF90bXBNYXRyaXgsX212cE1hdHJpeCxfcmFkLF90ZXh0dXJlLF9wb3NYLF9wb3NZLF9wb3NaLF9nZXRudW1iZXIsX3NwaGVyZUNvdW50Vyxfc3BoZXJlQ291bnRIKXtcclxuICAgICB2YXIgcmFkVyA9IChfc3BoZXJlQ291bnRXICUgMzYwKSAqIE1hdGguUEkgLyAxODA7XHJcbiAgICAgdmFyIHJhZEggPSAoX3NwaGVyZUNvdW50SCAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG5cclxuICAgICAvLyB2YXIgcmFkVyA9IDA7XHJcbiAgICAgLy8gdmFyIHJhZEggPSAwO1xyXG5cclxuXHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIC8vIOODk+ODpeODvMOX44OX44Ot44K444Kn44Kv44K344On44Oz5bqn5qiZ5aSJ5o+b6KGM5YiXXHJcbiAgICB2YXIgZXllUG9zaXRpb249WzAuMCwgMC4wLCA1LjBdO1xyXG4gICAgdmFyIGNlbnRlclBvc2l0aW9uPVswLjAsIDAuMCwgMC4wXTtcclxuICAgIHZhciB1cFBvc2l0aW9uPVswLjAsIDEuMCwgMC4wXTtcclxuICAgIC8vbS5sb29rQXQoZXllUG9zaXRpb24sIGNlbnRlclBvc2l0aW9uLCB1cFBvc2l0aW9uLCB2TWF0cml4KTtcclxuICAgIG0ucGVyc3BlY3RpdmUoNDUsIF9jLndpZHRoIC8gX2MuaGVpZ2h0LCAwLjEsIDEwMCwgcE1hdHJpeCk7XHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLeOCq+ODoeODqeOCkuWbnui7ouOBleOBm+OBpuOBhOOCi+OBkeOBqeOAgeOBvuOBoOOCq+ODoeODqeOBruWQkeOBjeOBjOOBhOOBvuOBhOOBoS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuICAgIGNlbnRlclBvc2l0aW9uPVtleWVQb3NpdGlvblswXStNYXRoLmNvcyhyYWRXKSo1LjAsZXllUG9zaXRpb25bMV0rTWF0aC5zaW4ocmFkSCkqNS4wLGV5ZVBvc2l0aW9uWzJdK01hdGguc2luKHJhZFcpKjUuMF07XHJcbmNvbnNvbGUubG9nKGNlbnRlclBvc2l0aW9uKTtcclxuICAgIC8vIOODk+ODpeODvMOX44OX44Ot44K444Kn44Kv44K344On44Oz5bqn5qiZ5aSJ5o+b6KGM5YiXXHJcbiAgICBtLmxvb2tBdChleWVQb3NpdGlvbiwgY2VudGVyUG9zaXRpb24sIHVwUG9zaXRpb24sIHZNYXRyaXgpO1xyXG5cclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuXHJcblxyXG4gICAgLy8gY2FudmFz44KS5Yid5pyf5YyWXHJcbiAgICBfZ2wuY2xlYXJDb2xvcigwLjAsMC4wLDAuMCwxLjApO1xyXG4gICAgX2dsLmNsZWFyRGVwdGgoMS4wKTtcclxuICAgIF9nbC5jbGVhcihfZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IF9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICBfZ2wudXNlUHJvZ3JhbShfb3ZlcmFsbERhdGEucHJnKTtcclxuICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkueEoeWKueOBq+OBmeOCi1xyXG4gICAgX2dsLmRpc2FibGUoX2dsLkJMRU5EKTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueZu+mMslxyXG4gICAgc2V0X2F0dHJpYnV0ZShfZ2wsX2luU3BoZXJlRGF0YS5WQk9MaXN0LCBfb3ZlcmFsbERhdGEuYXR0TG9jYXRpb24sIF9vdmVyYWxsRGF0YS5hdHRTdHJpZGUpO1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBfaW5TcGhlcmVEYXRhLmlJbmRleCk7XHJcbiAgICAvKuenu+WLleOAgeWbnui7ouOAgeaLoeWkp+e4ruWwjyovXHJcbi8qXHJcbiAgICBfbS5pZGVudGl0eShfbU1hdHJpeCk7XHJcbiAgICAvL19tLnRyYW5zbGF0ZShfbU1hdHJpeCxbMC4wLDAuMCw1LjBdLF9tTWF0cml4KTtcclxuICAgIF9tLnJvdGF0ZShfbU1hdHJpeCwgMTgwLCBbMSwgMCwgMF0sIF9tTWF0cml4KTtcclxuXHJcbiAgICAvLyBfbS5yb3RhdGUoX21NYXRyaXgsIHJhZEgsIFsxLCAwLCAwXSwgX21NYXRyaXgpO1xyXG4gICAgLy8gX20ucm90YXRlKF9tTWF0cml4LCByYWRXLCBbMCwgMSwgMF0sIF9tTWF0cml4KTtcclxuICAgIF9tLnNjYWxlKF9tTWF0cml4LFsyLjAsMi4wLDIuMF0sX21NYXRyaXgpO1xyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4qL1xyXG4gICAgbS5pZGVudGl0eShtTWF0cml4KTtcclxuICAgIC8vbS50cmFuc2xhdGUobU1hdHJpeCxbMC4wLDAuMCw1LjBdLG1NYXRyaXgpO1xyXG4gICAgbS5yb3RhdGUobU1hdHJpeCwgMTgwLCBbMSwgMCwgMF0sIG1NYXRyaXgpO1xyXG5cclxuICAgIC8vIF9tLnJvdGF0ZShfbU1hdHJpeCwgcmFkSCwgWzEsIDAsIDBdLCBfbU1hdHJpeCk7XHJcbiAgICAvLyBfbS5yb3RhdGUoX21NYXRyaXgsIHJhZFcsIFswLCAxLCAwXSwgX21NYXRyaXgpO1xyXG4gICAgLy9tLnNjYWxlKG1NYXRyaXgsWzEwLjAsMTAuMCwxMC4wXSxtTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkodG1wTWF0cml4LCBtTWF0cml4LCBtdnBNYXRyaXgpO1xyXG4gICAgLy91bmlmb3Jt44KS55m76YyyXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsc3BoZXJlVGV4dHVyZSk7XHJcbiAgICBfZ2wudW5pZm9ybTFpKF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvblsxXSwgMCk7XHJcbiAgICAvLyBfZ2wudW5pZm9ybU1hdHJpeDRmdihfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMF0sIGZhbHNlLCBfbXZwTWF0cml4KTtcclxuXHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMF0sIGZhbHNlLCBtdnBNYXRyaXgpO1xyXG5cclxuICAgIF9nbC5kcmF3RWxlbWVudHMoX2dsLlRSSUFOR0xFUywgX2luU3BoZXJlRGF0YS5pbmRleC5sZW5ndGgsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcblxyXG5cclxuICAgIC8vIFZCT+OBqElCT+OBrueZu+mMslxyXG4gICAgc2V0X2F0dHJpYnV0ZShfZ2wsX292ZXJhbGxEYXRhLlZCT0xpc3QsIF9vdmVyYWxsRGF0YS5hdHRMb2NhdGlvbiwgX292ZXJhbGxEYXRhLmF0dFN0cmlkZSk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIF9vdmVyYWxsRGF0YS5pSW5kZXgpO1xyXG4gICAgX2dsLmVuYWJsZShfZ2wuQkxFTkQpO1xyXG4gICBpZihfdGV4dHVyZSl7XHJcbiAgICAgICBmb3IodmFyIGk9MDtpPF90ZXh0dXJlLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIC8vX3Bvc1pbaV0tPTAuNDA7XHJcbiAgICAgICAgLy9fcG9zWVtpXT0zLjA7XHJcbiAgICAgICAgX3Bvc1pbaV09NC41O1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coXCJwb3NZW2ldXCIrX3Bvc1lbaV0pO1xyXG4gICAgICAgIGlmKF9wb3NaW2ldPC0xMDApe1xyXG4gICAgICAgICAgICAvLyDjgqvjg6Hjg6njgojjgorliY3jgavjgZnjgZnjgpPjgaDjgonjgIHphY3liJfjgpLmuJvjgonjgZnlh6bnkIbjgYzlvq7lpplcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgIF90ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NaLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXItLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYmluZFBsYXRlUG9seShfZ2wsX20sbU1hdHJpeCxfcmFkLHRtcE1hdHJpeCxtdnBNYXRyaXgsX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uLGksX3Bvc1hbaV0sX3Bvc1lbaV0sX3Bvc1pbaV0pO1xyXG4gICAgICAgfVxyXG4gICB9XHJcblxyXG59XHJcbmZ1bmN0aW9uIGJpbmRQbGF0ZVBvbHkoX2dsLF9tLF9tTWF0cml4LF9yYWQsX3RtcE1hdHJpeCxfbXZwTWF0cml4LF91bmlMb2NhdGlvbixfbnVtYmVyLF9wb3NYLF9wb3NZLF9wb3NaKXtcclxuICAgIC8vIOODouODh+ODq+W6p+aomeWkieaPm+ihjOWIl+OBrueUn+aIkFxyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFtfcG9zWCxfcG9zWSxfcG9zWl0sX21NYXRyaXgpO1xyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZVtfbnVtYmVyXSk7XHJcbiAgICBcclxuICAgIC8vIHVuaWZvcm3lpInmlbDjgavjg4bjgq/jgrnjg4Hjg6PjgpLnmbvpjLJcclxuICAgX2dsLnVuaWZvcm0xaShfdW5pTG9jYXRpb25bMV0sIDApO1xyXG5cclxuICAgIC8vIHVuaWZvcm3lpInmlbDjga7nmbvpjLLjgajmj4/nlLtcclxuICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KF91bmlMb2NhdGlvblswXSwgZmFsc2UsIF9tdnBNYXRyaXgpO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLCA2LCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG4gICAgXHJcbn1cclxuXHJcbi8vIOOCt+OCp+ODvOODgOOCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfc2hhZGVyKF9nbCxfaWQpe1xyXG4gICAgLy8g44K344Kn44O844OA44KS5qC857SN44GZ44KL5aSJ5pWwXHJcbiAgICB2YXIgc2hhZGVyO1xyXG4gICAgXHJcbiAgICAvLyBIVE1M44GL44KJc2NyaXB044K/44Kw44G444Gu5Y+C54Wn44KS5Y+W5b6XXHJcbiAgICB2YXIgc2NyaXB0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKF9pZCk7XHJcbiAgICBcclxuICAgIC8vIHNjcmlwdOOCv+OCsOOBjOWtmOWcqOOBl+OBquOBhOWgtOWQiOOBr+aKnOOBkeOCi1xyXG4gICAgaWYoIXNjcmlwdEVsZW1lbnQpe3JldHVybjt9XHJcbiAgICBcclxuICAgIC8vIHNjcmlwdOOCv+OCsOOBrnR5cGXlsZ7mgKfjgpLjg4Hjgqfjg4Pjgq9cclxuICAgIHN3aXRjaChzY3JpcHRFbGVtZW50LnR5cGUpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOmggueCueOCt+OCp+ODvOODgOOBruWgtOWQiFxyXG4gICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtdmVydGV4JzpcclxuICAgICAgICAgICAgc2hhZGVyID0gX2dsLmNyZWF0ZVNoYWRlcihfZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyDjg5Xjg6njgrDjg6Hjg7Pjg4jjgrfjgqfjg7zjg4Djga7loLTlkIhcclxuICAgICAgICBjYXNlICd4LXNoYWRlci94LWZyYWdtZW50JzpcclxuICAgICAgICAgICAgc2hhZGVyID0gX2dsLmNyZWF0ZVNoYWRlcihfZ2wuRlJBR01FTlRfU0hBREVSKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GV44KM44Gf44K344Kn44O844OA44Gr44K944O844K544KS5Ymy44KK5b2T44Gm44KLXHJcbiAgICBfZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc2NyaXB0RWxlbWVudC50ZXh0KTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44KS44Kz44Oz44OR44Kk44Or44GZ44KLXHJcbiAgICBfZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgYzmraPjgZfjgY/jgrPjg7Pjg5HjgqTjg6vjgZXjgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgIGlmKF9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBfZ2wuQ09NUElMRV9TVEFUVVMpKXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjgrfjgqfjg7zjg4DjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gc2hhZGVyO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5aSx5pWX44GX44Gm44GE44Gf44KJ44Ko44Op44O844Ot44Kw44KS44Ki44Op44O844OI44GZ44KLXHJcbiAgICAgICAgYWxlcnQoX2dsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSk7XHJcbiAgICB9XHJcbn1cclxuLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GX44K344Kn44O844OA44KS44Oq44Oz44Kv44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9wcm9ncmFtKF9nbCxfdnMsIF9mcyl7XHJcbiAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBwcm9ncmFtID0gX2dsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgIFxyXG4gICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gr44K344Kn44O844OA44KS5Ymy44KK5b2T44Gm44KLXHJcbiAgICBfZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIF92cyk7XHJcbiAgICBfZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIF9mcyk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOCkuODquODs+OCr1xyXG4gICAgX2dsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4Djga7jg6rjg7Pjgq/jgYzmraPjgZfjgY/ooYzjgarjgo/jgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgIGlmKF9nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIF9nbC5MSU5LX1NUQVRVUykpe1xyXG4gICAgXHJcbiAgICAgICAgLy8g5oiQ5Yqf44GX44Gm44GE44Gf44KJ44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICAgICAgX2dsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW07XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDlpLHmlZfjgZfjgabjgYTjgZ/jgonjgqjjg6njg7zjg63jgrDjgpLjgqLjg6njg7zjg4jjgZnjgotcclxuICAgICAgICBhbGVydChfZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkpO1xyXG4gICAgfVxyXG59XHJcbi8vIFZCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfdmJvKF9nbCxfZGF0YSl7XHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciB2Ym8gPSBfZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkFSUkFZX0JVRkZFUiwgdmJvKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gr44OH44O844K/44KS44K744OD44OIXHJcbiAgICBfZ2wuYnVmZmVyRGF0YShfZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KF9kYXRhKSwgX2dsLlNUQVRJQ19EUkFXKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GX44GfIFZCTyDjgpLov5TjgZfjgabntYLkuoZcclxuICAgIHJldHVybiB2Ym87XHJcbn1cclxuLy8gVkJP44KS44OQ44Kk44Oz44OJ44GX55m76Yyy44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGUoX2dsLF92Ym8sIF9hdHRMLCBfYXR0Uyl7XHJcbiAgICAvLyDlvJXmlbDjgajjgZfjgablj5fjgZHlj5bjgaPjgZ/phY3liJfjgpLlh6bnkIbjgZnjgotcclxuICAgIGZvcih2YXIgaSBpbiBfdmJvKXtcclxuICAgICAgICAvLyDjg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCBfdmJvW2ldKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgICAgIF9nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShfYXR0TFtpXSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLpgJrnn6XjgZfnmbvpjLLjgZnjgotcclxuICAgICAgICBfZ2wudmVydGV4QXR0cmliUG9pbnRlcihfYXR0TFtpXSwgX2F0dFNbaV0sIF9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgfVxyXG59XHJcbi8vIElCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfaWJvKF9nbCxfZGF0YSl7XHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBpYm8gPSBfZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpYm8pO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgavjg4fjg7zjgr/jgpLjgrvjg4Pjg4hcclxuICAgIF9nbC5idWZmZXJEYXRhKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IEludDE2QXJyYXkoX2RhdGEpLCBfZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOeUn+aIkOOBl+OBn0lCT+OCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIGlibztcclxufVxyXG5cclxuLy8g44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV90ZXh0dXJlKF9nbCxfc291cmNlLF9uKXtcclxuICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4fjg7zjgr/jga7jgqrjg7Pjg63jg7zjg4njgpLjg4jjg6rjgqzjg7zjgavjgZnjgotcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciB0ZXggPSBfZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgbjjgqTjg6Hjg7zjgrjjgpLpgannlKhcclxuICAgICAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgaW1nKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NQUdfRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01JTl9GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9TLF9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1QsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG5cclxuICAgICAgICAvLyDjg5/jg4Pjg5fjg57jg4Pjg5fjgpLnlJ/miJBcclxuICAgICAgICBfZ2wuZ2VuZXJhdGVNaXBtYXAoX2dsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g55Sf5oiQ44GX44Gf44OG44Kv44K544OB44Oj44KS44Kw44Ot44O844OQ44Or5aSJ5pWw44Gr5Luj5YWlXHJcbiAgICAgICAgICAgIHRleHR1cmVbX25dID0gdGV4O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu44K944O844K544KS5oyH5a6aXHJcbiAgICBpbWcuc3JjID0gX3NvdXJjZTtcclxufVxyXG4vLyDjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlU3BoZXJlVGV4dHVyZShfZ2wsX3NvdXJjZSl7XHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgIFxyXG4gICAgLy8g44OH44O844K/44Gu44Kq44Oz44Ot44O844OJ44KS44OI44Oq44Ks44O844Gr44GZ44KLXHJcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgICAgICB2YXIgdGV4ID0gX2dsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIHRleCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44G444Kk44Oh44O844K444KS6YGp55SoXHJcbiAgICAgICAgX2dsLnRleEltYWdlMkQoX2dsLlRFWFRVUkVfMkQsIDAsIF9nbC5SR0JBLCBfZ2wuUkdCQSwgX2dsLlVOU0lHTkVEX0JZVEUsIGltZyk7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUixfZ2wuTElORUFSKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NSU5fRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX1dSQVBfUyxfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9ULF9nbC5DTEFNUF9UT19FREdFKTtcclxuXHJcbiAgICAgICAgLy8g44Of44OD44OX44Oe44OD44OX44KS55Sf5oiQXHJcbiAgICAgICAgX2dsLmdlbmVyYXRlTWlwbWFwKF9nbC5URVhUVVJFXzJEKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgICAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOeUn+aIkOOBl+OBn+ODhuOCr+OCueODgeODo+OCkuOCsOODreODvOODkOODq+WkieaVsOOBq+S7o+WFpVxyXG4gICAgICAgICAgICBzcGhlcmVUZXh0dXJlID0gdGV4O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu44K944O844K544KS5oyH5a6aXHJcbiAgICBpbWcuc3JjID0gX3NvdXJjZTtcclxufVxyXG4vLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLjgqrjg5bjgrjjgqfjgq/jg4jjgajjgZfjgabnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX2ZyYW1lYnVmZmVyKF9nbCxfd2lkdGgsIF9oZWlnaHQpe1xyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44Gu55Sf5oiQXHJcbiAgICB2YXIgZnJhbWVCdWZmZXIgPSBfZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44KSV2ViR0zjgavjg5DjgqTjg7Pjg4lcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBmcmFtZUJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOa3seW6puODkOODg+ODleOCoeeUqOODrOODs+ODgOODvOODkOODg+ODleOCoeOBrueUn+aIkOOBqOODkOOCpOODs+ODiVxyXG4gICAgdmFyIGRlcHRoUmVuZGVyQnVmZmVyID0gX2dsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgX2dsLmJpbmRSZW5kZXJidWZmZXIoX2dsLlJFTkRFUkJVRkZFUiwgZGVwdGhSZW5kZXJCdWZmZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqHjgpLmt7Hluqbjg5Djg4Pjg5XjgqHjgajjgZfjgaboqK3lrppcclxuICAgIF9nbC5yZW5kZXJidWZmZXJTdG9yYWdlKF9nbC5SRU5ERVJCVUZGRVIsIF9nbC5ERVBUSF9DT01QT05FTlQxNiwgX3dpZHRoLCBfaGVpZ2h0KTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44Gr44Os44Oz44OA44O844OQ44OD44OV44Kh44KS6Zai6YCj5LuY44GR44KLXHJcbiAgICBfZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBfZ2wuREVQVEhfQVRUQUNITUVOVCwgX2dsLlJFTkRFUkJVRkZFUiwgZGVwdGhSZW5kZXJCdWZmZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHnlKjjg4bjgq/jgrnjg4Hjg6Pjga7nlJ/miJBcclxuICAgIHZhciBmVGV4dHVyZSA9IF9nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOOBruODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODiVxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBmVGV4dHVyZSk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOOBruODhuOCr+OCueODgeODo+OBq+OCq+ODqeODvOeUqOOBruODoeODouODqumgmOWfn+OCkueiuuS/nVxyXG4gICAgX2dsLnRleEltYWdlMkQoX2dsLlRFWFRVUkVfMkQsIDAsIF9nbC5SR0JBLCBfd2lkdGgsIF9oZWlnaHQsIDAsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+ODkeODqeODoeODvOOCv1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX01BR19GSUxURVIsIF9nbC5MSU5FQVIpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX01JTl9GSUxURVIsIF9nbC5MSU5FQVIpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX1dSQVBfUywgX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX1dSQVBfVCwgX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgavjg4bjgq/jgrnjg4Hjg6PjgpLplqLpgKPku5jjgZHjgotcclxuICAgIF9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChfZ2wuRlJBTUVCVUZGRVIsIF9nbC5DT0xPUl9BVFRBQ0hNRU5UMCwgX2dsLlRFWFRVUkVfMkQsIGZUZXh0dXJlLCAwKTtcclxuICAgIFxyXG4gICAgLy8g5ZCE56iu44Kq44OW44K444Kn44Kv44OI44Gu44OQ44Kk44Oz44OJ44KS6Kej6ZmkXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgX2dsLmJpbmRSZW5kZXJidWZmZXIoX2dsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XHJcbiAgICBfZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOOCquODluOCuOOCp+OCr+ODiOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIHtmIDogZnJhbWVCdWZmZXIsIGQgOiBkZXB0aFJlbmRlckJ1ZmZlciwgdCA6IGZUZXh0dXJlfTtcclxufVxyXG4gICAgXHJcbiJdfQ==
