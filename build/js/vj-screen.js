(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

//'use strict';
// テクスチャ用変数の宣言
var texture = [];

var textureM = [];
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

//blurするかしないか
var blurFrag = false;
var blurValue = 0;

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
    document.addEventListener("keyup", Keyup);
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

    //zoomblurを適用する
    var zoomblurData = initZoomBlur(gl, "zoom.vs", "zoom.fs");

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
    var getnumberM = 0;
    var joFrag = false;

    //サーバーからデータを受け取る
    socket.on("pushImageFromServer", function (data) {
        console.log(data);
        console.log("data.frag" + data.frag);
        //真ん中のボタンを押したかどうか
        if (data.frag == true) {
            if (joFrag) {
                create_texture(gl, "../img/joe.jpg", getnumberM, true);
            } else {
                create_texture(gl, data.imgdata, getnumberM, true);
            }
            posXm[getnumberM] = 0;
            posYm[getnumberM] = 0;
            posZm[getnumberM] = -95;
            getnumberM++;
        } else {

            if (joFrag) {
                create_texture(gl, "../img/joe.jpg", getnumber, false);
            } else {
                create_texture(gl, data.imgdata, getnumber, false);
            }

            posX[getnumber] = data.x * 5.0;
            posY[getnumber] = data.y * 5.0;
            posZ[getnumber] = 0;
            getnumber++;
        }
        //select
        if (select == 3) {
            posX[getnumber] = data.x * 5.0;
            posY[getnumber] = -5.0;
            posZ[getnumber] = data.y * 2.0 + 5.0;
        }
        console.log(getnumber);
        console.log(texture);
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
            bindOverall(gl, overallData, fBuffer, m, mMatrix, tmpMatrix, mvpMatrix, rad, texture, textureM, posX, posY, posZ, posXm, posYm, posZm, getnumber, getnumberM);
        } else if (select == 3) {
            bindInSphere(c, gl, fBuffer, overallData, inSphereData, texture, textureM, posX, posY, posZ, posXm, posYm, posZm, getnumber, getnumberM, sphereCountW, sphereCountH);
            bindZoomblur(gl, zoomblurData, fBuffer, cw, ch, blurFrag);
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
        //        createSphereTexture(gl,"../img/test.jpg");
        createSphereTexture(gl, "../img/logo.png");
    }

    //十字キー
    if (e.keyCode == 37) {
        //左
        blurFrag = true;
        sphereCountW--;
    } else if (e.keyCode == 39) {
        //右
        blurFrag = true;
        sphereCountW++;
    } else if (e.keyCode == 38) {
        //上
        blurFrag = true;
        sphereCountH++;
    } else if (e.keyCode == 40) {
        //下
        blurFrag = true;
        sphereCountH--;
    } else {
        blurFrag = false;
    }

    if (blurFrag) {
        blurValue += 0.02;
    }
    if (blurValue >= 30.0) {
        blurValue = 30.0;
    }
}

function Keyup(e) {
    console.log(e);
    blurFrag = false;
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
function initZoomBlur(_gl, _vsId, _fsId) {
    var prg = create_program(_gl, create_shader(_gl, _vsId), create_shader(_gl, _fsId));
    var attLocation = [];
    attLocation[0] = _gl.getAttribLocation(prg, 'position');
    attLocation[1] = _gl.getAttribLocation(prg, 'texCoord');
    var attStride = new Array();
    attStride[0] = 3;
    attStride[1] = 2;
    var uniLocation = [];
    uniLocation[0] = _gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = _gl.getUniformLocation(prg, 'texture');
    uniLocation[2] = _gl.getUniformLocation(prg, 'strength');
    uniLocation[3] = _gl.getUniformLocation(prg, 'width');
    uniLocation[4] = _gl.getUniformLocation(prg, 'height');
    // 板ポリゴン
    var position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
    var texCoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    var index = [0, 2, 1, 2, 3, 1];
    var vPosition = create_vbo(_gl, position);
    var vTexCoord = create_vbo(_gl, texCoord);
    var vVBOList = [vPosition, vTexCoord];
    var iIndex = create_ibo(_gl, index);

    return { prg: prg, attLocation: attLocation, attStride: attStride, uniLocation: uniLocation, VBOList: vVBOList, index: index, iIndex: iIndex };
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
function bindZoomblur(_gl, _zoomblurData, _fBuffer, _cw, _ch, _blurFrag) {
    /*頑張って書き換える*/
    var m = new matIV();
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    // プログラムオブジェクトの選択
    _gl.useProgram(_zoomblurData.prg);

    _gl.clearColor(0.0, 0.0, 0.0, 1.0);
    _gl.clearDepth(1.0);
    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);

    // 正射影用の座標変換行列
    m.lookAt([0.0, 0.0, 0.5], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
    m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);
    //  var strength
    console.log(_blurFrag);
    if (!_blurFrag) {
        //        strength = 20;
        blurValue -= 0.1;
        if (blurValue <= 0) {
            blurValue = 0;
        }
    }

    _gl.activeTexture(_gl.TEXTURE0);
    _gl.bindTexture(_gl.TEXTURE_2D, _fBuffer.t);
    set_attribute(_gl, _zoomblurData.VBOList, _zoomblurData.attLocation, _zoomblurData.attStride);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _zoomblurData.iIndex);
    _gl.uniformMatrix4fv(_zoomblurData.uniLocation[0], false, tmpMatrix);
    _gl.uniform1i(_zoomblurData.uniLocation[1], 0);
    _gl.uniform1f(_zoomblurData.uniLocation[2], blurValue);
    _gl.uniform1f(_zoomblurData.uniLocation[3], _cw);
    _gl.uniform1f(_zoomblurData.uniLocation[4], _ch);
    _gl.drawElements(_gl.TRIANGLES, _zoomblurData.index.length, _gl.UNSIGNED_SHORT, 0);
}
function bindOverall(_gl, _overallData, _fBuffer, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _rad, _texture, _textureM, _posX, _posY, _posZ, _posXm, _posYm, _posZm, _getnumber, _getnumberM) {
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
            if (_posZ[i] < -90) {
                // カメラより前にすすんだら、配列を減らす処理が微妙
                console.log("削除してます");
                _texture.shift();
                _posX.shift();
                _posY.shift();
                _posZ.shift();
                _getnumber--;
                //getnumber--
                //console.log("bindしている"+getnumber);
            }
            bindPlatePoly(_gl, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i], false);
        }
    }
    if (_textureM) {
        for (var i = 0; i < _textureM.length; i++) {
            _posZm[i] += 1.0;
            if (_posZm[i] > 10) {
                console.log("削除してます");
                _textureM.shift();
                _posXm.shift();
                _posYm.shift();
                _posZm.shift();
                _getnumberM--;
                //          getnumberM--;
                //console.log("bindしている"+getnumberM);
            }
            bindPlatePolyMiddle(_gl, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _overallData.uniLocation, i, _posXm[i], _posYm[i], _posZm[i], false);
        }
    }
}
function bindInSphere(_c, _gl, _fBuffer, _overallData, _inSphereData, _texture, _textureM, _posX, _posY, _posZ, _posXm, _posYm, _posZm, _getnumber, _getnumberM, _sphereCountW, _sphereCountH) {
    var radW = _sphereCountW % 360 * Math.PI / 180;
    var radH = _sphereCountH % 360 * Math.PI / 180;
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
    m.perspective(45, _c.width / _c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    var q = new qtnIV();
    var camQ = q.identity(q.create());
    var camW = q.identity(q.create());
    var camH = q.identity(q.create());

    q.rotate(radW, [0, 1, 0], camW);
    q.rotate(radH, [1, 0, 0], camH);
    q.multiply(camH, camW, camQ);
    var camUp = [];
    var camforward = [];
    q.toVecIII(upPosition, camQ, camUp);
    q.toVecIII([0.0, 0.0, -1.0], camQ, camforward);

    var eyeCam = [];
    eyeCam[0] = eyePosition[0] + camforward[0];
    eyeCam[1] = eyePosition[1] + camforward[1];
    eyeCam[2] = eyePosition[2] + camforward[2];
    m.lookAt(eyePosition, eyeCam, camUp, vMatrix);

    m.multiply(pMatrix, vMatrix, tmpMatrix);

    _gl.bindFramebuffer(_gl.FRAMEBUFFER, _fBuffer.f);
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
            _posY[i] += 0.1;
            if (_posZ[i] < -90) {
                // カメラより前にすすんだら、配列を減らす処理が微妙
                console.log("削除してます");
                _texture.shift();
                _posX.shift();
                _posY.shift();
                _posZ.shift();
                _getnumber--;
            }
            bindPlatePoly(_gl, m, mMatrix, tmpMatrix, mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i], true);
        }
    }
    if (_textureM) {
        for (var i = 0; i < _textureM.length; i++) {
            _posZm[i] += 1.0;
            if (_posZm[i] > 10) {
                console.log("削除してます");
                _textureM.shift();
                _posXm.shift();
                _posYm.shift();
                _posZm.shift();
                _getnumberM--;
            }
            bindPlatePolyMiddle(_gl, m, mMatrix, tmpMatrix, mvpMatrix, _overallData.uniLocation, i, _posXm[i], _posYm[i], _posZm[i], true);
        }
    }

    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
}

//texture系を引数にとってないでグローバルのをつかってる
function bindPlatePoly(_gl, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _uniLocation, _number, _posX, _posY, _posZ, _scaleFrag) {
    // モデル座標変換行列の生成
    _m.identity(_mMatrix);
    _m.translate(_mMatrix, [_posX, _posY, _posZ], _mMatrix);
    if (_scaleFrag) {
        _m.rotate(_mMatrix, Math.PI, [1, 0, 0], _mMatrix);
        _m.scale(_mMatrix, [0.3, 0.3, 0.3], _mMatrix);
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
//真ん中のテクスチャをしようする
function bindPlatePolyMiddle(_gl, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _uniLocation, _number, _posXm, _posYm, _posZm, _scaleFrag) {
    _m.identity(_mMatrix);
    _m.translate(_mMatrix, [_posXm, _posYm, _posZm], _mMatrix);
    if (_scaleFrag) {
        _m.rotate(_mMatrix, Math.PI, [1, 0, 0], _mMatrix);
        _m.scale(_mMatrix, [0.3, 0.3, 0.3], _mMatrix);
    }
    _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);

    // テクスチャをバインドする
    _gl.bindTexture(_gl.TEXTURE_2D, textureM[_number]);

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
function create_texture(_gl, _source, _n, _frag) {
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
        if (_frag) {
            console.log("create_textureM");
            textureM[_n] = tex;
        } else {
            console.log("create_texture");
            texture[_n] = tex;
        }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBQ0E7QUFDQSxJQUFJLFVBQVEsRUFBWjs7QUFFQSxJQUFJLFdBQVMsRUFBYjtBQUNBO0FBQ0EsSUFBSSxnQkFBYyxJQUFsQjs7QUFFQTtBQUNBLElBQUksRUFBSixFQUFPLEVBQVAsRUFBVSxFQUFWLEVBQWEsRUFBYjtBQUNBO0FBQ0EsSUFBSSxTQUFPLENBQVg7QUFDQTtBQUNBLElBQUksRUFBSjtBQUNBO0FBQ0EsSUFBSSxlQUFhLENBQWpCO0FBQ0EsSUFBSSxlQUFhLENBQWpCOztBQUVBO0FBQ0EsSUFBSSxXQUFTLEtBQWI7QUFDQSxJQUFJLFlBQVUsQ0FBZDs7QUFFQSxPQUFPLE1BQVAsR0FBYyxZQUFVO0FBQ3BCLFNBQUcsT0FBTyxVQUFWO0FBQ0EsU0FBRyxPQUFPLFdBQVY7QUFDSCxDQUhEO0FBSUEsT0FBTyxNQUFQLEdBQWMsWUFBVTtBQUNwQixRQUFJLFNBQVEsSUFBWjtBQUNBO0FBQ0EsUUFBSSxJQUFJLFNBQVMsY0FBVCxDQUF3QixRQUF4QixDQUFSO0FBQ0EsU0FBRyxPQUFPLFVBQVY7QUFDQSxTQUFHLE9BQU8sV0FBVjtBQUNBLE1BQUUsS0FBRixHQUFVLEVBQVY7QUFDQSxNQUFFLE1BQUYsR0FBVyxFQUFYOztBQUVBO0FBQ0EsYUFBUyxnQkFBVCxDQUEwQixTQUExQixFQUFzQyxPQUF0QztBQUNBLGFBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBb0MsS0FBcEM7QUFDQTtBQUNBLE1BQUUsZ0JBQUYsQ0FBbUIsV0FBbkIsRUFBK0IsU0FBL0IsRUFBeUMsSUFBekM7QUFDQTtBQUNBLFNBQUssRUFBRSxVQUFGLENBQWEsT0FBYixLQUF5QixFQUFFLFVBQUYsQ0FBYSxvQkFBYixDQUE5Qjs7QUFFQTtBQUNBLFFBQUksaUJB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SUFBSSxjQUF0QyxFQUFzRCxJQUFJLGFBQTFEO0FBQ0EsUUFBSSxhQUFKLENBQWtCLElBQUksVUFBdEIsRUFBa0MsSUFBSSxjQUF0QyxFQUFzRCxJQUFJLGFBQTFEOztBQUVBO0FBQ0EsUUFBSSxvQkFBSixDQUF5QixJQUFJLFdBQTdCLEVBQTBDLElBQUksaUJBQTlDLEVBQWlFLElBQUksVUFBckUsRUFBaUYsUUFBakYsRUFBMkYsQ0FBM0Y7O0FBRUE7QUFDQSxRQUFJLFdBQUosQ0FBZ0IsSUFBSSxVQUFwQixFQUFnQyxJQUFoQztBQUNBLFFBQUksZ0JBQUosQ0FBcUIsSUFBSSxZQUF6QixFQUF1QyxJQUF2QztBQUNBLFFBQUksZUFBSixDQUFvQixJQUFJLFdBQXhCLEVBQXFDLElBQXJDOztBQUVBO0FBQ0EsV0FBTyxFQUFDLEdBQUksV0FBTCxFQUFrQixHQUFJLGlCQUF0QixFQUF5QyxHQUFJLFFBQTdDLEVBQVA7QUFDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyd1c2Ugc3RyaWN0JztcclxuLy8g44OG44Kv44K544OB44Oj55So5aSJ5pWw44Gu5a6j6KiAXHJcbnZhciB0ZXh0dXJlPVtdO1xyXG5cclxudmFyIHRleHR1cmVNPVtdO1xyXG4vL+eQg+S9k+iDjOaZr+OBruODhuOCr+OCueODgeODo1xyXG52YXIgc3BoZXJlVGV4dHVyZT1udWxsO1xyXG5cclxuLy/jg57jgqbjgrnjga7kvY3nva7jgIHnlLvlg4/jga7lpKfjgY3jgZXjgIHog4zmma/jgrfjgqfjg7zjg4Djg7zjgavmuKHjgZnjgoLjga5cclxudmFyIG14LG15LGN3LGNoO1xyXG4vL+iDjOaZr+OCkuWIh+OCiuabv+OBiOOCi+OCguOBrlxyXG52YXIgc2VsZWN0PTE7XHJcbi8vd2ViZ2zjga7jgYTjgo3jgpPjgarjgoLjga7jgYzlhaXjgaPjgabjgotcclxudmFyIGdsO1xyXG4vLzPnlarog4zmma/jga7jgajjgY3jgavog4zmma/jgpLli5XjgYvjgZnjgajjgY3jgavjgaTjgYvjgYZcclxudmFyIHNwaGVyZUNvdW50Vz0wO1xyXG52YXIgc3BoZXJlQ291bnRIPTA7XHJcblxyXG4vL2JsdXLjgZnjgovjgYvjgZfjgarjgYTjgYtcclxudmFyIGJsdXJGcmFnPWZhbHNlO1xyXG52YXIgYmx1clZhbHVlPTA7XHJcblxyXG53aW5kb3cucmVzaXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxufTtcclxud2luZG93Lm9ubG9hZD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHNvY2tldCA9aW8oKTtcclxuICAgIC8vIGNhbnZhc+OCqOODrOODoeODs+ODiOOCkuWPluW+l1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIGMud2lkdGggPSBjdztcclxuICAgIGMuaGVpZ2h0ID0gY2g7XHJcblxyXG4gICAgLy/jgq3jg7zjgYzmirzjgZXjgozjgZ/jgolcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIgLCBLZXlEb3duKTtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiICwgS2V5dXApO1xyXG4gICAgLy9jYW52YXPkuIrjgafjg57jgqbjgrnjgYzli5XjgYTjgZ/jgolcclxuICAgIGMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLG1vdXNlTW92ZSx0cnVlKTtcclxuICAgIC8vIHdlYmds44Kz44Oz44OG44Kt44K544OI44KS5Y+W5b6XXHJcbiAgICBnbCA9IGMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fCBjLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpO1xyXG5cclxuICAgIC8vIOiDjOaZr+WBtOOBruWIneacn+ioreWumlxyXG4gICAgdmFyIGJhY2tncm91bmREYXRhPWluaXRCYWNrZ3JvdW5kKGdsLFwidHZzXCIsXCJ0ZnNcIik7XHJcblxyXG4gICAgdmFyIGludGVuc2l2ZURhdGE9aW5pdEJhY2tncm91bmQoZ2wsXCJ0dnNcIixcImludGVuc2l2ZUZzXCIpO1xyXG4gICAgLy8g5YWo5L2T44Gu44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQ44Go44Oq44Oz44KvXHJcbiAgICAvL3NwaGVyZVNjZW5l44Gu5Yid5pyf6Kit5a6aXHJcbiAgICB2YXIgaW5TcGhlcmVEYXRhPWluaXRJblNwaGVyZShnbCk7XHJcblxyXG4gICAgLy96b29tYmx1cuOCkumBqeeUqOOBmeOCi1xyXG4gICAgdmFyIHpvb21ibHVyRGF0YT1pbml0Wm9vbUJsdXIoZ2wsXCJ6b29tLnZzXCIsXCJ6b29tLmZzXCIpO1xyXG5cclxuICAgIC8vIOWFqOS9k+eahOOBruWIneacn+ioreWumlxyXG4gICAgdmFyIG92ZXJhbGxEYXRhPWluaXRPdmVyYWxsKGdsKTtcclxuXHJcblxyXG4gICAgLy8g5ZCE56iu6KGM5YiX44Gu55Sf5oiQ44Go5Yid5pyf5YyWXHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIC8vIOODk+ODpeODvMOX44OX44Ot44K444Kn44Kv44K344On44Oz5bqn5qiZ5aSJ5o+b6KGM5YiXXHJcbiAgICB2YXIgZXllUG9zaXRpb249WzAuMCwgMC4wLCA1LjBdO1xyXG4gICAgdmFyIGNlbnRlclBvc2l0aW9uPVswLjAsIDAuMCwgMC4wXTtcclxuICAgIHZhciB1cFBvc2l0aW9uPVswLjAsIDEuMCwgMC4wXTtcclxuICAgIG0ubG9va0F0KGV5ZVBvc2l0aW9uLCBjZW50ZXJQb3NpdGlvbiwgdXBQb3NpdGlvbiwgdk1hdHJpeCk7XHJcbiAgICBtLnBlcnNwZWN0aXZlKDQ1LCBjLndpZHRoIC8gYy5oZWlnaHQsIDAuMSwgMTAwLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuICAgIC8vIOa3seW6puODhuOCueODiOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xyXG4gICAgZ2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XHJcbiAgICAvLyDmnInlirnjgavjgZnjgovjg4bjgq/jgrnjg4Hjg6Pjg6bjg4vjg4Pjg4jjgpLmjIflrppcclxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xyXG5cclxuICAgIC8v44OG44Kv44K544OB44Oj44GueeW6p+aomVxyXG4gICAgdmFyIHBvc1g9W107XHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NZPVtdO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga565bqn5qiZXHJcbiAgICB2YXIgcG9zWj1bXTtcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NYbT1bXTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueeW6p+aomVxyXG4gICAgdmFyIHBvc1ltPVtdO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga565bqn5qiZXHJcbiAgICB2YXIgcG9zWm09W107XHJcblxyXG4gICAgLy9zb2NrZXTjga7jgqTjg5njg7Pjg4jjgYzkvZXlm57jgY3jgZ/jgYvjgZfjgonjgbnjgotcclxuICAgIHZhciBnZXRudW1iZXI9MDtcclxuICAgIHZhciBnZXRudW1iZXJNPTA7XHJcbiAgICB2YXIgam9GcmFnPWZhbHNlO1xyXG5cclxuXHJcbiAgICAvL+OCteODvOODkOODvOOBi+OCieODh+ODvOOCv+OCkuWPl+OBkeWPluOCi1xyXG4gICAgc29ja2V0Lm9uKFwicHVzaEltYWdlRnJvbVNlcnZlclwiLGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiZGF0YS5mcmFnXCIrZGF0YS5mcmFnKTtcclxuICAgICAgICAvL+ecn+OCk+S4reOBruODnOOCv+ODs+OCkuaKvOOBl+OBn+OBi+OBqeOBhuOBi1xyXG4gICAgICAgIGlmKGRhdGEuZnJhZz09dHJ1ZSl7XHJcbiAgICAgICAgICAgIGlmKGpvRnJhZyl7XHJcbiAgICAgICAgICAgICAgICAgY3JlYXRlX3RleHR1cmUoZ2wsXCIuLi9pbWcvam9lLmpwZ1wiLGdldG51bWJlck0sdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgY3JlYXRlX3RleHR1cmUoZ2wsZGF0YS5pbWdkYXRhLGdldG51bWJlck0sdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcG9zWG1bZ2V0bnVtYmVyTV09MDtcclxuICAgICAgICAgICAgcG9zWW1bZ2V0bnVtYmVyTV09MDtcclxuICAgICAgICAgICAgcG9zWm1bZ2V0bnVtYmVyTV09LTk1O1xyXG4gICAgICAgICAgICBnZXRudW1iZXJNKys7XHJcbiAgICAgICAgfWVsc2V7XHJcblxyXG4gICAgICAgICAgICBpZihqb0ZyYWcpe1xyXG4gICAgICAgICAgICAgICAgIGNyZWF0ZV90ZXh0dXJlKGdsLFwiLi4vaW1nL2pvZS5qcGdcIixnZXRudW1iZXIsZmFsc2UpO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGNyZWF0ZV90ZXh0dXJlKGdsLGRhdGEuaW1nZGF0YSxnZXRudW1iZXIsZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBwb3NYW2dldG51bWJlcl09ZGF0YS54KjUuMDtcclxuICAgICAgICAgICAgcG9zWVtnZXRudW1iZXJdPWRhdGEueSo1LjA7XHJcbiAgICAgICAgICAgIHBvc1pbZ2V0bnVtYmVyXT0wO1xyXG4gICAgICAgICAgICBnZXRudW1iZXIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9zZWxlY3RcclxuICAgICAgICBpZihzZWxlY3Q9PTMpe1xyXG4gICAgICAgICAgICBwb3NYW2dldG51bWJlcl09ZGF0YS54KjUuMDtcclxuICAgICAgICAgICAgcG9zWVtnZXRudW1iZXJdPS01LjA7XHJcbiAgICAgICAgICAgIHBvc1pbZ2V0bnVtYmVyXT1kYXRhLnkqMi4wKzUuMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2V0bnVtYmVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0dXJlKTtcclxuICAgIH0pO1xyXG4gICAgLy9qb+OBleOCk+ODnOOCv+ODs+OCkuaKvOOBl+OBn+OBi+OBqeOBhuOBi+OCkuODgeOCp+ODg+OCr1xyXG4gICAgc29ja2V0Lm9uKFwicHVzaEpvRnJhZ0Zyb21TZXJ2ZXJcIixmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmpvRnJhZyk7XHJcbiAgICAgICAgaWYoZGF0YS5qb0ZyYWc9PT10cnVlKXtcclxuICAgICAgICAgICAgam9GcmFnPXRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvL+acgOWIneOBq2pv44GV44KT44OV44Op44Kw44KSZmFsc2XjgavjgZnjgovjgojjgYbjgavjg6Hjg4Pjgrvjg7zjgrjjgpLpgIHjgotcclxuICAgIHNvY2tldC5lbWl0KFwicHVzaEpvRnJhZ0Zyb21TY3JlZW5cIix7XHJcbiAgICAgICAgICAgIGpvRnJhZzpmYWxzZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBruWPluW+l1xyXG4gICAgdmFyIGZCdWZmZXJXaWR0aCAgPSBjdztcclxuICAgIHZhciBmQnVmZmVySGVpZ2h0ID0gY2g7XHJcbiAgICB2YXIgZkJ1ZmZlciA9IGNyZWF0ZV9mcmFtZWJ1ZmZlcihnbCxmQnVmZmVyV2lkdGgsIGZCdWZmZXJIZWlnaHQpO1xyXG4gICAgLy8g44Kr44Km44Oz44K/44Gu5a6j6KiAXHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdmFyIGNvdW50Mj0wO1xyXG4gICAgLy/kuIDlv5xcclxuICAgIG14PTAuNTtteT0wLjU7XHJcbiAgICB2YXIgc3RhcnRUaW1lPW5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgIC8v44OW44Os44Oz44OJ44OV44Kh44Oz44Kv44GX44Gm44KL44GeXHJcbiAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xyXG5cclxuICAgIC8vIOaBkuW4uOODq+ODvOODl1xyXG4gICAgKGZ1bmN0aW9uIGxvb3AoKXtcclxuICAgICAgICAvLyDjgqvjgqbjg7Pjgr/jgpLlhYPjgavjg6njgrjjgqLjg7PjgpLnrpflh7pcclxuICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgIGlmIChjb3VudCAlIDEwID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvdW50MisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaHN2PWhzdmEoY291bnQyJTM2MCwxLDEsMSk7XHJcbiAgICAgICAgdmFyIHJhZCA9IChjb3VudCAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLeODleODrOODvOODoOODkOODg+ODleOCoS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgICAgIC8v5pmC6ZaTXHJcbiAgICAgICAgdmFyIHRpbWU9KG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSowLjAwMTtcclxuICAgICAgICAvKi0t44OV44Os44O844Og44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJLS0qL1xyXG4gICAgICAgIGlmKHNlbGVjdD09MSl7XHJcbiAgICAgICAgICAgIGJpbmRCYWNrZ3JvdW5kKGdsLGZCdWZmZXIsYmFja2dyb3VuZERhdGEsdGltZSxteCxteSxjdyxjaCxoc3YpO1xyXG4gICAgICAgIH1lbHNlIGlmKHNlbGVjdD09Mil7XHJcbiAgICAgICAgICAgIGJpbmRCYWNrZ3JvdW5kKGdsLGZCdWZmZXIsaW50ZW5zaXZlRGF0YSx0aW1lLG14LG15LGN3LGNoLGhzdik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL+WFqOS9k+eahOOBqlxyXG4gICAgICAgIC8vc2hhZGVyQmFja2dyb3VuZOOBruWgtOWQiFxyXG4gICAgICAgIGlmKHNlbGVjdD09MXx8c2VsZWN0PT0yKXtcclxuICAgICAgICAgICAgYmluZE92ZXJhbGwoZ2wsb3ZlcmFsbERhdGEsZkJ1ZmZlcixtLG1NYXRyaXgsdG1wTWF0cml4LG12cE1hdHJpeCxyYWQsdGV4dHVyZSx0ZXh0dXJlTSxwb3NYLHBvc1kscG9zWixwb3NYbSxwb3NZbSxwb3NabSxnZXRudW1iZXIsZ2V0bnVtYmVyTSk7XHJcbiAgICAgICAgfWVsc2UgaWYoc2VsZWN0PT0zKXtcclxuICAgICAgICAgICAgYmluZEluU3BoZXJlKGMsZ2wsZkJ1ZmZlcixvdmVyYWxsRGF0YSxpblNwaGVyZURhdGEsdGV4dHVyZSx0ZXh0dXJlTSxwb3NYLHBvc1kscG9zWixwb3NYbSxwb3NZbSxwb3NabSxnZXRudW1iZXIsZ2V0bnVtYmVyTSxzcGhlcmVDb3VudFcsc3BoZXJlQ291bnRIKTtcclxuICAgICAgICAgICAgYmluZFpvb21ibHVyKGdsLHpvb21ibHVyRGF0YSxmQnVmZmVyLGN3LGNoLGJsdXJGcmFnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g44Kz44Oz44OG44Kt44K544OI44Gu5YaN5o+P55S7XHJcbiAgICAgICAgZ2wuZmx1c2goKTtcclxuICAgICAgICAvL+OCv+ODluOBjOmdnuOCouOCr+ODhuOCo+ODluOBruWgtOWQiOOBr0ZQU+OCkuiQveOBqOOBmVxyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcclxuICAgIH0pKCk7XHJcblxyXG59O1xyXG5mdW5jdGlvbiBLZXlEb3duKGUpe1xyXG4gICAgaWYoZS5rZXlDb2RlPT00OSl7XHJcbiAgICAgICAgLy8x44KS5oq844GX44Gf44KJXHJcbiAgICAgICAgc2VsZWN0PTE7XHJcbiAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTUwKXtcclxuICAgICAgICAvLzLjgpLmirzjgZfjgZ/jgolcclxuICAgICAgICBzZWxlY3Q9MjtcclxuICAgIH1lbHNlIGlmKGUua2V5Q29kZT09NTEpe1xyXG4gICAgICAgIHNlbGVjdD0zO1xyXG4vLyAgICAgICAgY3JlYXRlU3BoZXJlVGV4dHVyZShnbCxcIi4uL2ltZy90ZXN0LmpwZ1wiKTtcclxuICAgICAgICBjcmVhdGVTcGhlcmVUZXh0dXJlKGdsLFwiLi4vaW1nL2xvZ28ucG5nXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8v5Y2B5a2X44Kt44O8XHJcbiAgICBpZihlLmtleUNvZGU9PTM3KXtcclxuICAgICAgICAvL+W3plxyXG4gICAgICAgIGJsdXJGcmFnPXRydWU7XHJcbiAgICAgICAgc3BoZXJlQ291bnRXLS07XHJcbiAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTM5KXtcclxuICAgICAgICAvL+WPs1xyXG4gICAgICAgIGJsdXJGcmFnPXRydWU7XHJcbiAgICAgICAgc3BoZXJlQ291bnRXKys7XHJcbiAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTM4KXtcclxuICAgICAgICAvL+S4ilxyXG4gICAgICAgIGJsdXJGcmFnPXRydWU7XHJcbiAgICAgICAgc3BoZXJlQ291bnRIKys7XHJcbiAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTQwKXtcclxuICAgICAgICAvL+S4i1xyXG4gICAgICAgIGJsdXJGcmFnPXRydWU7XHJcbiAgICAgICAgc3BoZXJlQ291bnRILS07XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBibHVyRnJhZz1mYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZihibHVyRnJhZyl7XHJcbiAgICAgICAgYmx1clZhbHVlKz0wLjAyO1xyXG4gICAgfVxyXG4gICAgaWYoYmx1clZhbHVlPj0zMC4wKXtcclxuICAgICAgICBibHVyVmFsdWU9MzAuMDtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gS2V5dXAoZSl7XHJcbiAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgIGJsdXJGcmFnPWZhbHNlO1xyXG59XHJcbmZ1bmN0aW9uIG1vdXNlTW92ZShlKXtcclxuICAgIG14PWUub2Zmc2V0WC9jdztcclxuICAgIG15PWUub2Zmc2V0WS9jaDtcclxufVxyXG5mdW5jdGlvbiBpbml0QmFja2dyb3VuZChfZ2wsX3ZzSWQsX2ZzSWQpe1xyXG4gICAgdmFyIHByZz1jcmVhdGVfcHJvZ3JhbShfZ2wsY3JlYXRlX3NoYWRlcihfZ2wsX3ZzSWQpLGNyZWF0ZV9zaGFkZXIoX2dsLF9mc0lkKSk7XHJcbiAgICB2YXIgdW5pTG9jYXRpb249W107XHJcbiAgICB1bmlMb2NhdGlvblswXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcInRpbWVcIik7XHJcbiAgICB1bmlMb2NhdGlvblsxXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcIm1vdXNlXCIpO1xyXG4gICAgdW5pTG9jYXRpb25bMl09X2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsXCJpUmVzb2x1dGlvblwiKTtcclxuICAgIHVuaUxvY2F0aW9uWzNdPV9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLFwiaHN2XCIpO1xyXG5cclxuICAgIHZhciBQb3NpdGlvbj1bXHJcbiAgICAtMS4wLDEuMCwwLjAsXHJcbiAgICAxLjAsMS4wLDAuMCxcclxuICAgIC0xLjAsLTEuMCwwLjAsXHJcbiAgICAxLjAsLTEuMCwwLjAsXHJcbiAgICBdO1xyXG4gICAgdmFyIEluZGV4PVtcclxuICAgIDAsMiwxLFxyXG4gICAgMSwyLDNcclxuICAgIF07XHJcbiAgICB2YXIgdlBvc2l0aW9uPWNyZWF0ZV92Ym8oX2dsLFBvc2l0aW9uKTtcclxuICAgIHZhciB2SW5kZXg9Y3JlYXRlX2libyhfZ2wsSW5kZXgpO1xyXG4gICAgdmFyIHZBdHRMb2NhdGlvbj1fZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLFwicG9zaXRpb25cIik7XHJcblxyXG4gICAgcmV0dXJue3ByZzpwcmcsdW5pTG9jYXRpb246dW5pTG9jYXRpb24sdlBvc2l0aW9uOnZQb3NpdGlvbix2SW5kZXg6dkluZGV4LGF0dExvY2F0aW9uOnZBdHRMb2NhdGlvbn07XHJcbn1cclxuZnVuY3Rpb24gaW5pdEluU3BoZXJlKF9nbCl7XHJcbiAgICB2YXIgZWFydGhEYXRhICAgICA9IHNwaGVyZSg2NCwgNjQsIDEuMCwgWzEuMCwgMS4wLCAxLjAsIDEuMF0pO1xyXG4gICAgdmFyIGVQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKF9nbCxlYXJ0aERhdGEucCk7XHJcbiAgICB2YXIgZUNvbG9yICAgICAgICA9IGNyZWF0ZV92Ym8oX2dsLGVhcnRoRGF0YS5jKTtcclxuICAgIHZhciBlVGV4dHVyZUNvb3JkID0gY3JlYXRlX3ZibyhfZ2wsZWFydGhEYXRhLnQpO1xyXG4gICAgdmFyIGVWQk9MaXN0ICAgICAgPSBbZVBvc2l0aW9uLGVDb2xvciwgZVRleHR1cmVDb29yZF07XHJcbiAgICB2YXIgZUluZGV4ICAgICAgICA9IGNyZWF0ZV9pYm8oX2dsLGVhcnRoRGF0YS5pKTtcclxuXHJcbiAgICByZXR1cm4ge1ZCT0xpc3Q6ZVZCT0xpc3QsaUluZGV4OmVJbmRleCxpbmRleDplYXJ0aERhdGEuaX1cclxufVxyXG5mdW5jdGlvbiBpbml0Wm9vbUJsdXIoX2dsLF92c0lkLF9mc0lkKXtcclxuICAgIHZhciBwcmcgPSBjcmVhdGVfcHJvZ3JhbShfZ2wsY3JlYXRlX3NoYWRlcihfZ2wsX3ZzSWQpLGNyZWF0ZV9zaGFkZXIoX2dsLF9mc0lkKSk7XHJcbiAgICB2YXIgYXR0TG9jYXRpb24gPSBbXTtcclxuICAgIGF0dExvY2F0aW9uWzBdID0gX2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZywgJ3Bvc2l0aW9uJyk7XHJcbiAgICBhdHRMb2NhdGlvblsxXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXhDb29yZCcpO1xyXG4gICAgdmFyIGF0dFN0cmlkZSA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDI7XHJcbiAgICB2YXIgdW5pTG9jYXRpb24gPSBbXTtcclxuICAgIHVuaUxvY2F0aW9uWzBdID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICdtdnBNYXRyaXgnKTtcclxuICAgIHVuaUxvY2F0aW9uWzFdID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd0ZXh0dXJlJyk7XHJcbiAgICB1bmlMb2NhdGlvblsyXSA9IF9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAnc3RyZW5ndGgnKTtcclxuICAgIHVuaUxvY2F0aW9uWzNdID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd3aWR0aCcpO1xyXG4gICAgdW5pTG9jYXRpb25bNF0gPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ2hlaWdodCcpO1xyXG4gICAgLy8g5p2/44Od44Oq44K044OzXHJcbiAgICB2YXIgcG9zaXRpb24gPSBbLTEuMCwgMS4wLCAwLjAsXHJcbiAgICAxLjAsIDEuMCwgMC4wLCAtIDEuMCwgLSAxLjAsIDAuMCxcclxuICAgIDEuMCwgLSAxLjAsIDAuMF07XHJcbiAgICB2YXIgdGV4Q29vcmQgPSBbXHJcbiAgICAwLjAsIDAuMCxcclxuICAgIDEuMCwgMC4wLFxyXG4gICAgMC4wLCAxLjAsXHJcbiAgICAxLjAsIDEuMF07XHJcbiAgICB2YXIgaW5kZXggPSBbXHJcbiAgICAwLCAyLCAxLFxyXG4gICAgMiwgMywgMV07XHJcbiAgICB2YXIgdlBvc2l0aW9uID0gY3JlYXRlX3ZibyhfZ2wscG9zaXRpb24pO1xyXG4gICAgdmFyIHZUZXhDb29yZCA9IGNyZWF0ZV92Ym8oX2dsLHRleENvb3JkKTtcclxuICAgIHZhciB2VkJPTGlzdCA9IFt2UG9zaXRpb24sIHZUZXhDb29yZF07XHJcbiAgICB2YXIgaUluZGV4ID0gY3JlYXRlX2libyhfZ2wsaW5kZXgpO1xyXG5cclxuICAgIHJldHVybntwcmc6cHJnLCBhdHRMb2NhdGlvbjphdHRMb2NhdGlvbiwgYXR0U3RyaWRlOmF0dFN0cmlkZSx1bmlMb2NhdGlvbjp1bmlMb2NhdGlvbiAsVkJPTGlzdDp2VkJPTGlzdCwgaW5kZXg6aW5kZXgsIGlJbmRleDppSW5kZXh9XHJcbn1cclxuZnVuY3Rpb24gaW5pdE92ZXJhbGwoX2dsLCl7XHJcbiAgICAvLyAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJDjgajjg6rjg7Pjgq9cclxuICAgICB2YXIgcHJnID0gY3JlYXRlX3Byb2dyYW0oX2dsLGNyZWF0ZV9zaGFkZXIoX2dsLCd2cycpLCBjcmVhdGVfc2hhZGVyKF9nbCwnZnMnKSk7XHJcblxyXG4gICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLphY3liJfjgavlj5blvpdcclxuICAgIHZhciBhdHRMb2NhdGlvbiA9IFtdO1xyXG4gICAgYXR0TG9jYXRpb25bMF0gPSBfZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAncG9zaXRpb24nKTtcclxuICAgIGF0dExvY2F0aW9uWzFdID0gX2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZywgJ2NvbG9yJyk7XHJcbiAgICBhdHRMb2NhdGlvblsyXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXh0dXJlQ29vcmQnKTtcclxuICAgIC8vIGF0dHJpYnV0ZeOBruimgee0oOaVsOOCkumFjeWIl+OBq+agvOe0jVxyXG4gICAgdmFyIGF0dFN0cmlkZSA9IFtdO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDQ7XHJcbiAgICBhdHRTdHJpZGVbMl0gPSAyO1xyXG4gICAgLy8g6aCC54K544Gu5L2N572uXHJcbiAgICB2YXIgcG9zaXRpb24gPSBbXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAwLjAsXHJcbiAgICAgICAgIDEuMCwgLTEuMCwgIDAuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueiJslxyXG4gICAgdmFyIGNvbG9yID0gW1xyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOODhuOCr+OCueODgeODo+W6p+aomVxyXG4gICAgdmFyIHRleHR1cmVDb29yZCA9IFtcclxuICAgICAgICAwLjAsIDAuMCxcclxuICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgdmFyIGluZGV4ID0gW1xyXG4gICAgICAgIDAsIDEsIDIsXHJcbiAgICAgICAgMywgMiwgMVxyXG4gICAgXTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueUn+aIkFxyXG4gICAgdmFyIHZQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKF9nbCxwb3NpdGlvbik7XHJcbiAgICB2YXIgdkNvbG9yICAgICAgICA9IGNyZWF0ZV92Ym8oX2dsLGNvbG9yKTtcclxuICAgIHZhciB2VGV4dHVyZUNvb3JkID0gY3JlYXRlX3ZibyhfZ2wsdGV4dHVyZUNvb3JkKTtcclxuICAgIHZhciBWQk9MaXN0ICAgICAgID0gW3ZQb3NpdGlvbiwgdkNvbG9yLCB2VGV4dHVyZUNvb3JkXTtcclxuICAgIHZhciBpSW5kZXggICAgICAgID0gY3JlYXRlX2libyhfZ2wsaW5kZXgpO1xyXG5cclxuICAgIC8vIHVuaWZvcm1Mb2NhdGlvbuOCkumFjeWIl+OBq+WPluW+l1xyXG4gICAgdmFyIHVuaUxvY2F0aW9uID0gW107XHJcbiAgICB1bmlMb2NhdGlvblswXSAgPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ212cE1hdHJpeCcpO1xyXG4gICAgdW5pTG9jYXRpb25bMV0gID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd0ZXh0dXJlJyk7XHJcblxyXG4gICAgcmV0dXJue3ByZzpwcmcsYXR0TG9jYXRpb246YXR0TG9jYXRpb24sYXR0U3RyaWRlOmF0dFN0cmlkZSxWQk9MaXN0OlZCT0xpc3QsaUluZGV4OmlJbmRleCx1bmlMb2NhdGlvbjp1bmlMb2NhdGlvbn07XHJcbn1cclxuZnVuY3Rpb24gYmluZEJhY2tncm91bmQoX2dsLF9mQnVmZmVyLF9iYWNrZ3JvdW5kRGF0YSxfdGltZSxfbXgsX215LF9jdyxfY2gsX2hzdil7XHJcbiAgICBfZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUixfZkJ1ZmZlci5mKTtcclxuICAgIF9nbC5jbGVhckNvbG9yKDAuMCwwLjAsMC4wLDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIF9nbC51c2VQcm9ncmFtKF9iYWNrZ3JvdW5kRGF0YS5wcmcpO1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS54Sh5Yq544Gr44GZ44KLXHJcbiAgICBfZ2wuZGlzYWJsZShfZ2wuQkxFTkQpO1xyXG4gICAgLy9hdHRyaWJ1dGXjga7nmbvpjLJcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsX2JhY2tncm91bmREYXRhLnZQb3NpdGlvbik7XHJcbiAgICBfZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoX2JhY2tncm91bmREYXRhLnZBdHRMb2NhdGlvbik7XHJcbiAgICBfZ2wudmVydGV4QXR0cmliUG9pbnRlcihfYmFja2dyb3VuZERhdGEudkF0dExvY2F0aW9uLDMsX2dsLkZMT0FULGZhbHNlLDAsMCk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsX2JhY2tncm91bmREYXRhLnZJbmRleCk7XHJcblxyXG4gICAgX2dsLnVuaWZvcm0xZihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMF0sX3RpbWUpO1xyXG4gICAgX2dsLnVuaWZvcm0yZnYoX2JhY2tncm91bmREYXRhLnVuaUxvY2F0aW9uWzFdLFtfbXgsX215XSk7XHJcbiAgICBfZ2wudW5pZm9ybTJmdihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMl0sW19jdyxfY2hdKTtcclxuICAgIF9nbC51bmlmb3JtNGZ2KF9iYWNrZ3JvdW5kRGF0YS51bmlMb2NhdGlvblszXSxbX2hzdlswXSxfaHN2WzFdLF9oc3ZbMl0sX2hzdlszXV0pO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLDYsX2dsLlVOU0lHTkVEX1NIT1JULDApO1xyXG5cclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLG51bGwpO1xyXG5cclxufVxyXG5mdW5jdGlvbiBiaW5kWm9vbWJsdXIoX2dsLF96b29tYmx1ckRhdGEsX2ZCdWZmZXIsX2N3LF9jaCxfYmx1ckZyYWcpe1xyXG4vKumgkeW8teOBo+OBpuabuOOBjeaPm+OBiOOCiyovXHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrumBuOaKnlxyXG4gICAgX2dsLnVzZVByb2dyYW0oX3pvb21ibHVyRGF0YS5wcmcpO1xyXG5cclxuICAgIF9nbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XHJcbiAgICBfZ2wuY2xlYXJEZXB0aCgxLjApO1xyXG4gICAgX2dsLmNsZWFyKF9nbC5DT0xPUl9CVUZGRVJfQklUIHwgX2dsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vIOato+WwhOW9seeUqOOBruW6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgbS5sb29rQXQoWzAuMCwgMC4wLCAwLjVdLCBbMC4wLCAwLjAsIDAuMF0sIFswLjAsIDEuMCwgMC4wXSwgdk1hdHJpeCk7XHJcbiAgICBtLm9ydGhvKC0xLjAsIDEuMCwgMS4wLCAtIDEuMCwgMC4xLCAxLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuICAvLyAgdmFyIHN0cmVuZ3RoXHJcbiAgICBjb25zb2xlLmxvZyhfYmx1ckZyYWcpO1xyXG4gICAgaWYoIV9ibHVyRnJhZyl7XHJcbi8vICAgICAgICBzdHJlbmd0aCA9IDIwO1xyXG4gICAgICAgIGJsdXJWYWx1ZS09MC4xO1xyXG4gICAgICAgIGlmKGJsdXJWYWx1ZTw9MCl7XHJcbiAgICAgICAgICAgIGJsdXJWYWx1ZT0wO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAgX2dsLmFjdGl2ZVRleHR1cmUoX2dsLlRFWFRVUkUwKTtcclxuICAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIF9mQnVmZmVyLnQpO1xyXG4gICAgIHNldF9hdHRyaWJ1dGUoX2dsLF96b29tYmx1ckRhdGEuVkJPTGlzdCwgX3pvb21ibHVyRGF0YS5hdHRMb2NhdGlvbiwgX3pvb21ibHVyRGF0YS5hdHRTdHJpZGUpO1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBfem9vbWJsdXJEYXRhLmlJbmRleCk7XHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfem9vbWJsdXJEYXRhLnVuaUxvY2F0aW9uWzBdLCBmYWxzZSwgdG1wTWF0cml4KTtcclxuICAgIF9nbC51bmlmb3JtMWkoX3pvb21ibHVyRGF0YS51bmlMb2NhdGlvblsxXSwgMCk7XHJcbiAgICBfZ2wudW5pZm9ybTFmKF96b29tYmx1ckRhdGEudW5pTG9jYXRpb25bMl0sIGJsdXJWYWx1ZSk7XHJcbiAgICBfZ2wudW5pZm9ybTFmKF96b29tYmx1ckRhdGEudW5pTG9jYXRpb25bM10sIF9jdyk7XHJcbiAgICBfZ2wudW5pZm9ybTFmKF96b29tYmx1ckRhdGEudW5pTG9jYXRpb25bNF0sIF9jaCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIF96b29tYmx1ckRhdGEuaW5kZXgubGVuZ3RoLCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxufVxyXG5mdW5jdGlvbiBiaW5kT3ZlcmFsbChfZ2wsX292ZXJhbGxEYXRhLF9mQnVmZmVyLF9tLF9tTWF0cml4LF90bXBNYXRyaXgsX212cE1hdHJpeCxfcmFkLF90ZXh0dXJlLF90ZXh0dXJlTSxfcG9zWCxfcG9zWSxfcG9zWixfcG9zWG0sX3Bvc1ltLF9wb3NabSxfZ2V0bnVtYmVyLF9nZXRudW1iZXJNKXtcclxuICAgIC8vIGNhbnZhc+OCkuWIneacn+WMllxyXG4gICAgX2dsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgIF9nbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCBfZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS3og4zmma/jg4bjgq/jgrnjg4Hjg6Mo44Kq44OV44K544Kv44Oq44O844Oz44Os44Oz44K/44Oq44Oz44KwKS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbiAgICBfZ2wudXNlUHJvZ3JhbShfb3ZlcmFsbERhdGEucHJnKTtcclxuICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkueEoeWKueOBq+OBmeOCi1xyXG4gICAgX2dsLmRpc2FibGUoX2dsLkJMRU5EKTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueZu+mMslxyXG4gICAgc2V0X2F0dHJpYnV0ZShfZ2wsX292ZXJhbGxEYXRhLlZCT0xpc3QsIF9vdmVyYWxsRGF0YS5hdHRMb2NhdGlvbiwgX292ZXJhbGxEYXRhLmF0dFN0cmlkZSk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIF9vdmVyYWxsRGF0YS5pSW5kZXgpO1xyXG4gICAgLyrnp7vli5XjgIHlm57ou6LjgIHmi6HlpKfnuK7lsI8qL1xyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFswLjAsMC4wLC05NS4wXSxfbU1hdHJpeCk7XHJcbiAgICBfbS5zY2FsZShfbU1hdHJpeCxbMTAwLjAsNzAuMCwxLjBdLF9tTWF0cml4KTtcclxuICAgIF9tLm11bHRpcGx5KF90bXBNYXRyaXgsIF9tTWF0cml4LCBfbXZwTWF0cml4KTtcclxuICAgIC8vdW5pZm9ybeOCkueZu+mMslxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELF9mQnVmZmVyLnQpO1xyXG4gICAgX2dsLnVuaWZvcm0xaShfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uWzBdLCBmYWxzZSwgX212cE1hdHJpeCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIDYsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcblxyXG4gICAgLyrjg4bjgq/jgrnjg4Hjg6MqL1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS5pyJ5Yq544Gr44GZ44KLXHJcblxyXG4gICAgX2dsLmVuYWJsZShfZ2wuQkxFTkQpO1xyXG4gICBpZihfdGV4dHVyZSl7XHJcbiAgICAgICBmb3IodmFyIGk9MDtpPF90ZXh0dXJlLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIF9wb3NaW2ldLT0wLjQwO1xyXG4gICAgICAgIGlmKF9wb3NaW2ldPC05MCl7XHJcbiAgICAgICAgICAgIC8vIOOCq+ODoeODqeOCiOOCiuWJjeOBq+OBmeOBmeOCk+OBoOOCieOAgemFjeWIl+OCkua4m+OCieOBmeWHpueQhuOBjOW+ruWmmVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgX3RleHR1cmUuc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1guc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1kuc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1ouc2hpZnQoKTtcclxuICAgICAgICAgICBfZ2V0bnVtYmVyLS07XHJcbi8vZ2V0bnVtYmVyLS1cclxuLy9jb25zb2xlLmxvZyhcImJpbmTjgZfjgabjgYTjgotcIitnZXRudW1iZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiaW5kUGxhdGVQb2x5KF9nbCxfbSxfbU1hdHJpeCxfdG1wTWF0cml4LF9tdnBNYXRyaXgsX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uLGksX3Bvc1hbaV0sX3Bvc1lbaV0sX3Bvc1pbaV0sZmFsc2UpO1xyXG4gICAgICAgfVxyXG4gICB9XHJcbiAgIGlmKF90ZXh0dXJlTSl7XHJcbiAgICAgICBmb3IodmFyIGk9MDtpPF90ZXh0dXJlTS5sZW5ndGg7aSsrKXtcclxuICAgICAgICBfcG9zWm1baV0rPTEuMDtcclxuICAgICAgICBpZihfcG9zWm1baV0+MTApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgX3RleHR1cmVNLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWW0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1ptLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgX2dldG51bWJlck0tLTtcclxuICAvLyAgICAgICAgICBnZXRudW1iZXJNLS07XHJcbi8vY29uc29sZS5sb2coXCJiaW5k44GX44Gm44GE44KLXCIrZ2V0bnVtYmVyTSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJpbmRQbGF0ZVBvbHlNaWRkbGUoX2dsLF9tLF9tTWF0cml4LF90bXBNYXRyaXgsX212cE1hdHJpeCxfb3ZlcmFsbERhdGEudW5pTG9jYXRpb24saSxfcG9zWG1baV0sX3Bvc1ltW2ldLF9wb3NabVtpXSxmYWxzZSk7XHJcbiAgICAgICB9XHJcbiAgIH1cclxufVxyXG5mdW5jdGlvbiBiaW5kSW5TcGhlcmUoX2MsX2dsLF9mQnVmZmVyLF9vdmVyYWxsRGF0YSxfaW5TcGhlcmVEYXRhLF90ZXh0dXJlLF90ZXh0dXJlTSxfcG9zWCxfcG9zWSxfcG9zWixfcG9zWG0sX3Bvc1ltLF9wb3NabSxfZ2V0bnVtYmVyLF9nZXRudW1iZXJNLF9zcGhlcmVDb3VudFcsX3NwaGVyZUNvdW50SCl7XHJcbiAgICB2YXIgcmFkVyA9IChfc3BoZXJlQ291bnRXICUgMzYwKSAqIE1hdGguUEkgLyAxODA7XHJcbiAgICB2YXIgcmFkSCA9IChfc3BoZXJlQ291bnRIICUgMzYwKSAqIE1hdGguUEkgLyAxODA7XHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIC8vIOODk+ODpeODvMOX44OX44Ot44K444Kn44Kv44K344On44Oz5bqn5qiZ5aSJ5o+b6KGM5YiXXHJcbiAgICB2YXIgZXllUG9zaXRpb249WzAuMCwgMC4wLCA1LjBdO1xyXG4gICAgdmFyIGNlbnRlclBvc2l0aW9uPVswLjAsIDAuMCwgMC4wXTtcclxuICAgIHZhciB1cFBvc2l0aW9uPVswLjAsIDEuMCwgMC4wXTtcclxuICAgIG0ucGVyc3BlY3RpdmUoNDUsIF9jLndpZHRoIC8gX2MuaGVpZ2h0LCAwLjEsIDEwMCwgcE1hdHJpeCk7XHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcblxyXG5cclxuICAgIHZhciBxPW5ldyBxdG5JVigpO1xyXG4gICAgdmFyIGNhbVE9cS5pZGVudGl0eShxLmNyZWF0ZSgpKTtcclxuICAgIHZhciBjYW1XPXEuaWRlbnRpdHkocS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgY2FtSD1xLmlkZW50aXR5KHEuY3JlYXRlKCkpO1xyXG5cclxuICAgIHEucm90YXRlKHJhZFcsWzAsMSwwXSxjYW1XKTtcclxuICAgIHEucm90YXRlKHJhZEgsWzEsMCwwXSxjYW1IKTtcclxuICAgIHEubXVsdGlwbHkoY2FtSCxjYW1XLGNhbVEpO1xyXG4gICAgdmFyIGNhbVVwPVtdO1xyXG4gICAgdmFyIGNhbWZvcndhcmQ9W107XHJcbiAgICBxLnRvVmVjSUlJKHVwUG9zaXRpb24sY2FtUSxjYW1VcCk7XHJcbiAgICBxLnRvVmVjSUlJKFswLjAsMC4wLC0xLjBdLGNhbVEsY2FtZm9yd2FyZCk7XHJcblxyXG4gICAgdmFyIGV5ZUNhbT1bXTtcclxuICAgIGV5ZUNhbVswXT1leWVQb3NpdGlvblswXStjYW1mb3J3YXJkWzBdO1xyXG4gICAgZXllQ2FtWzFdPWV5ZVBvc2l0aW9uWzFdK2NhbWZvcndhcmRbMV07XHJcbiAgICBleWVDYW1bMl09ZXllUG9zaXRpb25bMl0rY2FtZm9yd2FyZFsyXTtcclxuICAgIG0ubG9va0F0KGV5ZVBvc2l0aW9uLCBleWVDYW0sIGNhbVVwLCB2TWF0cml4KTtcclxuXHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcblxyXG5cclxuX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsX2ZCdWZmZXIuZik7XHJcbiAgICAvLyBjYW52YXPjgpLliJ3mnJ/ljJZcclxuICAgIF9nbC5jbGVhckNvbG9yKDAuMCwwLjAsMC4wLDEuMCk7XHJcbiAgICBfZ2wuY2xlYXJEZXB0aCgxLjApO1xyXG4gICAgX2dsLmNsZWFyKF9nbC5DT0xPUl9CVUZGRVJfQklUIHwgX2dsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuXHJcbiAgICBfZ2wudXNlUHJvZ3JhbShfb3ZlcmFsbERhdGEucHJnKTtcclxuICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkueEoeWKueOBq+OBmeOCi1xyXG4gICAgX2dsLmRpc2FibGUoX2dsLkJMRU5EKTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueZu+mMslxyXG4gICAgc2V0X2F0dHJpYnV0ZShfZ2wsX2luU3BoZXJlRGF0YS5WQk9MaXN0LCBfb3ZlcmFsbERhdGEuYXR0TG9jYXRpb24sIF9vdmVyYWxsRGF0YS5hdHRTdHJpZGUpO1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBfaW5TcGhlcmVEYXRhLmlJbmRleCk7XHJcbiAgICAvKuenu+WLleOAgeWbnui7ouOAgeaLoeWkp+e4ruWwjyovXHJcblxyXG4gICAgbS5pZGVudGl0eShtTWF0cml4KTtcclxuICAgIG0udHJhbnNsYXRlKG1NYXRyaXgsWzAuMCwwLjAsNS4wXSxtTWF0cml4KTtcclxuICAgIG0uc2NhbGUobU1hdHJpeCxbMTAuMCwxMC4wLDEwLjBdLG1NYXRyaXgpO1xyXG4gICAgbS5yb3RhdGUobU1hdHJpeCwgMTgwLCBbMSwgMCwgMF0sIG1NYXRyaXgpO1xyXG5cclxuICAgIG0ubXVsdGlwbHkodG1wTWF0cml4LCBtTWF0cml4LCBtdnBNYXRyaXgpO1xyXG4gICAgLy91bmlmb3Jt44KS55m76YyyXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsc3BoZXJlVGV4dHVyZSk7XHJcbiAgICBfZ2wudW5pZm9ybTFpKF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvblsxXSwgMCk7XHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMF0sIGZhbHNlLCBtdnBNYXRyaXgpO1xyXG5cclxuICAgIF9nbC5kcmF3RWxlbWVudHMoX2dsLlRSSUFOR0xFUywgX2luU3BoZXJlRGF0YS5pbmRleC5sZW5ndGgsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcblxyXG5cclxuICAgIC8vIFZCT+OBqElCT+OBrueZu+mMslxyXG4gICAgc2V0X2F0dHJpYnV0ZShfZ2wsX292ZXJhbGxEYXRhLlZCT0xpc3QsIF9vdmVyYWxsRGF0YS5hdHRMb2NhdGlvbiwgX292ZXJhbGxEYXRhLmF0dFN0cmlkZSk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIF9vdmVyYWxsRGF0YS5pSW5kZXgpO1xyXG4gICAgX2dsLmVuYWJsZShfZ2wuQkxFTkQpO1xyXG4gICBpZihfdGV4dHVyZSl7XHJcbiAgICAgICBmb3IodmFyIGk9MDtpPF90ZXh0dXJlLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIF9wb3NZW2ldKz0wLjE7XHJcbiAgICAgICAgaWYoX3Bvc1pbaV08LTkwKXtcclxuICAgICAgICAgICAgLy8g44Kr44Oh44Op44KI44KK5YmN44Gr44GZ44GZ44KT44Gg44KJ44CB6YWN5YiX44KS5rib44KJ44GZ5Yem55CG44GM5b6u5aaZXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5YmK6Zmk44GX44Gm44G+44GZXCIpO1xyXG4gICAgICAgICAgICBfdGV4dHVyZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWi5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfZ2V0bnVtYmVyLS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJpbmRQbGF0ZVBvbHkoX2dsLG0sbU1hdHJpeCx0bXBNYXRyaXgsbXZwTWF0cml4LF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvbixpLF9wb3NYW2ldLF9wb3NZW2ldLF9wb3NaW2ldLHRydWUpO1xyXG4gICAgICAgfVxyXG4gICB9XHJcbiAgIGlmKF90ZXh0dXJlTSl7XHJcbiAgICAgICBmb3IodmFyIGk9MDtpPF90ZXh0dXJlTS5sZW5ndGg7aSsrKXtcclxuICAgICAgICBfcG9zWm1baV0rPTEuMDtcclxuICAgICAgICBpZihfcG9zWm1baV0+MTApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgX3RleHR1cmVNLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWW0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1ptLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXJNLS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJpbmRQbGF0ZVBvbHlNaWRkbGUoX2dsLG0sbU1hdHJpeCx0bXBNYXRyaXgsbXZwTWF0cml4LF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvbixpLF9wb3NYbVtpXSxfcG9zWW1baV0sX3Bvc1ptW2ldLHRydWUpO1xyXG4gICAgICAgfVxyXG4gICB9XHJcblxyXG5fZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUixudWxsKTtcclxuXHJcbn1cclxuXHJcbi8vdGV4dHVyZeezu+OCkuW8leaVsOOBq+OBqOOBo+OBpuOBquOBhOOBp+OCsOODreODvOODkOODq+OBruOCkuOBpOOBi+OBo+OBpuOCi1xyXG5mdW5jdGlvbiBiaW5kUGxhdGVQb2x5KF9nbCxfbSxfbU1hdHJpeCxfdG1wTWF0cml4LF9tdnBNYXRyaXgsX3VuaUxvY2F0aW9uLF9udW1iZXIsX3Bvc1gsX3Bvc1ksX3Bvc1osX3NjYWxlRnJhZyl7XHJcbiAgICAvLyDjg6Ljg4fjg6vluqfmqJnlpInmj5vooYzliJfjga7nlJ/miJBcclxuICAgIF9tLmlkZW50aXR5KF9tTWF0cml4KTtcclxuICAgIF9tLnRyYW5zbGF0ZShfbU1hdHJpeCxbX3Bvc1gsX3Bvc1ksX3Bvc1pdLF9tTWF0cml4KTtcclxuICAgIGlmKF9zY2FsZUZyYWcpe1xyXG4gICAgICAgIF9tLnJvdGF0ZShfbU1hdHJpeCxNYXRoLlBJLFsxLDAsMF0sX21NYXRyaXgpO1xyXG4gICAgICAgIF9tLnNjYWxlKF9tTWF0cml4LFswLjMsMC4zLDAuM10sX21NYXRyaXgpO1xyXG4gICAgfVxyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZVtfbnVtYmVyXSk7XHJcbiAgICBcclxuICAgIC8vIHVuaWZvcm3lpInmlbDjgavjg4bjgq/jgrnjg4Hjg6PjgpLnmbvpjLJcclxuICAgX2dsLnVuaWZvcm0xaShfdW5pTG9jYXRpb25bMV0sIDApO1xyXG5cclxuICAgIC8vIHVuaWZvcm3lpInmlbDjga7nmbvpjLLjgajmj4/nlLtcclxuICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KF91bmlMb2NhdGlvblswXSwgZmFsc2UsIF9tdnBNYXRyaXgpO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLCA2LCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxuICAgIFxyXG59XHJcbi8v55yf44KT5Lit44Gu44OG44Kv44K544OB44Oj44KS44GX44KI44GG44GZ44KLXHJcbmZ1bmN0aW9uIGJpbmRQbGF0ZVBvbHlNaWRkbGUoX2dsLF9tLF9tTWF0cml4LF90bXBNYXRyaXgsX212cE1hdHJpeCxfdW5pTG9jYXRpb24sX251bWJlcixfcG9zWG0sX3Bvc1ltLF9wb3NabSxfc2NhbGVGcmFnKXtcclxuICAgIF9tLmlkZW50aXR5KF9tTWF0cml4KTtcclxuICAgIF9tLnRyYW5zbGF0ZShfbU1hdHJpeCxbX3Bvc1htLF9wb3NZbSxfcG9zWm1dLF9tTWF0cml4KTtcclxuICAgIGlmKF9zY2FsZUZyYWcpe1xyXG4gICAgICAgIF9tLnJvdGF0ZShfbU1hdHJpeCxNYXRoLlBJLFsxLDAsMF0sX21NYXRyaXgpO1xyXG4gICAgICAgIF9tLnNjYWxlKF9tTWF0cml4LFswLjMsMC4zLDAuM10sX21NYXRyaXgpO1xyXG4gICAgfVxyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZU1bX251bWJlcl0pO1xyXG4gICAgXHJcbiAgICAvLyB1bmlmb3Jt5aSJ5pWw44Gr44OG44Kv44K544OB44Oj44KS55m76YyyXHJcbiAgIF9nbC51bmlmb3JtMWkoX3VuaUxvY2F0aW9uWzFdLCAwKTtcclxuXHJcbiAgICAvLyB1bmlmb3Jt5aSJ5pWw44Gu55m76Yyy44Go5o+P55S7XHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfdW5pTG9jYXRpb25bMF0sIGZhbHNlLCBfbXZwTWF0cml4KTtcclxuICAgIF9nbC5kcmF3RWxlbWVudHMoX2dsLlRSSUFOR0xFUywgNiwgX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbn1cclxuLy8g44K344Kn44O844OA44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9zaGFkZXIoX2dsLF9pZCl7XHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgpLmoLzntI3jgZnjgovlpInmlbBcclxuICAgIHZhciBzaGFkZXI7XHJcbiAgICBcclxuICAgIC8vIEhUTUzjgYvjgolzY3JpcHTjgr/jgrDjgbjjga7lj4LnhafjgpLlj5blvpdcclxuICAgIHZhciBzY3JpcHRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoX2lkKTtcclxuICAgIFxyXG4gICAgLy8gc2NyaXB044K/44Kw44GM5a2Y5Zyo44GX44Gq44GE5aC05ZCI44Gv5oqc44GR44KLXHJcbiAgICBpZighc2NyaXB0RWxlbWVudCl7cmV0dXJuO31cclxuICAgIFxyXG4gICAgLy8gc2NyaXB044K/44Kw44GudHlwZeWxnuaAp+OCkuODgeOCp+ODg+OCr1xyXG4gICAgc3dpdGNoKHNjcmlwdEVsZW1lbnQudHlwZSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g6aCC54K544K344Kn44O844OA44Gu5aC05ZCIXHJcbiAgICAgICAgY2FzZSAneC1zaGFkZXIveC12ZXJ0ZXgnOlxyXG4gICAgICAgICAgICBzaGFkZXIgPSBfZ2wuY3JlYXRlU2hhZGVyKF9nbC5WRVJURVhfU0hBREVSKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIC8vIOODleODqeOCsOODoeODs+ODiOOCt+OCp+ODvOODgOOBruWgtOWQiFxyXG4gICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOlxyXG4gICAgICAgICAgICBzaGFkZXIgPSBfZ2wuY3JlYXRlU2hhZGVyKF9nbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0IDpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyDnlJ/miJDjgZXjgozjgZ/jgrfjgqfjg7zjg4Djgavjgr3jg7zjgrnjgpLlibLjgorlvZPjgabjgotcclxuICAgIF9nbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzY3JpcHRFbGVtZW50LnRleHQpO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgpLjgrPjg7Pjg5HjgqTjg6vjgZnjgotcclxuICAgIF9nbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOBjOato+OBl+OBj+OCs+ODs+ODkeOCpOODq+OBleOCjOOBn+OBi+ODgeOCp+ODg+OCr1xyXG4gICAgaWYoX2dsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIF9nbC5DT01QSUxFX1NUQVRVUykpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOaIkOWKn+OBl+OBpuOBhOOBn+OCieOCt+OCp+ODvOODgOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgICAgIHJldHVybiBzaGFkZXI7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDlpLHmlZfjgZfjgabjgYTjgZ/jgonjgqjjg6njg7zjg63jgrDjgpLjgqLjg6njg7zjg4jjgZnjgotcclxuICAgICAgICBhbGVydChfZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcclxuICAgIH1cclxufVxyXG4vLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLnlJ/miJDjgZfjgrfjgqfjg7zjg4DjgpLjg6rjg7Pjgq/jgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3Byb2dyYW0oX2dsLF92cywgX2ZzKXtcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIHByb2dyYW0gPSBfZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgavjgrfjgqfjg7zjg4DjgpLlibLjgorlvZPjgabjgotcclxuICAgIF9nbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgX3ZzKTtcclxuICAgIF9nbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgX2ZzKTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44KS44Oq44Oz44KvXHJcbiAgICBfZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOBruODquODs+OCr+OBjOato+OBl+OBj+ihjOOBquOCj+OCjOOBn+OBi+ODgeOCp+ODg+OCr1xyXG4gICAgaWYoX2dsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgX2dsLkxJTktfU1RBVFVTKSl7XHJcbiAgICBcclxuICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgICAgICBfZ2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gcHJvZ3JhbTtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOWkseaVl+OBl+OBpuOBhOOBn+OCieOCqOODqeODvOODreOCsOOCkuOCouODqeODvOODiOOBmeOCi1xyXG4gICAgICAgIGFsZXJ0KF9nbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSk7XHJcbiAgICB9XHJcbn1cclxuLy8gVkJP44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV92Ym8oX2dsLF9kYXRhKXtcclxuICAgIC8vIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIHZibyA9IF9nbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgavjg4fjg7zjgr/jgpLjgrvjg4Pjg4hcclxuICAgIF9nbC5idWZmZXJEYXRhKF9nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoX2RhdGEpLCBfZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xyXG4gICAgXHJcbiAgICAvLyDnlJ/miJDjgZfjgZ8gVkJPIOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIHZibztcclxufVxyXG4vLyBWQk/jgpLjg5DjgqTjg7Pjg4njgZfnmbvpjLLjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZShfZ2wsX3ZibywgX2F0dEwsIF9hdHRTKXtcclxuICAgIC8vIOW8leaVsOOBqOOBl+OBpuWPl+OBkeWPluOBo+OBn+mFjeWIl+OCkuWHpueQhuOBmeOCi1xyXG4gICAgZm9yKHZhciBpIGluIF92Ym8pe1xyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsIF92Ym9baV0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGF0dHJpYnV0ZUxvY2F0aW9u44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICAgICAgX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KF9hdHRMW2ldKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkumAmuefpeOBl+eZu+mMsuOBmeOCi1xyXG4gICAgICAgIF9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKF9hdHRMW2ldLCBfYXR0U1tpXSwgX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICB9XHJcbn1cclxuLy8gSUJP44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9pYm8oX2dsLF9kYXRhKXtcclxuICAgIC8vIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGlibyA9IF9nbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBq+ODh+ODvOOCv+OCkuOCu+ODg+ODiFxyXG4gICAgX2dsLmJ1ZmZlckRhdGEoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgSW50MTZBcnJheShfZGF0YSksIF9nbC5TVEFUSUNfRFJBVyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GX44GfSUJP44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICByZXR1cm4gaWJvO1xyXG59XHJcblxyXG4vLyDjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3RleHR1cmUoX2dsLF9zb3VyY2UsX24sX2ZyYWcpe1xyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICBcclxuICAgIC8vIOODh+ODvOOCv+OBruOCquODs+ODreODvOODieOCkuODiOODquOCrOODvOOBq+OBmeOCi1xyXG4gICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgdmFyIHRleCA9IF9nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBuOOCpOODoeODvOOCuOOCkumBqeeUqFxyXG4gICAgICAgIF9nbC50ZXhJbWFnZTJEKF9nbC5URVhUVVJFXzJELCAwLCBfZ2wuUkdCQSwgX2dsLlJHQkEsIF9nbC5VTlNJR05FRF9CWVRFLCBpbWcpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01BR19GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUixfZ2wuTElORUFSKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1MsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX1dSQVBfVCxfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG4gICAgICAgIC8vIOODn+ODg+ODl+ODnuODg+ODl+OCkueUn+aIkFxyXG4gICAgICAgIF9nbC5nZW5lcmF0ZU1pcG1hcChfZ2wuVEVYVFVSRV8yRCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDnlJ/miJDjgZfjgZ/jg4bjgq/jgrnjg4Hjg6PjgpLjgrDjg63jg7zjg5Djg6vlpInmlbDjgavku6PlhaVcclxuICAgICAgICBpZihfZnJhZyl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlX3RleHR1cmVNXCIpO1xyXG4gICAgICAgICAgICB0ZXh0dXJlTVtfbl0gPSB0ZXg7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlX3RleHR1cmVcIik7XHJcbiAgICAgICAgICAgIHRleHR1cmVbX25dID0gdGV4O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBruOCveODvOOCueOCkuaMh+WumlxyXG4gICAgaW1nLnNyYyA9IF9zb3VyY2U7XHJcbn1cclxuLy8g44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZVNwaGVyZVRleHR1cmUoX2dsLF9zb3VyY2Upe1xyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICBcclxuICAgIC8vIOODh+ODvOOCv+OBruOCquODs+ODreODvOODieOCkuODiOODquOCrOODvOOBq+OBmeOCi1xyXG4gICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgdmFyIHRleCA9IF9nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBuOOCpOODoeODvOOCuOOCkumBqeeUqFxyXG4gICAgICAgIF9nbC50ZXhJbWFnZTJEKF9nbC5URVhUVVJFXzJELCAwLCBfZ2wuUkdCQSwgX2dsLlJHQkEsIF9nbC5VTlNJR05FRF9CWVRFLCBpbWcpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01BR19GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUixfZ2wuTElORUFSKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1MsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX1dSQVBfVCxfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG4gICAgICAgIC8vIOODn+ODg+ODl+ODnuODg+ODl+OCkueUn+aIkFxyXG4gICAgICAgIF9nbC5nZW5lcmF0ZU1pcG1hcChfZ2wuVEVYVFVSRV8yRCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDnlJ/miJDjgZfjgZ/jg4bjgq/jgrnjg4Hjg6PjgpLjgrDjg63jg7zjg5Djg6vlpInmlbDjgavku6PlhaVcclxuICAgICAgICAgICAgc3BoZXJlVGV4dHVyZSA9IHRleDtcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBruOCveODvOOCueOCkuaMh+WumlxyXG4gICAgaW1nLnNyYyA9IF9zb3VyY2U7XHJcbn1cclxuLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44KS44Kq44OW44K444Kn44Kv44OI44Go44GX44Gm55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9mcmFtZWJ1ZmZlcihfZ2wsX3dpZHRoLCBfaGVpZ2h0KXtcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOBrueUn+aIkFxyXG4gICAgdmFyIGZyYW1lQnVmZmVyID0gX2dsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCkldlYkdM44Gr44OQ44Kk44Oz44OJXHJcbiAgICBfZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUiwgZnJhbWVCdWZmZXIpO1xyXG4gICAgXHJcbiAgICAvLyDmt7Hluqbjg5Djg4Pjg5XjgqHnlKjjg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqHjga7nlJ/miJDjgajjg5DjgqTjg7Pjg4lcclxuICAgIHZhciBkZXB0aFJlbmRlckJ1ZmZlciA9IF9nbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcclxuICAgIF9nbC5iaW5kUmVuZGVyYnVmZmVyKF9nbC5SRU5ERVJCVUZGRVIsIGRlcHRoUmVuZGVyQnVmZmVyKTtcclxuICAgIFxyXG4gICAgLy8g44Os44Oz44OA44O844OQ44OD44OV44Kh44KS5rex5bqm44OQ44OD44OV44Kh44Go44GX44Gm6Kit5a6aXHJcbiAgICBfZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShfZ2wuUkVOREVSQlVGRkVSLCBfZ2wuREVQVEhfQ09NUE9ORU5UMTYsIF93aWR0aCwgX2hlaWdodCk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOBq+ODrOODs+ODgOODvOODkOODg+ODleOCoeOCkumWoumAo+S7mOOBkeOCi1xyXG4gICAgX2dsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKF9nbC5GUkFNRUJVRkZFUiwgX2dsLkRFUFRIX0FUVEFDSE1FTlQsIF9nbC5SRU5ERVJCVUZGRVIsIGRlcHRoUmVuZGVyQnVmZmVyKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh55So44OG44Kv44K544OB44Oj44Gu55Sf5oiQXHJcbiAgICB2YXIgZlRleHR1cmUgPSBfZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHnlKjjga7jg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4lcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHnlKjjga7jg4bjgq/jgrnjg4Hjg6Pjgavjgqvjg6njg7znlKjjga7jg6Hjg6Ljg6rpoJjln5/jgpLnorrkv51cclxuICAgIF9nbC50ZXhJbWFnZTJEKF9nbC5URVhUVVJFXzJELCAwLCBfZ2wuUkdCQSwgX3dpZHRoLCBfaGVpZ2h0LCAwLCBfZ2wuUkdCQSwgX2dsLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjg5Hjg6njg6Hjg7zjgr9cclxuICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELCBfZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBfZ2wuTElORUFSKTtcclxuICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELCBfZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBfZ2wuTElORUFSKTtcclxuICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELCBfZ2wuVEVYVFVSRV9XUkFQX1MsIF9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELCBfZ2wuVEVYVFVSRV9XUkFQX1QsIF9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44Gr44OG44Kv44K544OB44Oj44KS6Zai6YCj5LuY44GR44KLXHJcbiAgICBfZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoX2dsLkZSQU1FQlVGRkVSLCBfZ2wuQ09MT1JfQVRUQUNITUVOVDAsIF9nbC5URVhUVVJFXzJELCBmVGV4dHVyZSwgMCk7XHJcbiAgICBcclxuICAgIC8vIOWQhOeoruOCquODluOCuOOCp+OCr+ODiOOBruODkOOCpOODs+ODieOCkuino+mZpFxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgIF9nbC5iaW5kUmVuZGVyYnVmZmVyKF9nbC5SRU5ERVJCVUZGRVIsIG51bGwpO1xyXG4gICAgX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG4gICAgXHJcbiAgICAvLyDjgqrjg5bjgrjjgqfjgq/jg4jjgpLov5TjgZfjgabntYLkuoZcclxuICAgIHJldHVybiB7ZiA6IGZyYW1lQnVmZmVyLCBkIDogZGVwdGhSZW5kZXJCdWZmZXIsIHQgOiBmVGV4dHVyZX07XHJcbn1cclxuIl19
