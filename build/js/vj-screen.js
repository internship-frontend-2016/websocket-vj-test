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

    //テクスチャのy座標
    var posXm = [];
    //テクスチャのy座標
    var posYm = [];
    //テクスチャのz座標
    var posZm = [];

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
        console.log("data.frag" + data.frag);
        //真ん中のボタンを押したかどうか
        if (data.frag == true) {
            posXm[getnumber] = 0;
            posYm[getnumber] = 0;
            posZm[getnumber] = -95;
        } else {
            posX[getnumber] = data.x * 5.0;
            posY[getnumber] = data.y * 5.0;
            posZ[getnumber] = 0;
        }

        //select
        if (select == 3) {
            posX[getnumber] = data.x * 5.0;
            posY[getnumber] = 5.0;
            posZ[getnumber] = data.y;
        }
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
            bindOverall(gl, overallData, fBuffer, m, mMatrix, tmpMatrix, mvpMatrix, rad, texture, posX, posY, posZ, posXm, posYm, posZm, getnumber);
        } else if (select == 3) {
            // bindInSphere(c,gl,overallData,[0, 0, 0],[0, 1, 0],inSphereData,fBuffer,m,mMatrix,pMatrix,tmpMatrix,mvpMatrix,rad,texture,posX,posY,posZ,getnumber,sphereCountW,sphereCountH);
            bindInSphere(c, gl, overallData, centerPosition, upPosition, inSphereData, fBuffer, m, mMatrix, pMatrix, tmpMatrix, mvpMatrix, rad, texture, posX, posY, posZ, posXm, posYm, posZm, getnumber, sphereCountW, sphereCountH);
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
        sphereCountW++;
    } else if (e.keyCode == 39) {
        //右
        sphereCountW--;
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
function bindOverall(_gl, _overallData, _fBuffer, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _rad, _texture, _posX, _posY, _posZ, _posXm, _posYm, _posZm, _getnumber) {
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
            _posZm[i] += 1.0;
            if (_posZ[i] < -100) {
                // カメラより前にすすんだら、配列を減らす処理が微妙
                console.log("削除してます");
                _texture.shift();
                _posX.shift();
                _posY.shift();
                _posZ.shift();
                _getnumber--;
            } else if (_posZm[i] > 10) {
                console.log("削除してます");
                _texture.shift();
                _posXm.shift();
                _posYm.shift();
                _posZm.shift();
                _getnumber--;
            }
            bindPlatePoly(_gl, _m, _mMatrix, _rad, _tmpMatrix, _mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i], _posXm[i], _posYm[i], _posZm[i], false);
        }
    }
}
function bindInSphere(_c, _gl, _overallData, _centerPosition, _upPosition, _inSphereData, _fBuffer, _m, _mMatrix, _pMatrix, _tmpMatrix, _mvpMatrix, _rad, _texture, _posX, _posY, _posZ, _posXm, _posYm, _posZm, _getnumber, _sphereCountW, _sphereCountH) {
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
    //var eyePosition=[0.0, 0.0, -5.0];
    var eyePosition = [0.0, 0.0, 5.0];
    var centerPosition = [0.0, 0.0, 0.0];
    var upPosition = [0.0, 1.0, 0.0];
    //m.lookAt(eyePosition, centerPosition, upPosition, vMatrix);
    m.perspective(45, _c.width / _c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    var q = new qtnIV();
    var camQ = q.identity(q.create());
    var camW = q.identity(q.create());
    var camH = q.identity(q.create());

    q.rotate(radW, [0, 1, 0], camW);
    q.rotate(radH, [1, 0, 0], camH);
    //q.multiply(camW,camH,camQ);
    q.multiply(camH, camW, camQ);
    var camUp = [];
    var camforward = [];
    q.toVecIII(upPosition, camQ, camUp);
    //q.toVecIII([0.0,0.0,1.0],camQ,camforward);
    q.toVecIII([0.0, 0.0, -1.0], camQ, camforward);

    /*------------------カメラを回転させているけど、まだカメラの向きがいまいち-----------------------------*/
    //centerPosition=[eyePosition[0]+Math.cos(radW)*5.0,eyePosition[1]+Math.sin(radH)*5.0,eyePosition[2]+Math.sin(radW)*5.0];
    //upPosition=[upPosition[0],Math.sin(radH),upPosition[2]+Math.cos(radH)];
    //upPosition=[upPosition[0],Math.sin(radH),upPosition[2]];
    //  console.log("centerPosition"+centerPosition);
    //console.log("upPosition"+upPosition);
    // ビュー×プロジェクション座標変換行列
    //m.lookAt(eyePosition, centerPosition, upPosition, vMatrix);
    var eyeCam = [];
    eyeCam[0] = eyePosition[0] + camforward[0];
    eyeCam[1] = eyePosition[1] + camforward[1];
    eyeCam[2] = eyePosition[2] + camforward[2];
    m.lookAt(eyePosition, eyeCam, camUp, vMatrix);

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

    m.identity(mMatrix);
    m.translate(mMatrix, [0.0, 0.0, 5.0], mMatrix);
    m.scale(mMatrix, [10.0, 10.0, 10.0], mMatrix);
    m.rotate(mMatrix, 180, [1, 0, 0], mMatrix);

    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    //uniformを登録
    _gl.bindTexture(_gl.TEXTURE_2D, sphereTexture);
    _gl.uniform1i(_overallData.uniLocation[1], 0);
    _gl.uniformMatrix4fv(_overallData.uniLocation[0], false, mvpMatrix);

    _gl.drawElements(_gl.TRIANGLES, _inSphereData.index.length, _gl.UNSIGNED_SHORT, 0);

    // VBOとIBOの登録
    set_attribute(_gl, _overallData.VBOList, _overallData.attLocation, _overallData.attStride);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _overallData.iIndex);
    _gl.enable(_gl.BLEND);
    if (_texture) {
        for (var i = 0; i < _texture.length; i++) {
            _posY[i] -= 0.1;
            // _posZ[i]-=0.40;
            _posZm[i] += 1.0;
            if (_posZ[i] < -100) {
                // カメラより前にすすんだら、配列を減らす処理が微妙
                console.log("削除してます");
                _texture.shift();
                _posX.shift();
                _posY.shift();
                _posZ.shift();
                _getnumber--;
            } else if (_posZm[i] > 10) {
                console.log("削除してます");
                _texture.shift();
                _posXm.shift();
                _posYm.shift();
                _posZm.shift();
                _getnumber--;
            }
            bindPlatePoly(_gl, _m, mMatrix, _rad, tmpMatrix, mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i], true);
        }
    }
}
function bindPlatePoly(_gl, _m, _mMatrix, _rad, _tmpMatrix, _mvpMatrix, _uniLocation, _number, _posX, _posY, _posZ, _posXm, _posYm, _posZm, _scaleFrag) {
    // モデル座標変換行列の生成
    _m.identity(_mMatrix);
    _m.translate(_mMatrix, [_posX, _posY, _posZ], _mMatrix);
    if (_scaleFrag) {
        _m.scale(_mMatrix, [0.5, 0.5, 0.5], _mMatrix);
    }
    _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);

    // テクスチャをバインドする
    _gl.bindTexture(_gl.TEXTURE_2D, texture[_number]);

    // uniform変数にテクスチャを登録
    _gl.uniform1i(_uniLocation[1], 0);

    // uniform変数の登録と描画
    _gl.uniformMatrix4fv(_uniLocation[0], false, _mvpMatrix);
    _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);

    _m.identity(_mMatrix);
    _m.translate(_mMatrix, [_posXm, _posYm, _posZm], _mMatrix);
    if (_scaleFrag) {
        _m.scale(_mMatrix, [0.5, 0.5, 0.5], _mMatrix);
    }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQUNBLElBQUksVUFBUSxFQUFaO0FBQ0E7QUFDQSxJQUFJLGdCQUFjLElBQWxCOztBQUVBO0FBQ0EsSUFBSSxFQUFKLEVBQU8sRUFBUCxFQUFVLEVBQVYsRUFBYSxFQUFiO0FBQ0E7QUFDQSxJQUFJLFNBQU8sQ0FBWDtBQUNBO0FBQ0EsSUFBSSxFQUFKO0FBQ0E7QUFDQSxJQUFJLGVBQWEsQ0FBakI7QUFDQSxJQUFJLGVBQWEsQ0FBakI7QUFDQSxPQUFPLE1BQVAsR0FBYyxZQUFVO0FBQ3BCLFNBQUcsT0FBTyxVQUFWO0FBQ0EsU0FBRyxPQUFPLFdBQVY7QUFDSCxDQUhEO0FBSUEsT0FBTyxNQUFQLEdBQWMsWUFBVTtBQUNwQixRQUFJLFNBQVEsSUFBWjtBQUNBO0FBQ0EsUUFBSSxJQUFJLFNBQVMsY0FBVCxDQUF3QixRQUF4QixDQUFSO0FBQ0EsU0FBRyxPQUFPLFVBQVY7QUFDQSxTQUFHLE9BQU8sV0FBVjtBQUNBLE1BQUUsS0FBRixHQUFVLEVBQVY7QUFDQSxNQUFFLE1BQUYsR0FBVyxFQUFYOztBQUVBO0FBQ0EsYUFBUyxnQkFBVCxDQUEwQixTQUExQixFQUFzQyxPQUF0QztBQUNBO0FBQ0EsTUFBRSxnQkFBRixDQUFtQixXQUFuQixFQUErQixTQUEvQixFQUF5QyxJQUF6QztBQUNBO0FBQ0EsU0FBSyxFQUFFLFVBQUYsQ0FBYSxPQUFiLEtBQXlCLEVBQUUsVUFBRixDQUFhLG9CQUFiLENBQTlCOztBQUVBO0FBQ0EsUUFBSSxpQkFBZSxlQUFlLEVBQWYsRUFBa0IsS0FBbEIsRUFBd0IsS0FBeEIsQ0FBbkI7O0FBRUEsUUFBSSxnQkFBYyxlQUFlLEVBQWYsRUFBa0IsS0FBbEIsRUFBd0IsYUFBeEIsQ0FBbEI7O0FBRUE7QUFD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RCxJQUFJLGFBQTFEO0FBQ0EsUUFBSSxhQUFKLENBQWtCLElBQUksVUFBdEIsRUFBa0MsSUFBSSxjQUF0QyxFQUFzRCxJQUFJLGFBQTFEOztBQUVBO0FBQ0EsUUFBSSxvQkFBSixDQUF5QixJQUFJLFdBQTdCLEVBQTBDLElBQUksaUJBQTlDLEVBQWlFLElBQUksVUFBckUsRUFBaUYsUUFBakYsRUFBMkYsQ0FBM0Y7O0FBRUE7QUFDQSxRQUFJLFdBQUosQ0FBZ0IsSUFBSSxVQUFwQixFQUFnQyxJQUFoQztBQUNBLFFBQUksZ0JBQUosQ0FBcUIsSUFBSSxZQUF6QixFQUF1QyxJQUF2QztBQUNBLFFBQUksZUFBSixDQUFvQixJQUFJLFdBQXhCLEVBQXFDLElBQXJDOztBQUVBO0FBQ0EsV0FBTyxFQUFDLEdBQUksV0FBTCxFQUFrQixHQUFJLGlCQUF0QixFQUF5QyxHQUFJLFFBQTdDLEVBQVA7QUFDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcbi8vIOODhuOCr+OCueODgeODo+eUqOWkieaVsOOBruWuo+iogFxyXG52YXIgdGV4dHVyZT1bXTtcclxuLy/nkIPkvZPog4zmma/jga7jg4bjgq/jgrnjg4Hjg6NcclxudmFyIHNwaGVyZVRleHR1cmU9bnVsbDtcclxuXHJcbi8v44Oe44Km44K544Gu5L2N572u44CB55S75YOP44Gu5aSn44GN44GV44CB6IOM5pmv44K344Kn44O844OA44O844Gr5rih44GZ44KC44GuXHJcbnZhciBteCxteSxjdyxjaDtcclxuLy/og4zmma/jgpLliIfjgormm7/jgYjjgovjgoLjga5cclxudmFyIHNlbGVjdD0xO1xyXG4vL3dlYmds44Gu44GE44KN44KT44Gq44KC44Gu44GM5YWl44Gj44Gm44KLXHJcbnZhciBnbDtcclxuLy8z55Wq6IOM5pmv44Gu44Go44GN44Gr6IOM5pmv44KS5YuV44GL44GZ44Go44GN44Gr44Gk44GL44GGXHJcbnZhciBzcGhlcmVDb3VudFc9MDtcclxudmFyIHNwaGVyZUNvdW50SD0wO1xyXG53aW5kb3cucmVzaXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxufTtcclxud2luZG93Lm9ubG9hZD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHNvY2tldCA9aW8oKTtcclxuICAgIC8vIGNhbnZhc+OCqOODrOODoeODs+ODiOOCkuWPluW+l1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIGMud2lkdGggPSBjdztcclxuICAgIGMuaGVpZ2h0ID0gY2g7XHJcblxyXG4gICAgLy/jgq3jg7zjgYzmirzjgZXjgozjgZ/jgolcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIgLCBLZXlEb3duKTtcclxuICAgIC8vY2FudmFz5LiK44Gn44Oe44Km44K544GM5YuV44GE44Gf44KJXHJcbiAgICBjLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIixtb3VzZU1vdmUsdHJ1ZSk7XHJcbiAgICAvLyB3ZWJnbOOCs+ODs+ODhuOCreOCueODiOOCkuWPluW+l1xyXG4gICAgZ2wgPSBjLmdldENvbnRleHQoJ3dlYmdsJykgfHwgYy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcclxuXHJcbiAgICAvLyDog4zmma/lgbTjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBiYWNrZ3JvdW5kRGF0YT1pbml0QmFja2dyb3VuZChnbCxcInR2c1wiLFwidGZzXCIpO1xyXG5cclxuICAgIHZhciBpbnRlbnNpdmVEYXRhPWluaXRCYWNrZ3JvdW5kKGdsLFwidHZzXCIsXCJpbnRlbnNpdmVGc1wiKTtcclxuXHJcbiAgICAvLyDlhajkvZPjga7jg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJDjgajjg6rjg7Pjgq9cclxuICAgIC8vc3BoZXJlU2NlbmXjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBpblNwaGVyZURhdGE9aW5pdEluU3BoZXJlKGdsKTtcclxuICAgIC8vIOWFqOS9k+eahOOBruWIneacn+ioreWumlxyXG4gICAgdmFyIG92ZXJhbGxEYXRhPWluaXRPdmVyYWxsKGdsKTtcclxuXHJcblxyXG4gICAgLy8g5ZCE56iu6KGM5YiX44Gu55Sf5oiQ44Go5Yid5pyf5YyWXHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIC8vIOODk+ODpeODvMOX44OX44Ot44K444Kn44Kv44K344On44Oz5bqn5qiZ5aSJ5o+b6KGM5YiXXHJcbiAgICB2YXIgZXllUG9zaXRpb249WzAuMCwgMC4wLCA1LjBdO1xyXG4gICAgdmFyIGNlbnRlclBvc2l0aW9uPVswLjAsIDAuMCwgMC4wXTtcclxuICAgIHZhciB1cFBvc2l0aW9uPVswLjAsIDEuMCwgMC4wXTtcclxuICAgIG0ubG9va0F0KGV5ZVBvc2l0aW9uLCBjZW50ZXJQb3NpdGlvbiwgdXBQb3NpdGlvbiwgdk1hdHJpeCk7XHJcbiAgICBtLnBlcnNwZWN0aXZlKDQ1LCBjLndpZHRoIC8gYy5oZWlnaHQsIDAuMSwgMTAwLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuICAgIC8vIOa3seW6puODhuOCueODiOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xyXG4gICAgZ2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XHJcbiAgICAvLyDmnInlirnjgavjgZnjgovjg4bjgq/jgrnjg4Hjg6Pjg6bjg4vjg4Pjg4jjgpLmjIflrppcclxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xyXG5cclxuICAgIC8v44OG44Kv44K544OB44Oj44GueeW6p+aomVxyXG4gICAgdmFyIHBvc1g9W107XHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NZPVtdO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga565bqn5qiZXHJcbiAgICB2YXIgcG9zWj1bXTtcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NYbT1bXTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueeW6p+aomVxyXG4gICAgdmFyIHBvc1ltPVtdO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga565bqn5qiZXHJcbiAgICB2YXIgcG9zWm09W107XHJcblxyXG5cclxuXHJcbiAgICAvL3NvY2tldOOBruOCpOODmeODs+ODiOOBjOS9leWbnuOBjeOBn+OBi+OBl+OCieOBueOCi1xyXG4gICAgdmFyIGdldG51bWJlcj0wO1xyXG5cclxuICAgIHZhciBqb0ZyYWc9ZmFsc2U7XHJcblxyXG5cclxuICAgIC8v44K144O844OQ44O844GL44KJ44OH44O844K/44KS5Y+X44GR5Y+W44KLXHJcbiAgICBzb2NrZXQub24oXCJwdXNoSW1hZ2VGcm9tU2VydmVyXCIsZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgaWYoam9GcmFnKXtcclxuICAgICAgICAgICAgY3JlYXRlX3RleHR1cmUoZ2wsXCIuLi9pbWcvam9lLmpwZ1wiLGdldG51bWJlcik7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGNyZWF0ZV90ZXh0dXJlKGdsLGRhdGEuaW1nZGF0YSxnZXRudW1iZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhcImRhdGEuZnJhZ1wiK2RhdGEuZnJhZyk7XHJcbiAgICAgICAgLy/nnJ/jgpPkuK3jga7jg5zjgr/jg7PjgpLmirzjgZfjgZ/jgYvjganjgYbjgYtcclxuICAgICAgICBpZihkYXRhLmZyYWc9PXRydWUpe1xyXG4gICAgICAgICAgICBwb3NYbVtnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgICAgIHBvc1ltW2dldG51bWJlcl09MDtcclxuICAgICAgICAgICAgcG9zWm1bZ2V0bnVtYmVyXT0tOTU7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHBvc1hbZ2V0bnVtYmVyXT1kYXRhLngqNS4wO1xyXG4gICAgICAgICAgICBwb3NZW2dldG51bWJlcl09ZGF0YS55KjUuMDtcclxuICAgICAgICAgICAgcG9zWltnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLy9zZWxlY3RcclxuICAgICAgICBpZihzZWxlY3Q9PTMpe1xyXG4gICAgICAgICAgICBwb3NYW2dldG51bWJlcl09ZGF0YS54KjUuMDtcclxuICAgICAgICAgICAgcG9zWVtnZXRudW1iZXJdPTUuMDtcclxuICAgICAgICAgICAgcG9zWltnZXRudW1iZXJdPWRhdGEueTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2V0bnVtYmVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0dXJlKTtcclxuICAgICAgICBnZXRudW1iZXIrKztcclxuICAgIH0pO1xyXG4gICAgLy9qb+OBleOCk+ODnOOCv+ODs+OCkuaKvOOBl+OBn+OBi+OBqeOBhuOBi+OCkuODgeOCp+ODg+OCr1xyXG4gICAgc29ja2V0Lm9uKFwicHVzaEpvRnJhZ0Zyb21TZXJ2ZXJcIixmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmpvRnJhZyk7XHJcbiAgICAgICAgaWYoZGF0YS5qb0ZyYWc9PT10cnVlKXtcclxuICAgICAgICAgICAgam9GcmFnPXRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvL+acgOWIneOBq2pv44GV44KT44OV44Op44Kw44KSZmFsc2XjgavjgZnjgovjgojjgYbjgavjg6Hjg4Pjgrvjg7zjgrjjgpLpgIHjgotcclxuICAgIHNvY2tldC5lbWl0KFwicHVzaEpvRnJhZ0Zyb21TY3JlZW5cIix7XHJcbiAgICAgICAgICAgIGpvRnJhZzpmYWxzZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBruWPluW+l1xyXG4gICAgdmFyIGZCdWZmZXJXaWR0aCAgPSBjdztcclxuICAgIHZhciBmQnVmZmVySGVpZ2h0ID0gY2g7XHJcbiAgICB2YXIgZkJ1ZmZlciA9IGNyZWF0ZV9mcmFtZWJ1ZmZlcihnbCxmQnVmZmVyV2lkdGgsIGZCdWZmZXJIZWlnaHQpO1xyXG4gICAgLy8g44Kr44Km44Oz44K/44Gu5a6j6KiAXHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdmFyIGNvdW50Mj0wO1xyXG4gICAgLy/kuIDlv5xcclxuICAgIG14PTAuNTtteT0wLjU7XHJcbiAgICB2YXIgc3RhcnRUaW1lPW5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgIC8v44OW44Os44Oz44OJ44OV44Kh44Oz44Kv44GX44Gm44KL44GeXHJcbiAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xyXG4gICAgXHJcbiAgICAvLyDmgZLluLjjg6vjg7zjg5dcclxuICAgIChmdW5jdGlvbiBsb29wKCl7XHJcbiAgICAgICAgLy8g44Kr44Km44Oz44K/44KS5YWD44Gr44Op44K444Ki44Oz44KS566X5Ye6XHJcbiAgICAgICAgY291bnQrKztcclxuICAgICAgICBpZiAoY291bnQgJSAxMCA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb3VudDIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGhzdj1oc3ZhKGNvdW50MiUzNjAsMSwxLDEpO1xyXG4gICAgICAgIHZhciByYWQgPSAoY291bnQgJSAzNjApICogTWF0aC5QSSAvIDE4MDtcclxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS3jg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqEtLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuICAgICAgICAvL+aZgumWk1xyXG4gICAgICAgIHZhciB0aW1lPShuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkqMC4wMDE7XHJcbiAgICAgICAgLyotLeODleODrOODvOODoOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODiS0tKi9cclxuICAgICAgICBpZihzZWxlY3Q9PTEpe1xyXG4gICAgICAgICAgICBiaW5kQmFja2dyb3VuZChnbCxmQnVmZmVyLGJhY2tncm91bmREYXRhLHRpbWUsbXgsbXksY3csY2gsaHN2KTtcclxuICAgICAgICB9ZWxzZSBpZihzZWxlY3Q9PTIpe1xyXG4gICAgICAgICAgICBiaW5kQmFja2dyb3VuZChnbCxmQnVmZmVyLGludGVuc2l2ZURhdGEsdGltZSxteCxteSxjdyxjaCxoc3YpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy/lhajkvZPnmoTjgapcclxuICAgICAgICAvL3NoYWRlckJhY2tncm91bmTjga7loLTlkIhcclxuICAgICAgICBpZihzZWxlY3Q9PTF8fHNlbGVjdD09Mil7XHJcbiAgICAgICAgICAgIGJpbmRPdmVyYWxsKGdsLG92ZXJhbGxEYXRhLGZCdWZmZXIsbSxtTWF0cml4LHRtcE1hdHJpeCxtdnBNYXRyaXgscmFkLHRleHR1cmUscG9zWCxwb3NZLHBvc1oscG9zWG0scG9zWW0scG9zWm0sZ2V0bnVtYmVyKTtcclxuICAgICAgICB9ZWxzZSBpZihzZWxlY3Q9PTMpe1xyXG4gICAgICAgICAgICAvLyBiaW5kSW5TcGhlcmUoYyxnbCxvdmVyYWxsRGF0YSxbMCwgMCwgMF0sWzAsIDEsIDBdLGluU3BoZXJlRGF0YSxmQnVmZmVyLG0sbU1hdHJpeCxwTWF0cml4LHRtcE1hdHJpeCxtdnBNYXRyaXgscmFkLHRleHR1cmUscG9zWCxwb3NZLHBvc1osZ2V0bnVtYmVyLHNwaGVyZUNvdW50VyxzcGhlcmVDb3VudEgpO1xyXG4gICAgICAgICAgICBiaW5kSW5TcGhlcmUoYyxnbCxvdmVyYWxsRGF0YSxjZW50ZXJQb3NpdGlvbix1cFBvc2l0aW9uLGluU3BoZXJlRGF0YSxmQnVmZmVyLG0sbU1hdHJpeCxwTWF0cml4LHRtcE1hdHJpeCxtdnBNYXRyaXgscmFkLHRleHR1cmUscG9zWCxwb3NZLHBvc1oscG9zWG0scG9zWW0scG9zWm0sZ2V0bnVtYmVyLHNwaGVyZUNvdW50VyxzcGhlcmVDb3VudEgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDjgrPjg7Pjg4bjgq3jgrnjg4jjga7lho3mj4/nlLtcclxuICAgICAgICBnbC5mbHVzaCgpO1xyXG4gICAgICAgIC8v44K/44OW44GM6Z2e44Ki44Kv44OG44Kj44OW44Gu5aC05ZCI44GvRlBT44KS6JC944Go44GZXHJcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xyXG4gICAgfSkoKTtcclxuXHJcbn07XHJcbmZ1bmN0aW9uIEtleURvd24oZSl7XHJcbiAgICBpZihlLmtleUNvZGU9PTQ5KXtcclxuICAgICAgICAvLzHjgpLmirzjgZfjgZ/jgolcclxuICAgICAgICBzZWxlY3Q9MTtcclxuICAgIH1lbHNlIGlmKGUua2V5Q29kZT09NTApe1xyXG4gICAgICAgIC8vMuOCkuaKvOOBl+OBn+OCiVxyXG4gICAgICAgIHNlbGVjdD0yO1xyXG4gICAgfWVsc2UgaWYoZS5rZXlDb2RlPT01MSl7XHJcbiAgICAgICAgc2VsZWN0PTM7XHJcbiAgICAgICAgY3JlYXRlU3BoZXJlVGV4dHVyZShnbCxcIi4uL2ltZy90ZXN0LmpwZ1wiKTtcclxuICAgIH1cclxuXHJcbiAgICAvL+WNgeWtl+OCreODvFxyXG4gICAgICAgIGlmKGUua2V5Q29kZT09Mzcpe1xyXG4gICAgICAgICAgICAvL+W3plxyXG4gICAgICAgICAgICBzcGhlcmVDb3VudFcrKztcclxuICAgICAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTM5KXtcclxuICAgICAgICAgICAgLy/lj7NcclxuICAgICAgICAgICAgc3BoZXJlQ291bnRXLS07XHJcbiAgICAgICAgfWVsc2UgaWYoZS5rZXlDb2RlPT0zOCl7XHJcbiAgICAgICAgICAgIC8v5LiKXHJcbiAgICAgICAgICAgIHNwaGVyZUNvdW50SC0tO1xyXG4gICAgICAgIH1lbHNlIGlmKGUua2V5Q29kZT09NDApe1xyXG4gICAgICAgICAgICAvL+S4i1xyXG4gICAgICAgICAgICBzcGhlcmVDb3VudEgrKztcclxuICAgICAgICB9XHJcblxyXG59XHJcbmZ1bmN0aW9uIG1vdXNlTW92ZShlKXtcclxuICAgIG14PWUub2Zmc2V0WC9jdztcclxuICAgIG15PWUub2Zmc2V0WS9jaDtcclxufVxyXG5mdW5jdGlvbiBpbml0QmFja2dyb3VuZChfZ2wsX3ZzSWQsX2ZzSWQpe1xyXG4gICAgdmFyIHByZz1jcmVhdGVfcHJvZ3JhbShfZ2wsY3JlYXRlX3NoYWRlcihfZ2wsX3ZzSWQpLGNyZWF0ZV9zaGFkZXIoX2dsLF9mc0lkKSk7XHJcbiAgICB2YXIgdW5pTG9jYXRpb249W107XHJcbiAgICB1bmlMb2NhdGlvblswXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcInRpbWVcIik7XHJcbiAgICB1bmlMb2NhdGlvblsxXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcIm1vdXNlXCIpO1xyXG4gICAgdW5pTG9jYXRpb25bMl09X2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsXCJpUmVzb2x1dGlvblwiKTtcclxuICAgIHVuaUxvY2F0aW9uWzNdPV9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLFwiaHN2XCIpO1xyXG5cclxuICAgIHZhciBQb3NpdGlvbj1bXHJcbiAgICAtMS4wLDEuMCwwLjAsXHJcbiAgICAxLjAsMS4wLDAuMCxcclxuICAgIC0xLjAsLTEuMCwwLjAsXHJcbiAgICAxLjAsLTEuMCwwLjAsXHJcbiAgICBdO1xyXG4gICAgdmFyIEluZGV4PVtcclxuICAgIDAsMiwxLFxyXG4gICAgMSwyLDNcclxuICAgIF07XHJcbiAgICB2YXIgdlBvc2l0aW9uPWNyZWF0ZV92Ym8oX2dsLFBvc2l0aW9uKTtcclxuICAgIHZhciB2SW5kZXg9Y3JlYXRlX2libyhfZ2wsSW5kZXgpO1xyXG4gICAgdmFyIHZBdHRMb2NhdGlvbj1fZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLFwicG9zaXRpb25cIik7XHJcblxyXG4gICAgcmV0dXJue3ByZzpwcmcsdW5pTG9jYXRpb246dW5pTG9jYXRpb24sdlBvc2l0aW9uOnZQb3NpdGlvbix2SW5kZXg6dkluZGV4LGF0dExvY2F0aW9uOnZBdHRMb2NhdGlvbn07XHJcbn1cclxuZnVuY3Rpb24gaW5pdEluU3BoZXJlKF9nbCl7XHJcbiAgICB2YXIgZWFydGhEYXRhICAgICA9IHNwaGVyZSg2NCwgNjQsIDEuMCwgWzEuMCwgMS4wLCAxLjAsIDEuMF0pO1xyXG4gICAgdmFyIGVQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKF9nbCxlYXJ0aERhdGEucCk7XHJcbiAgICB2YXIgZUNvbG9yICAgICAgICA9IGNyZWF0ZV92Ym8oX2dsLGVhcnRoRGF0YS5jKTtcclxuICAgIHZhciBlVGV4dHVyZUNvb3JkID0gY3JlYXRlX3ZibyhfZ2wsZWFydGhEYXRhLnQpO1xyXG4gICAgdmFyIGVWQk9MaXN0ICAgICAgPSBbZVBvc2l0aW9uLGVDb2xvciwgZVRleHR1cmVDb29yZF07XHJcbiAgICB2YXIgZUluZGV4ICAgICAgICA9IGNyZWF0ZV9pYm8oX2dsLGVhcnRoRGF0YS5pKTtcclxuXHJcbiAgICByZXR1cm4ge1ZCT0xpc3Q6ZVZCT0xpc3QsaUluZGV4OmVJbmRleCxpbmRleDplYXJ0aERhdGEuaX1cclxufVxyXG5mdW5jdGlvbiBpbml0T3ZlcmFsbChfZ2wsKXtcclxuICAgIC8vIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkOOBqOODquODs+OCr1xyXG4gICAgIHZhciBwcmcgPSBjcmVhdGVfcHJvZ3JhbShfZ2wsY3JlYXRlX3NoYWRlcihfZ2wsJ3ZzJyksIGNyZWF0ZV9zaGFkZXIoX2dsLCdmcycpKTtcclxuXHJcbiAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkumFjeWIl+OBq+WPluW+l1xyXG4gICAgdmFyIGF0dExvY2F0aW9uID0gW107XHJcbiAgICBhdHRMb2NhdGlvblswXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdwb3NpdGlvbicpO1xyXG4gICAgYXR0TG9jYXRpb25bMV0gPSBfZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAnY29sb3InKTtcclxuICAgIGF0dExvY2F0aW9uWzJdID0gX2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZywgJ3RleHR1cmVDb29yZCcpO1xyXG4gICAgLy8gYXR0cmlidXRl44Gu6KaB57Sg5pWw44KS6YWN5YiX44Gr5qC857SNXHJcbiAgICB2YXIgYXR0U3RyaWRlID0gW107XHJcbiAgICBhdHRTdHJpZGVbMF0gPSAzO1xyXG4gICAgYXR0U3RyaWRlWzFdID0gNDtcclxuICAgIGF0dFN0cmlkZVsyXSA9IDI7XHJcbiAgICAvLyDpoILngrnjga7kvY3nva5cclxuICAgIHZhciBwb3NpdGlvbiA9IFtcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgICAxLjAsICAxLjAsICAwLjAsXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAtMS4wLCAgMC4wXHJcbiAgICBdO1xyXG4gICAgLy8g6aCC54K56ImyXHJcbiAgICB2YXIgY29sb3IgPSBbXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wXHJcbiAgICBdO1xyXG4gICAgLy8g44OG44Kv44K544OB44Oj5bqn5qiZXHJcbiAgICB2YXIgdGV4dHVyZUNvb3JkID0gW1xyXG4gICAgICAgIDAuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgMC4wLFxyXG4gICAgICAgIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wXHJcbiAgICBdO1xyXG4gICAgLy8g6aCC54K544Kk44Oz44OH44OD44Kv44K5XHJcbiAgICB2YXIgaW5kZXggPSBbXHJcbiAgICAgICAgMCwgMSwgMixcclxuICAgICAgICAzLCAyLCAxXHJcbiAgICBdO1xyXG4gICAgLy8gVkJP44GoSUJP44Gu55Sf5oiQXHJcbiAgICB2YXIgdlBvc2l0aW9uICAgICA9IGNyZWF0ZV92Ym8oX2dsLHBvc2l0aW9uKTtcclxuICAgIHZhciB2Q29sb3IgICAgICAgID0gY3JlYXRlX3ZibyhfZ2wsY29sb3IpO1xyXG4gICAgdmFyIHZUZXh0dXJlQ29vcmQgPSBjcmVhdGVfdmJvKF9nbCx0ZXh0dXJlQ29vcmQpO1xyXG4gICAgdmFyIFZCT0xpc3QgICAgICAgPSBbdlBvc2l0aW9uLCB2Q29sb3IsIHZUZXh0dXJlQ29vcmRdO1xyXG4gICAgdmFyIGlJbmRleCAgICAgICAgPSBjcmVhdGVfaWJvKF9nbCxpbmRleCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybUxvY2F0aW9u44KS6YWN5YiX44Gr5Y+W5b6XXHJcbiAgICB2YXIgdW5pTG9jYXRpb24gPSBbXTtcclxuICAgIHVuaUxvY2F0aW9uWzBdICA9IF9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAnbXZwTWF0cml4Jyk7XHJcbiAgICB1bmlMb2NhdGlvblsxXSAgPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ3RleHR1cmUnKTtcclxuXHJcbiAgICByZXR1cm57cHJnOnByZyxhdHRMb2NhdGlvbjphdHRMb2NhdGlvbixhdHRTdHJpZGU6YXR0U3RyaWRlLFZCT0xpc3Q6VkJPTGlzdCxpSW5kZXg6aUluZGV4LHVuaUxvY2F0aW9uOnVuaUxvY2F0aW9ufTtcclxufVxyXG5mdW5jdGlvbiBiaW5kQmFja2dyb3VuZChfZ2wsX2ZCdWZmZXIsX2JhY2tncm91bmREYXRhLF90aW1lLF9teCxfbXksX2N3LF9jaCxfaHN2KXtcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLF9mQnVmZmVyLmYpO1xyXG4gICAgX2dsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgIF9nbC5jbGVhcihfZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgX2dsLnVzZVByb2dyYW0oX2JhY2tncm91bmREYXRhLnByZyk7XHJcbiAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLnhKHlirnjgavjgZnjgotcclxuICAgIF9nbC5kaXNhYmxlKF9nbC5CTEVORCk7XHJcbiAgICAvL2F0dHJpYnV0ZeOBrueZu+mMslxyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkFSUkFZX0JVRkZFUixfYmFja2dyb3VuZERhdGEudlBvc2l0aW9uKTtcclxuICAgIF9nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShfYmFja2dyb3VuZERhdGEudkF0dExvY2F0aW9uKTtcclxuICAgIF9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKF9iYWNrZ3JvdW5kRGF0YS52QXR0TG9jYXRpb24sMyxfZ2wuRkxPQVQsZmFsc2UsMCwwKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUixfYmFja2dyb3VuZERhdGEudkluZGV4KTtcclxuXHJcbiAgICBfZ2wudW5pZm9ybTFmKF9iYWNrZ3JvdW5kRGF0YS51bmlMb2NhdGlvblswXSxfdGltZSk7XHJcbiAgICBfZ2wudW5pZm9ybTJmdihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMV0sW19teCxfbXldKTtcclxuICAgIF9nbC51bmlmb3JtMmZ2KF9iYWNrZ3JvdW5kRGF0YS51bmlMb2NhdGlvblsyXSxbX2N3LF9jaF0pO1xyXG4gICAgX2dsLnVuaWZvcm00ZnYoX2JhY2tncm91bmREYXRhLnVuaUxvY2F0aW9uWzNdLFtfaHN2WzBdLF9oc3ZbMV0sX2hzdlsyXSxfaHN2WzNdXSk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsNixfZ2wuVU5TSUdORURfU0hPUlQsMCk7XHJcblxyXG4gICAgX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsbnVsbCk7XHJcblxyXG59XHJcbmZ1bmN0aW9uIGJpbmRPdmVyYWxsKF9nbCxfb3ZlcmFsbERhdGEsX2ZCdWZmZXIsX20sX21NYXRyaXgsX3RtcE1hdHJpeCxfbXZwTWF0cml4LF9yYWQsX3RleHR1cmUsX3Bvc1gsX3Bvc1ksX3Bvc1osX3Bvc1htLF9wb3NZbSxfcG9zWm0sX2dldG51bWJlciwpe1xyXG4gICAgLy8gY2FudmFz44KS5Yid5pyf5YyWXHJcbiAgICBfZ2wuY2xlYXJDb2xvcigwLjAsMC4wLDAuMCwxLjApO1xyXG4gICAgX2dsLmNsZWFyRGVwdGgoMS4wKTtcclxuICAgIF9nbC5jbGVhcihfZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IF9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLeiDjOaZr+ODhuOCr+OCueODgeODoyjjgqrjg5Xjgrnjgq/jg6rjg7zjg7Pjg6zjg7Pjgr/jg6rjg7PjgrApLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuICAgIF9nbC51c2VQcm9ncmFtKF9vdmVyYWxsRGF0YS5wcmcpO1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS54Sh5Yq544Gr44GZ44KLXHJcbiAgICBfZ2wuZGlzYWJsZShfZ2wuQkxFTkQpO1xyXG4gICAgLy8gVkJP44GoSUJP44Gu55m76YyyXHJcbiAgICBzZXRfYXR0cmlidXRlKF9nbCxfb3ZlcmFsbERhdGEuVkJPTGlzdCwgX292ZXJhbGxEYXRhLmF0dExvY2F0aW9uLCBfb3ZlcmFsbERhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX292ZXJhbGxEYXRhLmlJbmRleCk7XHJcbiAgICAvKuenu+WLleOAgeWbnui7ouOAgeaLoeWkp+e4ruWwjyovXHJcbiAgICBfbS5pZGVudGl0eShfbU1hdHJpeCk7XHJcbiAgICBfbS50cmFuc2xhdGUoX21NYXRyaXgsWzAuMCwwLjAsLTk1LjBdLF9tTWF0cml4KTtcclxuICAgIF9tLnNjYWxlKF9tTWF0cml4LFsxMDAuMCw3MC4wLDEuMF0sX21NYXRyaXgpO1xyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgLy91bmlmb3Jt44KS55m76YyyXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsX2ZCdWZmZXIudCk7XHJcbiAgICBfZ2wudW5pZm9ybTFpKF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvblsxXSwgMCk7XHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMF0sIGZhbHNlLCBfbXZwTWF0cml4KTtcclxuICAgIF9nbC5kcmF3RWxlbWVudHMoX2dsLlRSSUFOR0xFUywgNiwgX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICAvKuODhuOCr+OCueODgeODoyovXHJcbiAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLmnInlirnjgavjgZnjgotcclxuXHJcbiAgICBfZ2wuZW5hYmxlKF9nbC5CTEVORCk7XHJcbiAgIGlmKF90ZXh0dXJlKXtcclxuICAgICAgIGZvcih2YXIgaT0wO2k8X3RleHR1cmUubGVuZ3RoO2krKyl7XHJcblxyXG4gICAgICAgIF9wb3NaW2ldLT0wLjQwO1xyXG4gICAgICAgIF9wb3NabVtpXSs9MS4wO1xyXG4gICAgICAgIGlmKF9wb3NaW2ldPC0xMDApe1xyXG4gICAgICAgICAgICAvLyDjgqvjg6Hjg6njgojjgorliY3jgavjgZnjgZnjgpPjgaDjgonjgIHphY3liJfjgpLmuJvjgonjgZnlh6bnkIbjgYzlvq7lpplcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgIF90ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NaLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXItLTtcclxuICAgICAgICB9ZWxzZSBpZihfcG9zWm1baV0+MTApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgX3RleHR1cmUuc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1htLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWm0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX2dldG51bWJlci0tO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiaW5kUGxhdGVQb2x5KF9nbCxfbSxfbU1hdHJpeCxfcmFkLF90bXBNYXRyaXgsX212cE1hdHJpeCxfb3ZlcmFsbERhdGEudW5pTG9jYXRpb24saSxfcG9zWFtpXSxfcG9zWVtpXSxfcG9zWltpXSxfcG9zWG1baV0sX3Bvc1ltW2ldLF9wb3NabVtpXSxmYWxzZSk7XHJcbiAgICAgICB9XHJcbiAgIH1cclxufVxyXG5mdW5jdGlvbiBiaW5kSW5TcGhlcmUoX2MsX2dsLF9vdmVyYWxsRGF0YSxfY2VudGVyUG9zaXRpb24sX3VwUG9zaXRpb24sX2luU3BoZXJlRGF0YSxfZkJ1ZmZlcixfbSxfbU1hdHJpeCxfcE1hdHJpeCxfdG1wTWF0cml4LF9tdnBNYXRyaXgsX3JhZCxfdGV4dHVyZSxfcG9zWCxfcG9zWSxfcG9zWixfcG9zWG0sX3Bvc1ltLF9wb3NabSxfZ2V0bnVtYmVyLF9zcGhlcmVDb3VudFcsX3NwaGVyZUNvdW50SCl7XHJcbiAgICAgdmFyIHJhZFcgPSAoX3NwaGVyZUNvdW50VyAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgIHZhciByYWRIID0gKF9zcGhlcmVDb3VudEggJSAzNjApICogTWF0aC5QSSAvIDE4MDtcclxuXHJcbiAgICAgLy8gdmFyIHJhZFcgPSAwO1xyXG4gICAgIC8vIHZhciByYWRIID0gMDtcclxuXHJcblxyXG4gICAgdmFyIG0gPSBuZXcgbWF0SVYoKTtcclxuICAgIHZhciBtTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHZNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgcE1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB0bXBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIG12cE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICAvLyDjg5Pjg6Xjg7zDl+ODl+ODreOCuOOCp+OCr+OCt+ODp+ODs+W6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgLy92YXIgZXllUG9zaXRpb249WzAuMCwgMC4wLCAtNS4wXTtcclxuICAgIHZhciBleWVQb3NpdGlvbj1bMC4wLCAwLjAsIDUuMF07XHJcbiAgICB2YXIgY2VudGVyUG9zaXRpb249WzAuMCwgMC4wLCAwLjBdO1xyXG4gICAgdmFyIHVwUG9zaXRpb249WzAuMCwgMS4wLCAwLjBdO1xyXG4gICAgLy9tLmxvb2tBdChleWVQb3NpdGlvbiwgY2VudGVyUG9zaXRpb24sIHVwUG9zaXRpb24sIHZNYXRyaXgpO1xyXG4gICAgbS5wZXJzcGVjdGl2ZSg0NSwgX2Mud2lkdGggLyBfYy5oZWlnaHQsIDAuMSwgMTAwLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuXHJcblxyXG52YXIgcT1uZXcgcXRuSVYoKTtcclxudmFyIGNhbVE9cS5pZGVudGl0eShxLmNyZWF0ZSgpKTtcclxudmFyIGNhbVc9cS5pZGVudGl0eShxLmNyZWF0ZSgpKTtcclxudmFyIGNhbUg9cS5pZGVudGl0eShxLmNyZWF0ZSgpKTtcclxuXHJcbnEucm90YXRlKHJhZFcsWzAsMSwwXSxjYW1XKTtcclxucS5yb3RhdGUocmFkSCxbMSwwLDBdLGNhbUgpO1xyXG4vL3EubXVsdGlwbHkoY2FtVyxjYW1ILGNhbVEpO1xyXG5xLm11bHRpcGx5KGNhbUgsY2FtVyxjYW1RKTtcclxudmFyIGNhbVVwPVtdO1xyXG52YXIgY2FtZm9yd2FyZD1bXTtcclxucS50b1ZlY0lJSSh1cFBvc2l0aW9uLGNhbVEsY2FtVXApO1xyXG4vL3EudG9WZWNJSUkoWzAuMCwwLjAsMS4wXSxjYW1RLGNhbWZvcndhcmQpO1xyXG5xLnRvVmVjSUlJKFswLjAsMC4wLC0xLjBdLGNhbVEsY2FtZm9yd2FyZCk7XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLeOCq+ODoeODqeOCkuWbnui7ouOBleOBm+OBpuOBhOOCi+OBkeOBqeOAgeOBvuOBoOOCq+ODoeODqeOBruWQkeOBjeOBjOOBhOOBvuOBhOOBoS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuICAgIC8vY2VudGVyUG9zaXRpb249W2V5ZVBvc2l0aW9uWzBdK01hdGguY29zKHJhZFcpKjUuMCxleWVQb3NpdGlvblsxXStNYXRoLnNpbihyYWRIKSo1LjAsZXllUG9zaXRpb25bMl0rTWF0aC5zaW4ocmFkVykqNS4wXTtcclxuICAgIC8vdXBQb3NpdGlvbj1bdXBQb3NpdGlvblswXSxNYXRoLnNpbihyYWRIKSx1cFBvc2l0aW9uWzJdK01hdGguY29zKHJhZEgpXTtcclxuICAgIC8vdXBQb3NpdGlvbj1bdXBQb3NpdGlvblswXSxNYXRoLnNpbihyYWRIKSx1cFBvc2l0aW9uWzJdXTtcclxuICAvLyAgY29uc29sZS5sb2coXCJjZW50ZXJQb3NpdGlvblwiK2NlbnRlclBvc2l0aW9uKTtcclxuICAgIC8vY29uc29sZS5sb2coXCJ1cFBvc2l0aW9uXCIrdXBQb3NpdGlvbik7XHJcbiAgICAvLyDjg5Pjg6Xjg7zDl+ODl+ODreOCuOOCp+OCr+OCt+ODp+ODs+W6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgLy9tLmxvb2tBdChleWVQb3NpdGlvbiwgY2VudGVyUG9zaXRpb24sIHVwUG9zaXRpb24sIHZNYXRyaXgpO1xyXG4gICAgdmFyIGV5ZUNhbT1bXTtcclxuICAgIGV5ZUNhbVswXT1leWVQb3NpdGlvblswXStjYW1mb3J3YXJkWzBdO1xyXG4gICAgZXllQ2FtWzFdPWV5ZVBvc2l0aW9uWzFdK2NhbWZvcndhcmRbMV07XHJcbiAgICBleWVDYW1bMl09ZXllUG9zaXRpb25bMl0rY2FtZm9yd2FyZFsyXTtcclxuICAgIG0ubG9va0F0KGV5ZVBvc2l0aW9uLCBleWVDYW0sIGNhbVVwLCB2TWF0cml4KTtcclxuXHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcblxyXG5cclxuICAgIC8vIGNhbnZhc+OCkuWIneacn+WMllxyXG4gICAgX2dsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgIF9nbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCBfZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgX2dsLnVzZVByb2dyYW0oX292ZXJhbGxEYXRhLnByZyk7XHJcbiAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLnhKHlirnjgavjgZnjgotcclxuICAgIF9nbC5kaXNhYmxlKF9nbC5CTEVORCk7XHJcbiAgICAvLyBWQk/jgahJQk/jga7nmbvpjLJcclxuICAgIHNldF9hdHRyaWJ1dGUoX2dsLF9pblNwaGVyZURhdGEuVkJPTGlzdCwgX292ZXJhbGxEYXRhLmF0dExvY2F0aW9uLCBfb3ZlcmFsbERhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX2luU3BoZXJlRGF0YS5pSW5kZXgpO1xyXG4gICAgLyrnp7vli5XjgIHlm57ou6LjgIHmi6HlpKfnuK7lsI8qL1xyXG5cclxuICAgIG0uaWRlbnRpdHkobU1hdHJpeCk7XHJcbiAgICBtLnRyYW5zbGF0ZShtTWF0cml4LFswLjAsMC4wLDUuMF0sbU1hdHJpeCk7XHJcbiAgICBtLnNjYWxlKG1NYXRyaXgsWzEwLjAsMTAuMCwxMC4wXSxtTWF0cml4KTtcclxuICAgIG0ucm90YXRlKG1NYXRyaXgsIDE4MCwgWzEsIDAsIDBdLCBtTWF0cml4KTtcclxuXHJcbiAgICBtLm11bHRpcGx5KHRtcE1hdHJpeCwgbU1hdHJpeCwgbXZwTWF0cml4KTtcclxuICAgIC8vdW5pZm9ybeOCkueZu+mMslxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELHNwaGVyZVRleHR1cmUpO1xyXG4gICAgX2dsLnVuaWZvcm0xaShfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uWzBdLCBmYWxzZSwgbXZwTWF0cml4KTtcclxuXHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIF9pblNwaGVyZURhdGEuaW5kZXgubGVuZ3RoLCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxuXHJcbiAgICAvLyBWQk/jgahJQk/jga7nmbvpjLJcclxuICAgIHNldF9hdHRyaWJ1dGUoX2dsLF9vdmVyYWxsRGF0YS5WQk9MaXN0LCBfb3ZlcmFsbERhdGEuYXR0TG9jYXRpb24sIF9vdmVyYWxsRGF0YS5hdHRTdHJpZGUpO1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBfb3ZlcmFsbERhdGEuaUluZGV4KTtcclxuICAgIF9nbC5lbmFibGUoX2dsLkJMRU5EKTtcclxuICAgaWYoX3RleHR1cmUpe1xyXG4gICAgICAgZm9yKHZhciBpPTA7aTxfdGV4dHVyZS5sZW5ndGg7aSsrKXtcclxuICAgICAgICBfcG9zWVtpXS09MC4xO1xyXG4gICAgICAgIC8vIF9wb3NaW2ldLT0wLjQwO1xyXG4gICAgICAgIF9wb3NabVtpXSs9MS4wO1xyXG4gICAgICAgIGlmKF9wb3NaW2ldPC0xMDApe1xyXG4gICAgICAgICAgICAvLyDjgqvjg6Hjg6njgojjgorliY3jgavjgZnjgZnjgpPjgaDjgonjgIHphY3liJfjgpLmuJvjgonjgZnlh6bnkIbjgYzlvq7lpplcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgIF90ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NaLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXItLTtcclxuICAgICAgICB9ZWxzZSBpZihfcG9zWm1baV0+MTApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgX3RleHR1cmUuc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1htLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWm0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX2dldG51bWJlci0tO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiaW5kUGxhdGVQb2x5KF9nbCxfbSxtTWF0cml4LF9yYWQsdG1wTWF0cml4LG12cE1hdHJpeCxfb3ZlcmFsbERhdGEudW5pTG9jYXRpb24saSxfcG9zWFtpXSxfcG9zWVtpXSxfcG9zWltpXSx0cnVlKTtcclxuICAgICAgIH1cclxuICAgfVxyXG5cclxufVxyXG5mdW5jdGlvbiBiaW5kUGxhdGVQb2x5KF9nbCxfbSxfbU1hdHJpeCxfcmFkLF90bXBNYXRyaXgsX212cE1hdHJpeCxfdW5pTG9jYXRpb24sX251bWJlcixfcG9zWCxfcG9zWSxfcG9zWixfcG9zWG0sX3Bvc1ltLF9wb3NabSxfc2NhbGVGcmFnKXtcclxuICAgIC8vIOODouODh+ODq+W6p+aomeWkieaPm+ihjOWIl+OBrueUn+aIkFxyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFtfcG9zWCxfcG9zWSxfcG9zWl0sX21NYXRyaXgpO1xyXG4gICAgaWYoX3NjYWxlRnJhZyl7XHJcbiAgICAgICAgX20uc2NhbGUoX21NYXRyaXgsWzAuNSwwLjUsMC41XSxfbU1hdHJpeCk7XHJcbiAgICB9XHJcbiAgICBfbS5tdWx0aXBseShfdG1wTWF0cml4LCBfbU1hdHJpeCwgX212cE1hdHJpeCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXh0dXJlW19udW1iZXJdKTtcclxuICAgIFxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBq+ODhuOCr+OCueODgeODo+OCkueZu+mMslxyXG4gICBfZ2wudW5pZm9ybTFpKF91bmlMb2NhdGlvblsxXSwgMCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBrueZu+mMsuOBqOaPj+eUu1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX3VuaUxvY2F0aW9uWzBdLCBmYWxzZSwgX212cE1hdHJpeCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIDYsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcblxyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFtfcG9zWG0sX3Bvc1ltLF9wb3NabV0sX21NYXRyaXgpO1xyXG4gICAgaWYoX3NjYWxlRnJhZyl7XHJcbiAgICAgICAgX20uc2NhbGUoX21NYXRyaXgsWzAuNSwwLjUsMC41XSxfbU1hdHJpeCk7XHJcbiAgICB9XHJcbiAgICBfbS5tdWx0aXBseShfdG1wTWF0cml4LCBfbU1hdHJpeCwgX212cE1hdHJpeCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXh0dXJlW19udW1iZXJdKTtcclxuICAgIFxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBq+ODhuOCr+OCueODgeODo+OCkueZu+mMslxyXG4gICBfZ2wudW5pZm9ybTFpKF91bmlMb2NhdGlvblsxXSwgMCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBrueZu+mMsuOBqOaPj+eUu1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX3VuaUxvY2F0aW9uWzBdLCBmYWxzZSwgX212cE1hdHJpeCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIDYsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbiAgICBcclxufVxyXG5cclxuLy8g44K344Kn44O844OA44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9zaGFkZXIoX2dsLF9pZCl7XHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgpLmoLzntI3jgZnjgovlpInmlbBcclxuICAgIHZhciBzaGFkZXI7XHJcbiAgICBcclxuICAgIC8vIEhUTUzjgYvjgolzY3JpcHTjgr/jgrDjgbjjga7lj4LnhafjgpLlj5blvpdcclxuICAgIHZhciBzY3JpcHRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoX2lkKTtcclxuICAgIFxyXG4gICAgLy8gc2NyaXB044K/44Kw44GM5a2Y5Zyo44GX44Gq44GE5aC05ZCI44Gv5oqc44GR44KLXHJcbiAgICBpZighc2NyaXB0RWxlbWVudCl7cmV0dXJuO31cclxuICAgIFxyXG4gICAgLy8gc2NyaXB044K/44Kw44GudHlwZeWxnuaAp+OCkuODgeOCp+ODg+OCr1xyXG4gICAgc3dpdGNoKHNjcmlwdEVsZW1lbnQudHlwZSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g6aCC54K544K344Kn44O844OA44Gu5aC05ZCIXHJcbiAgICAgICAgY2FzZSAneC1zaGFkZXIveC12ZXJ0ZXgnOlxyXG4gICAgICAgICAgICBzaGFkZXIgPSBfZ2wuY3JlYXRlU2hhZGVyKF9nbC5WRVJURVhfU0hBREVSKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIC8vIOODleODqeOCsOODoeODs+ODiOOCt+OCp+ODvOODgOOBruWgtOWQiFxyXG4gICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOlxyXG4gICAgICAgICAgICBzaGFkZXIgPSBfZ2wuY3JlYXRlU2hhZGVyKF9nbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0IDpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyDnlJ/miJDjgZXjgozjgZ/jgrfjgqfjg7zjg4Djgavjgr3jg7zjgrnjgpLlibLjgorlvZPjgabjgotcclxuICAgIF9nbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzY3JpcHRFbGVtZW50LnRleHQpO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgpLjgrPjg7Pjg5HjgqTjg6vjgZnjgotcclxuICAgIF9nbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOBjOato+OBl+OBj+OCs+ODs+ODkeOCpOODq+OBleOCjOOBn+OBi+ODgeOCp+ODg+OCr1xyXG4gICAgaWYoX2dsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIF9nbC5DT01QSUxFX1NUQVRVUykpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOaIkOWKn+OBl+OBpuOBhOOBn+OCieOCt+OCp+ODvOODgOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgICAgIHJldHVybiBzaGFkZXI7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDlpLHmlZfjgZfjgabjgYTjgZ/jgonjgqjjg6njg7zjg63jgrDjgpLjgqLjg6njg7zjg4jjgZnjgotcclxuICAgICAgICBhbGVydChfZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcclxuICAgIH1cclxufVxyXG4vLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLnlJ/miJDjgZfjgrfjgqfjg7zjg4DjgpLjg6rjg7Pjgq/jgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3Byb2dyYW0oX2dsLF92cywgX2ZzKXtcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIHByb2dyYW0gPSBfZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgavjgrfjgqfjg7zjg4DjgpLlibLjgorlvZPjgabjgotcclxuICAgIF9nbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgX3ZzKTtcclxuICAgIF9nbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgX2ZzKTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44KS44Oq44Oz44KvXHJcbiAgICBfZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOBruODquODs+OCr+OBjOato+OBl+OBj+ihjOOBquOCj+OCjOOBn+OBi+ODgeOCp+ODg+OCr1xyXG4gICAgaWYoX2dsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgX2dsLkxJTktfU1RBVFVTKSl7XHJcbiAgICBcclxuICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgICAgICBfZ2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gcHJvZ3JhbTtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOWkseaVl+OBl+OBpuOBhOOBn+OCieOCqOODqeODvOODreOCsOOCkuOCouODqeODvOODiOOBmeOCi1xyXG4gICAgICAgIGFsZXJ0KF9nbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSk7XHJcbiAgICB9XHJcbn1cclxuLy8gVkJP44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV92Ym8oX2dsLF9kYXRhKXtcclxuICAgIC8vIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIHZibyA9IF9nbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgavjg4fjg7zjgr/jgpLjgrvjg4Pjg4hcclxuICAgIF9nbC5idWZmZXJEYXRhKF9nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoX2RhdGEpLCBfZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xyXG4gICAgXHJcbiAgICAvLyDnlJ/miJDjgZfjgZ8gVkJPIOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIHZibztcclxufVxyXG4vLyBWQk/jgpLjg5DjgqTjg7Pjg4njgZfnmbvpjLLjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZShfZ2wsX3ZibywgX2F0dEwsIF9hdHRTKXtcclxuICAgIC8vIOW8leaVsOOBqOOBl+OBpuWPl+OBkeWPluOBo+OBn+mFjeWIl+OCkuWHpueQhuOBmeOCi1xyXG4gICAgZm9yKHZhciBpIGluIF92Ym8pe1xyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsIF92Ym9baV0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGF0dHJpYnV0ZUxvY2F0aW9u44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICAgICAgX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KF9hdHRMW2ldKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkumAmuefpeOBl+eZu+mMsuOBmeOCi1xyXG4gICAgICAgIF9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKF9hdHRMW2ldLCBfYXR0U1tpXSwgX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICB9XHJcbn1cclxuLy8gSUJP44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9pYm8oX2dsLF9kYXRhKXtcclxuICAgIC8vIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGlibyA9IF9nbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBq+ODh+ODvOOCv+OCkuOCu+ODg+ODiFxyXG4gICAgX2dsLmJ1ZmZlckRhdGEoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgSW50MTZBcnJheShfZGF0YSksIF9nbC5TVEFUSUNfRFJBVyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GX44GfSUJP44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICByZXR1cm4gaWJvO1xyXG59XHJcblxyXG4vLyDjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3RleHR1cmUoX2dsLF9zb3VyY2UsX24pe1xyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICBcclxuICAgIC8vIOODh+ODvOOCv+OBruOCquODs+ODreODvOODieOCkuODiOODquOCrOODvOOBq+OBmeOCi1xyXG4gICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgdmFyIHRleCA9IF9nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBuOOCpOODoeODvOOCuOOCkumBqeeUqFxyXG4gICAgICAgIF9nbC50ZXhJbWFnZTJEKF9nbC5URVhUVVJFXzJELCAwLCBfZ2wuUkdCQSwgX2dsLlJHQkEsIF9nbC5VTlNJR05FRF9CWVRFLCBpbWcpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01BR19GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUixfZ2wuTElORUFSKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1MsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX1dSQVBfVCxfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG4gICAgICAgIC8vIOODn+ODg+ODl+ODnuODg+ODl+OCkueUn+aIkFxyXG4gICAgICAgIF9nbC5nZW5lcmF0ZU1pcG1hcChfZ2wuVEVYVFVSRV8yRCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDnlJ/miJDjgZfjgZ/jg4bjgq/jgrnjg4Hjg6PjgpLjgrDjg63jg7zjg5Djg6vlpInmlbDjgavku6PlhaVcclxuICAgICAgICAgICAgdGV4dHVyZVtfbl0gPSB0ZXg7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7jgr3jg7zjgrnjgpLmjIflrppcclxuICAgIGltZy5zcmMgPSBfc291cmNlO1xyXG59XHJcbi8vIOODhuOCr+OCueODgeODo+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVTcGhlcmVUZXh0dXJlKF9nbCxfc291cmNlKXtcclxuICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4fjg7zjgr/jga7jgqrjg7Pjg63jg7zjg4njgpLjg4jjg6rjgqzjg7zjgavjgZnjgotcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciB0ZXggPSBfZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgbjjgqTjg6Hjg7zjgrjjgpLpgannlKhcclxuICAgICAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgaW1nKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NQUdfRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01JTl9GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9TLF9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1QsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG5cclxuICAgICAgICAvLyDjg5/jg4Pjg5fjg57jg4Pjg5fjgpLnlJ/miJBcclxuICAgICAgICBfZ2wuZ2VuZXJhdGVNaXBtYXAoX2dsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g55Sf5oiQ44GX44Gf44OG44Kv44K544OB44Oj44KS44Kw44Ot44O844OQ44Or5aSJ5pWw44Gr5Luj5YWlXHJcbiAgICAgICAgICAgIHNwaGVyZVRleHR1cmUgPSB0ZXg7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7jgr3jg7zjgrnjgpLmjIflrppcclxuICAgIGltZy5zcmMgPSBfc291cmNlO1xyXG59XHJcbi8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCkuOCquODluOCuOOCp+OCr+ODiOOBqOOBl+OBpueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfZnJhbWVidWZmZXIoX2dsLF93aWR0aCwgX2hlaWdodCl7XHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjga7nlJ/miJBcclxuICAgIHZhciBmcmFtZUJ1ZmZlciA9IF9nbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpJXZWJHTOOBq+ODkOOCpOODs+ODiVxyXG4gICAgX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsIGZyYW1lQnVmZmVyKTtcclxuICAgIFxyXG4gICAgLy8g5rex5bqm44OQ44OD44OV44Kh55So44Os44Oz44OA44O844OQ44OD44OV44Kh44Gu55Sf5oiQ44Go44OQ44Kk44Oz44OJXHJcbiAgICB2YXIgZGVwdGhSZW5kZXJCdWZmZXIgPSBfZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XHJcbiAgICBfZ2wuYmluZFJlbmRlcmJ1ZmZlcihfZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOODrOODs+ODgOODvOODkOODg+ODleOCoeOCkua3seW6puODkOODg+ODleOCoeOBqOOBl+OBpuioreWumlxyXG4gICAgX2dsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoX2dsLlJFTkRFUkJVRkZFUiwgX2dsLkRFUFRIX0NPTVBPTkVOVDE2LCBfd2lkdGgsIF9oZWlnaHQpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgavjg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqHjgpLplqLpgKPku5jjgZHjgotcclxuICAgIF9nbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsIF9nbC5ERVBUSF9BVFRBQ0hNRU5ULCBfZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOODhuOCr+OCueODgeODo+OBrueUn+aIkFxyXG4gICAgdmFyIGZUZXh0dXJlID0gX2dsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh55So44Gu44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIGZUZXh0dXJlKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh55So44Gu44OG44Kv44K544OB44Oj44Gr44Kr44Op44O855So44Gu44Oh44Oi44Oq6aCY5Z+f44KS56K65L+dXHJcbiAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF93aWR0aCwgX2hlaWdodCwgMCwgX2dsLlJHQkEsIF9nbC5VTlNJR05FRF9CWVRFLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g44OG44Kv44K544OB44Oj44OR44Op44Oh44O844K/XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgX2dsLkxJTkVBUik7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgX2dsLkxJTkVBUik7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfV1JBUF9TLCBfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfV1JBUF9ULCBfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOBq+ODhuOCr+OCueODgeODo+OCkumWoumAo+S7mOOBkeOCi1xyXG4gICAgX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKF9nbC5GUkFNRUJVRkZFUiwgX2dsLkNPTE9SX0FUVEFDSE1FTlQwLCBfZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUsIDApO1xyXG4gICAgXHJcbiAgICAvLyDlkITnqK7jgqrjg5bjgrjjgqfjgq/jg4jjga7jg5DjgqTjg7Pjg4njgpLop6PpmaRcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICBfZ2wuYmluZFJlbmRlcmJ1ZmZlcihfZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g44Kq44OW44K444Kn44Kv44OI44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICByZXR1cm4ge2YgOiBmcmFtZUJ1ZmZlciwgZCA6IGRlcHRoUmVuZGVyQnVmZmVyLCB0IDogZlRleHR1cmV9O1xyXG59XHJcbiAgICBcclxuIl19
