(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

//'use strict';
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
            bindInSphere(c, gl, fBuffer, overallData, inSphereData, texture, posX, posY, posZ, posXm, posYm, posZm, getnumber, sphereCountW, sphereCountH);
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
        createSphereTexture(gl, "../img/test.jpg");
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
        blurValue += 1.0;
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
        blurValue -= 0.05;
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
            bindPlatePoly(_gl, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i], _posXm[i], _posYm[i], _posZm[i], false);
        }
    }
}
function bindInSphere(_c, _gl, _fBuffer, _overallData, _inSphereData, _texture, _posX, _posY, _posZ, _posXm, _posYm, _posZm, _getnumber, _sphereCountW, _sphereCountH) {
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
            bindPlatePoly(_gl, m, mMatrix, tmpMatrix, mvpMatrix, _overallData.uniLocation, i, _posX[i], _posY[i], _posZ[i], _posXm[i], _posYm[i], _posZm[i], true);
        }
    }

    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
}
function bindPlatePoly(_gl, _m, _mMatrix, _tmpMatrix, _mvpMatrix, _uniLocation, _number, _posX, _posY, _posZ, _posXm, _posYm, _posZm, _scaleFrag) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBQ0E7QUFDQSxJQUFJLFVBQVEsRUFBWjtBQUNBO0FBQ0EsSUFBSSxnQkFBYyxJQUFsQjs7QUFFQTtBQUNBLElBQUksRUFBSixFQUFPLEVBQVAsRUFBVSxFQUFWLEVBQWEsRUFBYjtBQUNBO0FBQ0EsSUFBSSxTQUFPLENBQVg7QUFDQTtBQUNBLElBQUksRUFBSjtBQUNBO0FBQ0EsSUFBSSxlQUFhLENBQWpCO0FBQ0EsSUFBSSxlQUFhLENBQWpCOztBQUVBO0FBQ0EsSUFBSSxXQUFTLEtBQWI7QUFDQSxJQUFJLFlBQVUsQ0FBZDs7QUFFQSxPQUFPLE1BQVAsR0FBYyxZQUFVO0FBQ3BCLFNBQUcsT0FBTyxVQUFWO0FBQ0EsU0FBRyxPQUFPLFdBQVY7QUFDSCxDQUhEO0FBSUEsT0FBTyxNQUFQLEdBQWMsWUFBVTtBQUNwQixRQUFJLFNBQVEsSUFBWjtBQUNBO0FBQ0EsUUFBSSxJQUFJLFNBQVMsY0FBVCxDQUF3QixRQUF4QixDQUFSO0FBQ0EsU0FBRyxPQUFPLFVBQVY7QUFDQSxTQUFHLE9BQU8sV0FBVjtBQUNBLE1BQUUsS0FBRixHQUFVLEVBQVY7QUFDQSxNQUFFLE1BQUYsR0FBVyxFQUFYOztBQUVBO0FBQ0EsYUFBUyxnQkFBVCxDQUEwQixTQUExQixFQUFzQyxPQUF0QztBQUNBLGFBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBb0MsS0FBcEM7QUFDQTtBQUNBLE1BQUUsZ0JBQUYsQ0FBbUIsV0FBbkIsRUFBK0IsU0FBL0IsRUFBeUMsSUFBekM7QUFDQTtBQUNBLFNBQUssRUFBRSxVQUFGLENBQWEsT0FBYixLQUF5QixFQUFFLFVBQUYsQ0FBYSxvQkFBYixDQUE5Qjs7QUFFQTtBQUNBLFFBQUksaUJBQWUsZUFBZSxFQUFmLEVBQWtCLEtB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QUF4QixFQUFxQyxJQUFyQzs7QUFFQTtBQUNBLFdBQU8sRUFBQyxHQUFJLFdBQUwsRUFBa0IsR0FBSSxpQkFBdEIsRUFBeUMsR0FBSSxRQUE3QyxFQUFQO0FBQ0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8ndXNlIHN0cmljdCc7XHJcbi8vIOODhuOCr+OCueODgeODo+eUqOWkieaVsOOBruWuo+iogFxyXG52YXIgdGV4dHVyZT1bXTtcclxuLy/nkIPkvZPog4zmma/jga7jg4bjgq/jgrnjg4Hjg6NcclxudmFyIHNwaGVyZVRleHR1cmU9bnVsbDtcclxuXHJcbi8v44Oe44Km44K544Gu5L2N572u44CB55S75YOP44Gu5aSn44GN44GV44CB6IOM5pmv44K344Kn44O844OA44O844Gr5rih44GZ44KC44GuXHJcbnZhciBteCxteSxjdyxjaDtcclxuLy/og4zmma/jgpLliIfjgormm7/jgYjjgovjgoLjga5cclxudmFyIHNlbGVjdD0xO1xyXG4vL3dlYmds44Gu44GE44KN44KT44Gq44KC44Gu44GM5YWl44Gj44Gm44KLXHJcbnZhciBnbDtcclxuLy8z55Wq6IOM5pmv44Gu44Go44GN44Gr6IOM5pmv44KS5YuV44GL44GZ44Go44GN44Gr44Gk44GL44GGXHJcbnZhciBzcGhlcmVDb3VudFc9MDtcclxudmFyIHNwaGVyZUNvdW50SD0wO1xyXG5cclxuLy9ibHVy44GZ44KL44GL44GX44Gq44GE44GLXHJcbnZhciBibHVyRnJhZz1mYWxzZTtcclxudmFyIGJsdXJWYWx1ZT0wO1xyXG5cclxud2luZG93LnJlc2l6ZT1mdW5jdGlvbigpe1xyXG4gICAgY3c9d2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjaD13aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbn07XHJcbndpbmRvdy5vbmxvYWQ9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBzb2NrZXQgPWlvKCk7XHJcbiAgICAvLyBjYW52YXPjgqjjg6zjg6Hjg7Pjg4jjgpLlj5blvpdcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xyXG4gICAgY3c9d2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjaD13aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICBjLndpZHRoID0gY3c7XHJcbiAgICBjLmhlaWdodCA9IGNoO1xyXG5cclxuICAgIC8v44Kt44O844GM5oq844GV44KM44Gf44KJXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiICwgS2V5RG93bik7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiAsIEtleXVwKTtcclxuICAgIC8vY2FudmFz5LiK44Gn44Oe44Km44K544GM5YuV44GE44Gf44KJXHJcbiAgICBjLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIixtb3VzZU1vdmUsdHJ1ZSk7XHJcbiAgICAvLyB3ZWJnbOOCs+ODs+ODhuOCreOCueODiOOCkuWPluW+l1xyXG4gICAgZ2wgPSBjLmdldENvbnRleHQoJ3dlYmdsJykgfHwgYy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcclxuXHJcbiAgICAvLyDog4zmma/lgbTjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBiYWNrZ3JvdW5kRGF0YT1pbml0QmFja2dyb3VuZChnbCxcInR2c1wiLFwidGZzXCIpO1xyXG5cclxuICAgIHZhciBpbnRlbnNpdmVEYXRhPWluaXRCYWNrZ3JvdW5kKGdsLFwidHZzXCIsXCJpbnRlbnNpdmVGc1wiKTtcclxuICAgIC8vIOWFqOS9k+OBruODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkOOBqOODquODs+OCr1xyXG4gICAgLy9zcGhlcmVTY2VuZeOBruWIneacn+ioreWumlxyXG4gICAgdmFyIGluU3BoZXJlRGF0YT1pbml0SW5TcGhlcmUoZ2wpO1xyXG5cclxuICAgIC8vem9vbWJsdXLjgpLpgannlKjjgZnjgotcclxuICAgIHZhciB6b29tYmx1ckRhdGE9aW5pdFpvb21CbHVyKGdsLFwiem9vbS52c1wiLFwiem9vbS5mc1wiKTtcclxuXHJcbiAgICAvLyDlhajkvZPnmoTjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBvdmVyYWxsRGF0YT1pbml0T3ZlcmFsbChnbCk7XHJcblxyXG5cclxuICAgIC8vIOWQhOeoruihjOWIl+OBrueUn+aIkOOBqOWIneacn+WMllxyXG4gICAgdmFyIG0gPSBuZXcgbWF0SVYoKTtcclxuICAgIHZhciBtTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHZNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgcE1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB0bXBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIG12cE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICAvLyDjg5Pjg6Xjg7zDl+ODl+ODreOCuOOCp+OCr+OCt+ODp+ODs+W6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgdmFyIGV5ZVBvc2l0aW9uPVswLjAsIDAuMCwgNS4wXTtcclxuICAgIHZhciBjZW50ZXJQb3NpdGlvbj1bMC4wLCAwLjAsIDAuMF07XHJcbiAgICB2YXIgdXBQb3NpdGlvbj1bMC4wLCAxLjAsIDAuMF07XHJcbiAgICBtLmxvb2tBdChleWVQb3NpdGlvbiwgY2VudGVyUG9zaXRpb24sIHVwUG9zaXRpb24sIHZNYXRyaXgpO1xyXG4gICAgbS5wZXJzcGVjdGl2ZSg0NSwgYy53aWR0aCAvIGMuaGVpZ2h0LCAwLjEsIDEwMCwgcE1hdHJpeCk7XHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcbiAgICAvLyDmt7Hluqbjg4bjgrnjg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcclxuICAgIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xyXG4gICAgLy8g5pyJ5Yq544Gr44GZ44KL44OG44Kv44K544OB44Oj44Om44OL44OD44OI44KS5oyH5a6aXHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NYPVtdO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga555bqn5qiZXHJcbiAgICB2YXIgcG9zWT1bXTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueuW6p+aomVxyXG4gICAgdmFyIHBvc1o9W107XHJcblxyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga555bqn5qiZXHJcbiAgICB2YXIgcG9zWG09W107XHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NZbT1bXTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueuW6p+aomVxyXG4gICAgdmFyIHBvc1ptPVtdO1xyXG5cclxuICAgIC8vc29ja2V044Gu44Kk44OZ44Oz44OI44GM5L2V5Zue44GN44Gf44GL44GX44KJ44G544KLXHJcbiAgICB2YXIgZ2V0bnVtYmVyPTA7XHJcblxyXG4gICAgdmFyIGpvRnJhZz1mYWxzZTtcclxuXHJcblxyXG4gICAgLy/jgrXjg7zjg5Djg7zjgYvjgonjg4fjg7zjgr/jgpLlj5fjgZHlj5bjgotcclxuICAgIHNvY2tldC5vbihcInB1c2hJbWFnZUZyb21TZXJ2ZXJcIixmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICBpZihqb0ZyYWcpe1xyXG4gICAgICAgICAgICBjcmVhdGVfdGV4dHVyZShnbCxcIi4uL2ltZy9qb2UuanBnXCIsZ2V0bnVtYmVyKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgY3JlYXRlX3RleHR1cmUoZ2wsZGF0YS5pbWdkYXRhLGdldG51bWJlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiZGF0YS5mcmFnXCIrZGF0YS5mcmFnKTtcclxuICAgICAgICAvL+ecn+OCk+S4reOBruODnOOCv+ODs+OCkuaKvOOBl+OBn+OBi+OBqeOBhuOBi1xyXG4gICAgICAgIGlmKGRhdGEuZnJhZz09dHJ1ZSl7XHJcbiAgICAgICAgICAgIHBvc1htW2dldG51bWJlcl09MDtcclxuICAgICAgICAgICAgcG9zWW1bZ2V0bnVtYmVyXT0wO1xyXG4gICAgICAgICAgICBwb3NabVtnZXRudW1iZXJdPS05NTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcG9zWFtnZXRudW1iZXJdPWRhdGEueCo1LjA7XHJcbiAgICAgICAgICAgIHBvc1lbZ2V0bnVtYmVyXT1kYXRhLnkqNS4wO1xyXG4gICAgICAgICAgICBwb3NaW2dldG51bWJlcl09MDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9zZWxlY3RcclxuICAgICAgICBpZihzZWxlY3Q9PTMpe1xyXG4gICAgICAgICAgICBwb3NYW2dldG51bWJlcl09ZGF0YS54KjUuMDtcclxuICAgICAgICAgICAgcG9zWVtnZXRudW1iZXJdPTUuMDtcclxuICAgICAgICAgICAgcG9zWltnZXRudW1iZXJdPWRhdGEueTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2V0bnVtYmVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0dXJlKTtcclxuICAgICAgICBnZXRudW1iZXIrKztcclxuICAgIH0pO1xyXG4gICAgLy9qb+OBleOCk+ODnOOCv+ODs+OCkuaKvOOBl+OBn+OBi+OBqeOBhuOBi+OCkuODgeOCp+ODg+OCr1xyXG4gICAgc29ja2V0Lm9uKFwicHVzaEpvRnJhZ0Zyb21TZXJ2ZXJcIixmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmpvRnJhZyk7XHJcbiAgICAgICAgaWYoZGF0YS5qb0ZyYWc9PT10cnVlKXtcclxuICAgICAgICAgICAgam9GcmFnPXRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvL+acgOWIneOBq2pv44GV44KT44OV44Op44Kw44KSZmFsc2XjgavjgZnjgovjgojjgYbjgavjg6Hjg4Pjgrvjg7zjgrjjgpLpgIHjgotcclxuICAgIHNvY2tldC5lbWl0KFwicHVzaEpvRnJhZ0Zyb21TY3JlZW5cIix7XHJcbiAgICAgICAgICAgIGpvRnJhZzpmYWxzZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBruWPluW+l1xyXG4gICAgdmFyIGZCdWZmZXJXaWR0aCAgPSBjdztcclxuICAgIHZhciBmQnVmZmVySGVpZ2h0ID0gY2g7XHJcbiAgICB2YXIgZkJ1ZmZlciA9IGNyZWF0ZV9mcmFtZWJ1ZmZlcihnbCxmQnVmZmVyV2lkdGgsIGZCdWZmZXJIZWlnaHQpO1xyXG4gICAgLy8g44Kr44Km44Oz44K/44Gu5a6j6KiAXHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdmFyIGNvdW50Mj0wO1xyXG4gICAgLy/kuIDlv5xcclxuICAgIG14PTAuNTtteT0wLjU7XHJcbiAgICB2YXIgc3RhcnRUaW1lPW5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgIC8v44OW44Os44Oz44OJ44OV44Kh44Oz44Kv44GX44Gm44KL44GeXHJcbiAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xyXG5cclxuICAgIC8vIOaBkuW4uOODq+ODvOODl1xyXG4gICAgKGZ1bmN0aW9uIGxvb3AoKXtcclxuICAgICAgICAvLyDjgqvjgqbjg7Pjgr/jgpLlhYPjgavjg6njgrjjgqLjg7PjgpLnrpflh7pcclxuICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgIGlmIChjb3VudCAlIDEwID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvdW50MisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaHN2PWhzdmEoY291bnQyJTM2MCwxLDEsMSk7XHJcbiAgICAgICAgdmFyIHJhZCA9IChjb3VudCAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLeODleODrOODvOODoOODkOODg+ODleOCoS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4gICAgICAgIC8v5pmC6ZaTXHJcbiAgICAgICAgdmFyIHRpbWU9KG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSowLjAwMTtcclxuICAgICAgICAvKi0t44OV44Os44O844Og44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJLS0qL1xyXG4gICAgICAgIGlmKHNlbGVjdD09MSl7XHJcbiAgICAgICAgICAgIGJpbmRCYWNrZ3JvdW5kKGdsLGZCdWZmZXIsYmFja2dyb3VuZERhdGEsdGltZSxteCxteSxjdyxjaCxoc3YpO1xyXG4gICAgICAgIH1lbHNlIGlmKHNlbGVjdD09Mil7XHJcbiAgICAgICAgICAgIGJpbmRCYWNrZ3JvdW5kKGdsLGZCdWZmZXIsaW50ZW5zaXZlRGF0YSx0aW1lLG14LG15LGN3LGNoLGhzdik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL+WFqOS9k+eahOOBqlxyXG4gICAgICAgIC8vc2hhZGVyQmFja2dyb3VuZOOBruWgtOWQiFxyXG4gICAgICAgIGlmKHNlbGVjdD09MXx8c2VsZWN0PT0yKXtcclxuICAgICAgICAgICAgYmluZE92ZXJhbGwoZ2wsb3ZlcmFsbERhdGEsZkJ1ZmZlcixtLG1NYXRyaXgsdG1wTWF0cml4LG12cE1hdHJpeCxyYWQsdGV4dHVyZSxwb3NYLHBvc1kscG9zWixwb3NYbSxwb3NZbSxwb3NabSxnZXRudW1iZXIpO1xyXG4gICAgICAgIH1lbHNlIGlmKHNlbGVjdD09Myl7XHJcbiAgICAgICAgICAgIGJpbmRJblNwaGVyZShjLGdsLGZCdWZmZXIsb3ZlcmFsbERhdGEsaW5TcGhlcmVEYXRhLHRleHR1cmUscG9zWCxwb3NZLHBvc1oscG9zWG0scG9zWW0scG9zWm0sZ2V0bnVtYmVyLHNwaGVyZUNvdW50VyxzcGhlcmVDb3VudEgpO1xyXG4gICAgICAgICAgICBiaW5kWm9vbWJsdXIoZ2wsem9vbWJsdXJEYXRhLGZCdWZmZXIsY3csY2gsYmx1ckZyYWcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDjgrPjg7Pjg4bjgq3jgrnjg4jjga7lho3mj4/nlLtcclxuICAgICAgICBnbC5mbHVzaCgpO1xyXG4gICAgICAgIC8v44K/44OW44GM6Z2e44Ki44Kv44OG44Kj44OW44Gu5aC05ZCI44GvRlBT44KS6JC944Go44GZXHJcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xyXG4gICAgfSkoKTtcclxuXHJcbn07XHJcbmZ1bmN0aW9uIEtleURvd24oZSl7XHJcbiAgICBpZihlLmtleUNvZGU9PTQ5KXtcclxuICAgICAgICAvLzHjgpLmirzjgZfjgZ/jgolcclxuICAgICAgICBzZWxlY3Q9MTtcclxuICAgIH1lbHNlIGlmKGUua2V5Q29kZT09NTApe1xyXG4gICAgICAgIC8vMuOCkuaKvOOBl+OBn+OCiVxyXG4gICAgICAgIHNlbGVjdD0yO1xyXG4gICAgfWVsc2UgaWYoZS5rZXlDb2RlPT01MSl7XHJcbiAgICAgICAgc2VsZWN0PTM7XHJcbiAgICAgICAgY3JlYXRlU3BoZXJlVGV4dHVyZShnbCxcIi4uL2ltZy90ZXN0LmpwZ1wiKTtcclxuICAgIH1cclxuXHJcbiAgICAvL+WNgeWtl+OCreODvFxyXG4gICAgaWYoZS5rZXlDb2RlPT0zNyl7XHJcbiAgICAgICAgLy/lt6ZcclxuICAgICAgICBibHVyRnJhZz10cnVlO1xyXG4gICAgICAgIHNwaGVyZUNvdW50Vy0tO1xyXG4gICAgfWVsc2UgaWYoZS5rZXlDb2RlPT0zOSl7XHJcbiAgICAgICAgLy/lj7NcclxuICAgICAgICBibHVyRnJhZz10cnVlO1xyXG4gICAgICAgIHNwaGVyZUNvdW50VysrO1xyXG4gICAgfWVsc2UgaWYoZS5rZXlDb2RlPT0zOCl7XHJcbiAgICAgICAgLy/kuIpcclxuICAgICAgICBibHVyRnJhZz10cnVlO1xyXG4gICAgICAgIHNwaGVyZUNvdW50SCsrO1xyXG4gICAgfWVsc2UgaWYoZS5rZXlDb2RlPT00MCl7XHJcbiAgICAgICAgLy/kuItcclxuICAgICAgICBibHVyRnJhZz10cnVlO1xyXG4gICAgICAgIHNwaGVyZUNvdW50SC0tO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgYmx1ckZyYWc9ZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoYmx1ckZyYWcpe1xyXG4gICAgICAgIGJsdXJWYWx1ZSs9MS4wO1xyXG4gICAgfVxyXG4gICAgaWYoYmx1clZhbHVlPj0zMC4wKXtcclxuICAgICAgICBibHVyVmFsdWU9MzAuMDtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gS2V5dXAoZSl7XHJcbiAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgIGJsdXJGcmFnPWZhbHNlO1xyXG59XHJcbmZ1bmN0aW9uIG1vdXNlTW92ZShlKXtcclxuICAgIG14PWUub2Zmc2V0WC9jdztcclxuICAgIG15PWUub2Zmc2V0WS9jaDtcclxufVxyXG5mdW5jdGlvbiBpbml0QmFja2dyb3VuZChfZ2wsX3ZzSWQsX2ZzSWQpe1xyXG4gICAgdmFyIHByZz1jcmVhdGVfcHJvZ3JhbShfZ2wsY3JlYXRlX3NoYWRlcihfZ2wsX3ZzSWQpLGNyZWF0ZV9zaGFkZXIoX2dsLF9mc0lkKSk7XHJcbiAgICB2YXIgdW5pTG9jYXRpb249W107XHJcbiAgICB1bmlMb2NhdGlvblswXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcInRpbWVcIik7XHJcbiAgICB1bmlMb2NhdGlvblsxXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcIm1vdXNlXCIpO1xyXG4gICAgdW5pTG9jYXRpb25bMl09X2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsXCJpUmVzb2x1dGlvblwiKTtcclxuICAgIHVuaUxvY2F0aW9uWzNdPV9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLFwiaHN2XCIpO1xyXG5cclxuICAgIHZhciBQb3NpdGlvbj1bXHJcbiAgICAtMS4wLDEuMCwwLjAsXHJcbiAgICAxLjAsMS4wLDAuMCxcclxuICAgIC0xLjAsLTEuMCwwLjAsXHJcbiAgICAxLjAsLTEuMCwwLjAsXHJcbiAgICBdO1xyXG4gICAgdmFyIEluZGV4PVtcclxuICAgIDAsMiwxLFxyXG4gICAgMSwyLDNcclxuICAgIF07XHJcbiAgICB2YXIgdlBvc2l0aW9uPWNyZWF0ZV92Ym8oX2dsLFBvc2l0aW9uKTtcclxuICAgIHZhciB2SW5kZXg9Y3JlYXRlX2libyhfZ2wsSW5kZXgpO1xyXG4gICAgdmFyIHZBdHRMb2NhdGlvbj1fZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLFwicG9zaXRpb25cIik7XHJcblxyXG4gICAgcmV0dXJue3ByZzpwcmcsdW5pTG9jYXRpb246dW5pTG9jYXRpb24sdlBvc2l0aW9uOnZQb3NpdGlvbix2SW5kZXg6dkluZGV4LGF0dExvY2F0aW9uOnZBdHRMb2NhdGlvbn07XHJcbn1cclxuZnVuY3Rpb24gaW5pdEluU3BoZXJlKF9nbCl7XHJcbiAgICB2YXIgZWFydGhEYXRhICAgICA9IHNwaGVyZSg2NCwgNjQsIDEuMCwgWzEuMCwgMS4wLCAxLjAsIDEuMF0pO1xyXG4gICAgdmFyIGVQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKF9nbCxlYXJ0aERhdGEucCk7XHJcbiAgICB2YXIgZUNvbG9yICAgICAgICA9IGNyZWF0ZV92Ym8oX2dsLGVhcnRoRGF0YS5jKTtcclxuICAgIHZhciBlVGV4dHVyZUNvb3JkID0gY3JlYXRlX3ZibyhfZ2wsZWFydGhEYXRhLnQpO1xyXG4gICAgdmFyIGVWQk9MaXN0ICAgICAgPSBbZVBvc2l0aW9uLGVDb2xvciwgZVRleHR1cmVDb29yZF07XHJcbiAgICB2YXIgZUluZGV4ICAgICAgICA9IGNyZWF0ZV9pYm8oX2dsLGVhcnRoRGF0YS5pKTtcclxuXHJcbiAgICByZXR1cm4ge1ZCT0xpc3Q6ZVZCT0xpc3QsaUluZGV4OmVJbmRleCxpbmRleDplYXJ0aERhdGEuaX1cclxufVxyXG5mdW5jdGlvbiBpbml0Wm9vbUJsdXIoX2dsLF92c0lkLF9mc0lkKXtcclxuICAgIHZhciBwcmcgPSBjcmVhdGVfcHJvZ3JhbShfZ2wsY3JlYXRlX3NoYWRlcihfZ2wsX3ZzSWQpLGNyZWF0ZV9zaGFkZXIoX2dsLF9mc0lkKSk7XHJcbiAgICB2YXIgYXR0TG9jYXRpb24gPSBbXTtcclxuICAgIGF0dExvY2F0aW9uWzBdID0gX2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZywgJ3Bvc2l0aW9uJyk7XHJcbiAgICBhdHRMb2NhdGlvblsxXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXhDb29yZCcpO1xyXG4gICAgdmFyIGF0dFN0cmlkZSA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDI7XHJcbiAgICB2YXIgdW5pTG9jYXRpb24gPSBbXTtcclxuICAgIHVuaUxvY2F0aW9uWzBdID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICdtdnBNYXRyaXgnKTtcclxuICAgIHVuaUxvY2F0aW9uWzFdID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd0ZXh0dXJlJyk7XHJcbiAgICB1bmlMb2NhdGlvblsyXSA9IF9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAnc3RyZW5ndGgnKTtcclxuICAgIHVuaUxvY2F0aW9uWzNdID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd3aWR0aCcpO1xyXG4gICAgdW5pTG9jYXRpb25bNF0gPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ2hlaWdodCcpO1xyXG4gICAgLy8g5p2/44Od44Oq44K044OzXHJcbiAgICB2YXIgcG9zaXRpb24gPSBbLTEuMCwgMS4wLCAwLjAsXHJcbiAgICAxLjAsIDEuMCwgMC4wLCAtIDEuMCwgLSAxLjAsIDAuMCxcclxuICAgIDEuMCwgLSAxLjAsIDAuMF07XHJcbiAgICB2YXIgdGV4Q29vcmQgPSBbXHJcbiAgICAwLjAsIDAuMCxcclxuICAgIDEuMCwgMC4wLFxyXG4gICAgMC4wLCAxLjAsXHJcbiAgICAxLjAsIDEuMF07XHJcbiAgICB2YXIgaW5kZXggPSBbXHJcbiAgICAwLCAyLCAxLFxyXG4gICAgMiwgMywgMV07XHJcbiAgICB2YXIgdlBvc2l0aW9uID0gY3JlYXRlX3ZibyhfZ2wscG9zaXRpb24pO1xyXG4gICAgdmFyIHZUZXhDb29yZCA9IGNyZWF0ZV92Ym8oX2dsLHRleENvb3JkKTtcclxuICAgIHZhciB2VkJPTGlzdCA9IFt2UG9zaXRpb24sIHZUZXhDb29yZF07XHJcbiAgICB2YXIgaUluZGV4ID0gY3JlYXRlX2libyhfZ2wsaW5kZXgpO1xyXG5cclxuICAgIHJldHVybntwcmc6cHJnLCBhdHRMb2NhdGlvbjphdHRMb2NhdGlvbiwgYXR0U3RyaWRlOmF0dFN0cmlkZSx1bmlMb2NhdGlvbjp1bmlMb2NhdGlvbiAsVkJPTGlzdDp2VkJPTGlzdCwgaW5kZXg6aW5kZXgsIGlJbmRleDppSW5kZXh9XHJcbn1cclxuZnVuY3Rpb24gaW5pdE92ZXJhbGwoX2dsLCl7XHJcbiAgICAvLyAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJDjgajjg6rjg7Pjgq9cclxuICAgICB2YXIgcHJnID0gY3JlYXRlX3Byb2dyYW0oX2dsLGNyZWF0ZV9zaGFkZXIoX2dsLCd2cycpLCBjcmVhdGVfc2hhZGVyKF9nbCwnZnMnKSk7XHJcblxyXG4gICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLphY3liJfjgavlj5blvpdcclxuICAgIHZhciBhdHRMb2NhdGlvbiA9IFtdO1xyXG4gICAgYXR0TG9jYXRpb25bMF0gPSBfZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAncG9zaXRpb24nKTtcclxuICAgIGF0dExvY2F0aW9uWzFdID0gX2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZywgJ2NvbG9yJyk7XHJcbiAgICBhdHRMb2NhdGlvblsyXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXh0dXJlQ29vcmQnKTtcclxuICAgIC8vIGF0dHJpYnV0ZeOBruimgee0oOaVsOOCkumFjeWIl+OBq+agvOe0jVxyXG4gICAgdmFyIGF0dFN0cmlkZSA9IFtdO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDQ7XHJcbiAgICBhdHRTdHJpZGVbMl0gPSAyO1xyXG4gICAgLy8g6aCC54K544Gu5L2N572uXHJcbiAgICB2YXIgcG9zaXRpb24gPSBbXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAwLjAsXHJcbiAgICAgICAgIDEuMCwgLTEuMCwgIDAuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueiJslxyXG4gICAgdmFyIGNvbG9yID0gW1xyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOODhuOCr+OCueODgeODo+W6p+aomVxyXG4gICAgdmFyIHRleHR1cmVDb29yZCA9IFtcclxuICAgICAgICAwLjAsIDAuMCxcclxuICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIC8vIOmggueCueOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgdmFyIGluZGV4ID0gW1xyXG4gICAgICAgIDAsIDEsIDIsXHJcbiAgICAgICAgMywgMiwgMVxyXG4gICAgXTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueUn+aIkFxyXG4gICAgdmFyIHZQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKF9nbCxwb3NpdGlvbik7XHJcbiAgICB2YXIgdkNvbG9yICAgICAgICA9IGNyZWF0ZV92Ym8oX2dsLGNvbG9yKTtcclxuICAgIHZhciB2VGV4dHVyZUNvb3JkID0gY3JlYXRlX3ZibyhfZ2wsdGV4dHVyZUNvb3JkKTtcclxuICAgIHZhciBWQk9MaXN0ICAgICAgID0gW3ZQb3NpdGlvbiwgdkNvbG9yLCB2VGV4dHVyZUNvb3JkXTtcclxuICAgIHZhciBpSW5kZXggICAgICAgID0gY3JlYXRlX2libyhfZ2wsaW5kZXgpO1xyXG5cclxuICAgIC8vIHVuaWZvcm1Mb2NhdGlvbuOCkumFjeWIl+OBq+WPluW+l1xyXG4gICAgdmFyIHVuaUxvY2F0aW9uID0gW107XHJcbiAgICB1bmlMb2NhdGlvblswXSAgPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ212cE1hdHJpeCcpO1xyXG4gICAgdW5pTG9jYXRpb25bMV0gID0gX2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsICd0ZXh0dXJlJyk7XHJcblxyXG4gICAgcmV0dXJue3ByZzpwcmcsYXR0TG9jYXRpb246YXR0TG9jYXRpb24sYXR0U3RyaWRlOmF0dFN0cmlkZSxWQk9MaXN0OlZCT0xpc3QsaUluZGV4OmlJbmRleCx1bmlMb2NhdGlvbjp1bmlMb2NhdGlvbn07XHJcbn1cclxuZnVuY3Rpb24gYmluZEJhY2tncm91bmQoX2dsLF9mQnVmZmVyLF9iYWNrZ3JvdW5kRGF0YSxfdGltZSxfbXgsX215LF9jdyxfY2gsX2hzdil7XHJcbiAgICBfZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUixfZkJ1ZmZlci5mKTtcclxuICAgIF9nbC5jbGVhckNvbG9yKDAuMCwwLjAsMC4wLDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIF9nbC51c2VQcm9ncmFtKF9iYWNrZ3JvdW5kRGF0YS5wcmcpO1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS54Sh5Yq544Gr44GZ44KLXHJcbiAgICBfZ2wuZGlzYWJsZShfZ2wuQkxFTkQpO1xyXG4gICAgLy9hdHRyaWJ1dGXjga7nmbvpjLJcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsX2JhY2tncm91bmREYXRhLnZQb3NpdGlvbik7XHJcbiAgICBfZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoX2JhY2tncm91bmREYXRhLnZBdHRMb2NhdGlvbik7XHJcbiAgICBfZ2wudmVydGV4QXR0cmliUG9pbnRlcihfYmFja2dyb3VuZERhdGEudkF0dExvY2F0aW9uLDMsX2dsLkZMT0FULGZhbHNlLDAsMCk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsX2JhY2tncm91bmREYXRhLnZJbmRleCk7XHJcblxyXG4gICAgX2dsLnVuaWZvcm0xZihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMF0sX3RpbWUpO1xyXG4gICAgX2dsLnVuaWZvcm0yZnYoX2JhY2tncm91bmREYXRhLnVuaUxvY2F0aW9uWzFdLFtfbXgsX215XSk7XHJcbiAgICBfZ2wudW5pZm9ybTJmdihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMl0sW19jdyxfY2hdKTtcclxuICAgIF9nbC51bmlmb3JtNGZ2KF9iYWNrZ3JvdW5kRGF0YS51bmlMb2NhdGlvblszXSxbX2hzdlswXSxfaHN2WzFdLF9oc3ZbMl0sX2hzdlszXV0pO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLDYsX2dsLlVOU0lHTkVEX1NIT1JULDApO1xyXG5cclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLG51bGwpO1xyXG5cclxufVxyXG5mdW5jdGlvbiBiaW5kWm9vbWJsdXIoX2dsLF96b29tYmx1ckRhdGEsX2ZCdWZmZXIsX2N3LF9jaCxfYmx1ckZyYWcpe1xyXG4vKumgkeW8teOBo+OBpuabuOOBjeaPm+OBiOOCiyovXHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrumBuOaKnlxyXG4gICAgX2dsLnVzZVByb2dyYW0oX3pvb21ibHVyRGF0YS5wcmcpO1xyXG5cclxuICAgIF9nbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XHJcbiAgICBfZ2wuY2xlYXJEZXB0aCgxLjApO1xyXG4gICAgX2dsLmNsZWFyKF9nbC5DT0xPUl9CVUZGRVJfQklUIHwgX2dsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vIOato+WwhOW9seeUqOOBruW6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgbS5sb29rQXQoWzAuMCwgMC4wLCAwLjVdLCBbMC4wLCAwLjAsIDAuMF0sIFswLjAsIDEuMCwgMC4wXSwgdk1hdHJpeCk7XHJcbiAgICBtLm9ydGhvKC0xLjAsIDEuMCwgMS4wLCAtIDEuMCwgMC4xLCAxLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuICAvLyAgdmFyIHN0cmVuZ3RoXHJcbiAgICBjb25zb2xlLmxvZyhfYmx1ckZyYWcpO1xyXG4gICAgaWYoIV9ibHVyRnJhZyl7XHJcbi8vICAgICAgICBzdHJlbmd0aCA9IDIwO1xyXG4gICAgICAgIGJsdXJWYWx1ZS09MC4wNTtcclxuICAgICAgICBpZihibHVyVmFsdWU8PTApe1xyXG4gICAgICAgICAgICBibHVyVmFsdWU9MDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgIF9nbC5hY3RpdmVUZXh0dXJlKF9nbC5URVhUVVJFMCk7XHJcbiAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBfZkJ1ZmZlci50KTtcclxuICAgICBzZXRfYXR0cmlidXRlKF9nbCxfem9vbWJsdXJEYXRhLlZCT0xpc3QsIF96b29tYmx1ckRhdGEuYXR0TG9jYXRpb24sIF96b29tYmx1ckRhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX3pvb21ibHVyRGF0YS5pSW5kZXgpO1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX3pvb21ibHVyRGF0YS51bmlMb2NhdGlvblswXSwgZmFsc2UsIHRtcE1hdHJpeCk7XHJcbiAgICBfZ2wudW5pZm9ybTFpKF96b29tYmx1ckRhdGEudW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgX2dsLnVuaWZvcm0xZihfem9vbWJsdXJEYXRhLnVuaUxvY2F0aW9uWzJdLCBibHVyVmFsdWUpO1xyXG4gICAgX2dsLnVuaWZvcm0xZihfem9vbWJsdXJEYXRhLnVuaUxvY2F0aW9uWzNdLCBfY3cpO1xyXG4gICAgX2dsLnVuaWZvcm0xZihfem9vbWJsdXJEYXRhLnVuaUxvY2F0aW9uWzRdLCBfY2gpO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLCBfem9vbWJsdXJEYXRhLmluZGV4Lmxlbmd0aCwgX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbn1cclxuZnVuY3Rpb24gYmluZE92ZXJhbGwoX2dsLF9vdmVyYWxsRGF0YSxfZkJ1ZmZlcixfbSxfbU1hdHJpeCxfdG1wTWF0cml4LF9tdnBNYXRyaXgsX3JhZCxfdGV4dHVyZSxfcG9zWCxfcG9zWSxfcG9zWixfcG9zWG0sX3Bvc1ltLF9wb3NabSxfZ2V0bnVtYmVyKXtcclxuICAgIC8vIGNhbnZhc+OCkuWIneacn+WMllxyXG4gICAgX2dsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgIF9nbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCBfZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS3og4zmma/jg4bjgq/jgrnjg4Hjg6Mo44Kq44OV44K544Kv44Oq44O844Oz44Os44Oz44K/44Oq44Oz44KwKS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbiAgICBfZ2wudXNlUHJvZ3JhbShfb3ZlcmFsbERhdGEucHJnKTtcclxuICAgIC8vIOODluODrOODs+ODh+OCo+ODs+OCsOOCkueEoeWKueOBq+OBmeOCi1xyXG4gICAgX2dsLmRpc2FibGUoX2dsLkJMRU5EKTtcclxuICAgIC8vIFZCT+OBqElCT+OBrueZu+mMslxyXG4gICAgc2V0X2F0dHJpYnV0ZShfZ2wsX292ZXJhbGxEYXRhLlZCT0xpc3QsIF9vdmVyYWxsRGF0YS5hdHRMb2NhdGlvbiwgX292ZXJhbGxEYXRhLmF0dFN0cmlkZSk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIF9vdmVyYWxsRGF0YS5pSW5kZXgpO1xyXG4gICAgLyrnp7vli5XjgIHlm57ou6LjgIHmi6HlpKfnuK7lsI8qL1xyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFswLjAsMC4wLC05NS4wXSxfbU1hdHJpeCk7XHJcbiAgICBfbS5zY2FsZShfbU1hdHJpeCxbMTAwLjAsNzAuMCwxLjBdLF9tTWF0cml4KTtcclxuICAgIF9tLm11bHRpcGx5KF90bXBNYXRyaXgsIF9tTWF0cml4LCBfbXZwTWF0cml4KTtcclxuICAgIC8vdW5pZm9ybeOCkueZu+mMslxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELF9mQnVmZmVyLnQpO1xyXG4gICAgX2dsLnVuaWZvcm0xaShfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uWzBdLCBmYWxzZSwgX212cE1hdHJpeCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIDYsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcblxyXG4gICAgLyrjg4bjgq/jgrnjg4Hjg6MqL1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS5pyJ5Yq544Gr44GZ44KLXHJcblxyXG4gICAgX2dsLmVuYWJsZShfZ2wuQkxFTkQpO1xyXG4gICBpZihfdGV4dHVyZSl7XHJcbiAgICAgICBmb3IodmFyIGk9MDtpPF90ZXh0dXJlLmxlbmd0aDtpKyspe1xyXG5cclxuICAgICAgICBfcG9zWltpXS09MC40MDtcclxuICAgICAgICBfcG9zWm1baV0rPTEuMDtcclxuICAgICAgICBpZihfcG9zWltpXTwtMTAwKXtcclxuICAgICAgICAgICAgLy8g44Kr44Oh44Op44KI44KK5YmN44Gr44GZ44GZ44KT44Gg44KJ44CB6YWN5YiX44KS5rib44KJ44GZ5Yem55CG44GM5b6u5aaZXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5YmK6Zmk44GX44Gm44G+44GZXCIpO1xyXG4gICAgICAgICAgICBfdGV4dHVyZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWi5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfZ2V0bnVtYmVyLS07XHJcbiAgICAgICAgfWVsc2UgaWYoX3Bvc1ptW2ldPjEwKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgIF90ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWW0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1ptLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXItLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYmluZFBsYXRlUG9seShfZ2wsX20sX21NYXRyaXgsX3RtcE1hdHJpeCxfbXZwTWF0cml4LF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvbixpLF9wb3NYW2ldLF9wb3NZW2ldLF9wb3NaW2ldLF9wb3NYbVtpXSxfcG9zWW1baV0sX3Bvc1ptW2ldLGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgIH1cclxufVxyXG5mdW5jdGlvbiBiaW5kSW5TcGhlcmUoX2MsX2dsLF9mQnVmZmVyLF9vdmVyYWxsRGF0YSxfaW5TcGhlcmVEYXRhLF90ZXh0dXJlLF9wb3NYLF9wb3NZLF9wb3NaLF9wb3NYbSxfcG9zWW0sX3Bvc1ptLF9nZXRudW1iZXIsX3NwaGVyZUNvdW50Vyxfc3BoZXJlQ291bnRIKXtcclxuICAgIHZhciByYWRXID0gKF9zcGhlcmVDb3VudFcgJSAzNjApICogTWF0aC5QSSAvIDE4MDtcclxuICAgIHZhciByYWRIID0gKF9zcGhlcmVDb3VudEggJSAzNjApICogTWF0aC5QSSAvIDE4MDtcclxuICAgIHZhciBtID0gbmV3IG1hdElWKCk7XHJcbiAgICB2YXIgbU1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB2TWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHBNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdG1wTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBtdnBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgLy8g44OT44Ol44O8w5fjg5fjg63jgrjjgqfjgq/jgrfjg6fjg7PluqfmqJnlpInmj5vooYzliJdcclxuICAgIHZhciBleWVQb3NpdGlvbj1bMC4wLCAwLjAsIDUuMF07XHJcbiAgICB2YXIgY2VudGVyUG9zaXRpb249WzAuMCwgMC4wLCAwLjBdO1xyXG4gICAgdmFyIHVwUG9zaXRpb249WzAuMCwgMS4wLCAwLjBdO1xyXG4gICAgbS5wZXJzcGVjdGl2ZSg0NSwgX2Mud2lkdGggLyBfYy5oZWlnaHQsIDAuMSwgMTAwLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuXHJcblxyXG4gICAgdmFyIHE9bmV3IHF0bklWKCk7XHJcbiAgICB2YXIgY2FtUT1xLmlkZW50aXR5KHEuY3JlYXRlKCkpO1xyXG4gICAgdmFyIGNhbVc9cS5pZGVudGl0eShxLmNyZWF0ZSgpKTtcclxuICAgIHZhciBjYW1IPXEuaWRlbnRpdHkocS5jcmVhdGUoKSk7XHJcblxyXG4gICAgcS5yb3RhdGUocmFkVyxbMCwxLDBdLGNhbVcpO1xyXG4gICAgcS5yb3RhdGUocmFkSCxbMSwwLDBdLGNhbUgpO1xyXG4gICAgcS5tdWx0aXBseShjYW1ILGNhbVcsY2FtUSk7XHJcbiAgICB2YXIgY2FtVXA9W107XHJcbiAgICB2YXIgY2FtZm9yd2FyZD1bXTtcclxuICAgIHEudG9WZWNJSUkodXBQb3NpdGlvbixjYW1RLGNhbVVwKTtcclxuICAgIHEudG9WZWNJSUkoWzAuMCwwLjAsLTEuMF0sY2FtUSxjYW1mb3J3YXJkKTtcclxuXHJcbiAgICB2YXIgZXllQ2FtPVtdO1xyXG4gICAgZXllQ2FtWzBdPWV5ZVBvc2l0aW9uWzBdK2NhbWZvcndhcmRbMF07XHJcbiAgICBleWVDYW1bMV09ZXllUG9zaXRpb25bMV0rY2FtZm9yd2FyZFsxXTtcclxuICAgIGV5ZUNhbVsyXT1leWVQb3NpdGlvblsyXStjYW1mb3J3YXJkWzJdO1xyXG4gICAgbS5sb29rQXQoZXllUG9zaXRpb24sIGV5ZUNhbSwgY2FtVXAsIHZNYXRyaXgpO1xyXG5cclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuXHJcblxyXG5fZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUixfZkJ1ZmZlci5mKTtcclxuICAgIC8vIGNhbnZhc+OCkuWIneacn+WMllxyXG4gICAgX2dsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgIF9nbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCBfZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG5cclxuICAgIF9nbC51c2VQcm9ncmFtKF9vdmVyYWxsRGF0YS5wcmcpO1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS54Sh5Yq544Gr44GZ44KLXHJcbiAgICBfZ2wuZGlzYWJsZShfZ2wuQkxFTkQpO1xyXG4gICAgLy8gVkJP44GoSUJP44Gu55m76YyyXHJcbiAgICBzZXRfYXR0cmlidXRlKF9nbCxfaW5TcGhlcmVEYXRhLlZCT0xpc3QsIF9vdmVyYWxsRGF0YS5hdHRMb2NhdGlvbiwgX292ZXJhbGxEYXRhLmF0dFN0cmlkZSk7XHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIF9pblNwaGVyZURhdGEuaUluZGV4KTtcclxuICAgIC8q56e75YuV44CB5Zue6Lui44CB5ouh5aSn57iu5bCPKi9cclxuXHJcbiAgICBtLmlkZW50aXR5KG1NYXRyaXgpO1xyXG4gICAgbS50cmFuc2xhdGUobU1hdHJpeCxbMC4wLDAuMCw1LjBdLG1NYXRyaXgpO1xyXG4gICAgbS5zY2FsZShtTWF0cml4LFsxMC4wLDEwLjAsMTAuMF0sbU1hdHJpeCk7XHJcbiAgICBtLnJvdGF0ZShtTWF0cml4LCAxODAsIFsxLCAwLCAwXSwgbU1hdHJpeCk7XHJcblxyXG4gICAgbS5tdWx0aXBseSh0bXBNYXRyaXgsIG1NYXRyaXgsIG12cE1hdHJpeCk7XHJcbiAgICAvL3VuaWZvcm3jgpLnmbvpjLJcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCxzcGhlcmVUZXh0dXJlKTtcclxuICAgIF9nbC51bmlmb3JtMWkoX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uWzFdLCAwKTtcclxuICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvblswXSwgZmFsc2UsIG12cE1hdHJpeCk7XHJcblxyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLCBfaW5TcGhlcmVEYXRhLmluZGV4Lmxlbmd0aCwgX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcblxyXG4gICAgLy8gVkJP44GoSUJP44Gu55m76YyyXHJcbiAgICBzZXRfYXR0cmlidXRlKF9nbCxfb3ZlcmFsbERhdGEuVkJPTGlzdCwgX292ZXJhbGxEYXRhLmF0dExvY2F0aW9uLCBfb3ZlcmFsbERhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX292ZXJhbGxEYXRhLmlJbmRleCk7XHJcbiAgICBfZ2wuZW5hYmxlKF9nbC5CTEVORCk7XHJcbiAgIGlmKF90ZXh0dXJlKXtcclxuICAgICAgIGZvcih2YXIgaT0wO2k8X3RleHR1cmUubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgX3Bvc1lbaV0tPTAuMTtcclxuICAgICAgICAvLyBfcG9zWltpXS09MC40MDtcclxuICAgICAgICBfcG9zWm1baV0rPTEuMDtcclxuICAgICAgICBpZihfcG9zWltpXTwtMTAwKXtcclxuICAgICAgICAgICAgLy8g44Kr44Oh44Op44KI44KK5YmN44Gr44GZ44GZ44KT44Gg44KJ44CB6YWN5YiX44KS5rib44KJ44GZ5Yem55CG44GM5b6u5aaZXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5YmK6Zmk44GX44Gm44G+44GZXCIpO1xyXG4gICAgICAgICAgICBfdGV4dHVyZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWi5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfZ2V0bnVtYmVyLS07XHJcbiAgICAgICAgfWVsc2UgaWYoX3Bvc1ptW2ldPjEwKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgIF90ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWW0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1ptLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXItLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYmluZFBsYXRlUG9seShfZ2wsbSxtTWF0cml4LHRtcE1hdHJpeCxtdnBNYXRyaXgsX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uLGksX3Bvc1hbaV0sX3Bvc1lbaV0sX3Bvc1pbaV0sX3Bvc1htW2ldLF9wb3NZbVtpXSxfcG9zWm1baV0sdHJ1ZSk7XHJcbiAgICAgICB9XHJcbiAgIH1cclxuXHJcbl9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLG51bGwpO1xyXG5cclxufVxyXG5mdW5jdGlvbiBiaW5kUGxhdGVQb2x5KF9nbCxfbSxfbU1hdHJpeCxfdG1wTWF0cml4LF9tdnBNYXRyaXgsX3VuaUxvY2F0aW9uLF9udW1iZXIsX3Bvc1gsX3Bvc1ksX3Bvc1osX3Bvc1htLF9wb3NZbSxfcG9zWm0sX3NjYWxlRnJhZyl7XHJcbiAgICAvLyDjg6Ljg4fjg6vluqfmqJnlpInmj5vooYzliJfjga7nlJ/miJBcclxuICAgIF9tLmlkZW50aXR5KF9tTWF0cml4KTtcclxuICAgIF9tLnRyYW5zbGF0ZShfbU1hdHJpeCxbX3Bvc1gsX3Bvc1ksX3Bvc1pdLF9tTWF0cml4KTtcclxuICAgIGlmKF9zY2FsZUZyYWcpe1xyXG4gICAgICAgIF9tLnNjYWxlKF9tTWF0cml4LFswLjUsMC41LDAuNV0sX21NYXRyaXgpO1xyXG4gICAgfVxyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZVtfbnVtYmVyXSk7XHJcbiAgICBcclxuICAgIC8vIHVuaWZvcm3lpInmlbDjgavjg4bjgq/jgrnjg4Hjg6PjgpLnmbvpjLJcclxuICAgX2dsLnVuaWZvcm0xaShfdW5pTG9jYXRpb25bMV0sIDApO1xyXG5cclxuICAgIC8vIHVuaWZvcm3lpInmlbDjga7nmbvpjLLjgajmj4/nlLtcclxuICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KF91bmlMb2NhdGlvblswXSwgZmFsc2UsIF9tdnBNYXRyaXgpO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLCA2LCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxuICAgIF9tLmlkZW50aXR5KF9tTWF0cml4KTtcclxuICAgIF9tLnRyYW5zbGF0ZShfbU1hdHJpeCxbX3Bvc1htLF9wb3NZbSxfcG9zWm1dLF9tTWF0cml4KTtcclxuICAgIGlmKF9zY2FsZUZyYWcpe1xyXG4gICAgICAgIF9tLnNjYWxlKF9tTWF0cml4LFswLjUsMC41LDAuNV0sX21NYXRyaXgpO1xyXG4gICAgfVxyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZVtfbnVtYmVyXSk7XHJcbiAgICBcclxuICAgIC8vIHVuaWZvcm3lpInmlbDjgavjg4bjgq/jgrnjg4Hjg6PjgpLnmbvpjLJcclxuICAgX2dsLnVuaWZvcm0xaShfdW5pTG9jYXRpb25bMV0sIDApO1xyXG5cclxuICAgIC8vIHVuaWZvcm3lpInmlbDjga7nmbvpjLLjgajmj4/nlLtcclxuICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KF91bmlMb2NhdGlvblswXSwgZmFsc2UsIF9tdnBNYXRyaXgpO1xyXG4gICAgX2dsLmRyYXdFbGVtZW50cyhfZ2wuVFJJQU5HTEVTLCA2LCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG4gICAgXHJcbn1cclxuXHJcbi8vIOOCt+OCp+ODvOODgOOCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfc2hhZGVyKF9nbCxfaWQpe1xyXG4gICAgLy8g44K344Kn44O844OA44KS5qC857SN44GZ44KL5aSJ5pWwXHJcbiAgICB2YXIgc2hhZGVyO1xyXG4gICAgXHJcbiAgICAvLyBIVE1M44GL44KJc2NyaXB044K/44Kw44G444Gu5Y+C54Wn44KS5Y+W5b6XXHJcbiAgICB2YXIgc2NyaXB0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKF9pZCk7XHJcbiAgICBcclxuICAgIC8vIHNjcmlwdOOCv+OCsOOBjOWtmOWcqOOBl+OBquOBhOWgtOWQiOOBr+aKnOOBkeOCi1xyXG4gICAgaWYoIXNjcmlwdEVsZW1lbnQpe3JldHVybjt9XHJcbiAgICBcclxuICAgIC8vIHNjcmlwdOOCv+OCsOOBrnR5cGXlsZ7mgKfjgpLjg4Hjgqfjg4Pjgq9cclxuICAgIHN3aXRjaChzY3JpcHRFbGVtZW50LnR5cGUpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOmggueCueOCt+OCp+ODvOODgOOBruWgtOWQiFxyXG4gICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtdmVydGV4JzpcclxuICAgICAgICAgICAgc2hhZGVyID0gX2dsLmNyZWF0ZVNoYWRlcihfZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyDjg5Xjg6njgrDjg6Hjg7Pjg4jjgrfjgqfjg7zjg4Djga7loLTlkIhcclxuICAgICAgICBjYXNlICd4LXNoYWRlci94LWZyYWdtZW50JzpcclxuICAgICAgICAgICAgc2hhZGVyID0gX2dsLmNyZWF0ZVNoYWRlcihfZ2wuRlJBR01FTlRfU0hBREVSKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GV44KM44Gf44K344Kn44O844OA44Gr44K944O844K544KS5Ymy44KK5b2T44Gm44KLXHJcbiAgICBfZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc2NyaXB0RWxlbWVudC50ZXh0KTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44KS44Kz44Oz44OR44Kk44Or44GZ44KLXHJcbiAgICBfZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgYzmraPjgZfjgY/jgrPjg7Pjg5HjgqTjg6vjgZXjgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgIGlmKF9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBfZ2wuQ09NUElMRV9TVEFUVVMpKXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjgrfjgqfjg7zjg4DjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gc2hhZGVyO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5aSx5pWX44GX44Gm44GE44Gf44KJ44Ko44Op44O844Ot44Kw44KS44Ki44Op44O844OI44GZ44KLXHJcbiAgICAgICAgYWxlcnQoX2dsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSk7XHJcbiAgICB9XHJcbn1cclxuLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GX44K344Kn44O844OA44KS44Oq44Oz44Kv44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9wcm9ncmFtKF9nbCxfdnMsIF9mcyl7XHJcbiAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBwcm9ncmFtID0gX2dsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgIFxyXG4gICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gr44K344Kn44O844OA44KS5Ymy44KK5b2T44Gm44KLXHJcbiAgICBfZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIF92cyk7XHJcbiAgICBfZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIF9mcyk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOCkuODquODs+OCr1xyXG4gICAgX2dsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4Djga7jg6rjg7Pjgq/jgYzmraPjgZfjgY/ooYzjgarjgo/jgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgIGlmKF9nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIF9nbC5MSU5LX1NUQVRVUykpe1xyXG4gICAgXHJcbiAgICAgICAgLy8g5oiQ5Yqf44GX44Gm44GE44Gf44KJ44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICAgICAgX2dsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW07XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDlpLHmlZfjgZfjgabjgYTjgZ/jgonjgqjjg6njg7zjg63jgrDjgpLjgqLjg6njg7zjg4jjgZnjgotcclxuICAgICAgICBhbGVydChfZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkpO1xyXG4gICAgfVxyXG59XHJcbi8vIFZCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfdmJvKF9nbCxfZGF0YSl7XHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciB2Ym8gPSBfZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkFSUkFZX0JVRkZFUiwgdmJvKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gr44OH44O844K/44KS44K744OD44OIXHJcbiAgICBfZ2wuYnVmZmVyRGF0YShfZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KF9kYXRhKSwgX2dsLlNUQVRJQ19EUkFXKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GX44GfIFZCTyDjgpLov5TjgZfjgabntYLkuoZcclxuICAgIHJldHVybiB2Ym87XHJcbn1cclxuLy8gVkJP44KS44OQ44Kk44Oz44OJ44GX55m76Yyy44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGUoX2dsLF92Ym8sIF9hdHRMLCBfYXR0Uyl7XHJcbiAgICAvLyDlvJXmlbDjgajjgZfjgablj5fjgZHlj5bjgaPjgZ/phY3liJfjgpLlh6bnkIbjgZnjgotcclxuICAgIGZvcih2YXIgaSBpbiBfdmJvKXtcclxuICAgICAgICAvLyDjg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCBfdmJvW2ldKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgICAgIF9nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShfYXR0TFtpXSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLpgJrnn6XjgZfnmbvpjLLjgZnjgotcclxuICAgICAgICBfZ2wudmVydGV4QXR0cmliUG9pbnRlcihfYXR0TFtpXSwgX2F0dFNbaV0sIF9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgfVxyXG59XHJcbi8vIElCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfaWJvKF9nbCxfZGF0YSl7XHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBpYm8gPSBfZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpYm8pO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgavjg4fjg7zjgr/jgpLjgrvjg4Pjg4hcclxuICAgIF9nbC5idWZmZXJEYXRhKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IEludDE2QXJyYXkoX2RhdGEpLCBfZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOeUn+aIkOOBl+OBn0lCT+OCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIGlibztcclxufVxyXG5cclxuLy8g44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV90ZXh0dXJlKF9nbCxfc291cmNlLF9uKXtcclxuICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4fjg7zjgr/jga7jgqrjg7Pjg63jg7zjg4njgpLjg4jjg6rjgqzjg7zjgavjgZnjgotcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciB0ZXggPSBfZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgbjjgqTjg6Hjg7zjgrjjgpLpgannlKhcclxuICAgICAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgaW1nKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NQUdfRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01JTl9GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9TLF9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1QsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG5cclxuICAgICAgICAvLyDjg5/jg4Pjg5fjg57jg4Pjg5fjgpLnlJ/miJBcclxuICAgICAgICBfZ2wuZ2VuZXJhdGVNaXBtYXAoX2dsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g55Sf5oiQ44GX44Gf44OG44Kv44K544OB44Oj44KS44Kw44Ot44O844OQ44Or5aSJ5pWw44Gr5Luj5YWlXHJcbiAgICAgICAgICAgIHRleHR1cmVbX25dID0gdGV4O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu44K944O844K544KS5oyH5a6aXHJcbiAgICBpbWcuc3JjID0gX3NvdXJjZTtcclxufVxyXG4vLyDjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlU3BoZXJlVGV4dHVyZShfZ2wsX3NvdXJjZSl7XHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgIFxyXG4gICAgLy8g44OH44O844K/44Gu44Kq44Oz44Ot44O844OJ44KS44OI44Oq44Ks44O844Gr44GZ44KLXHJcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgICAgICB2YXIgdGV4ID0gX2dsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIHRleCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44G444Kk44Oh44O844K444KS6YGp55SoXHJcbiAgICAgICAgX2dsLnRleEltYWdlMkQoX2dsLlRFWFRVUkVfMkQsIDAsIF9nbC5SR0JBLCBfZ2wuUkdCQSwgX2dsLlVOU0lHTkVEX0JZVEUsIGltZyk7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUixfZ2wuTElORUFSKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NSU5fRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX1dSQVBfUyxfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9ULF9nbC5DTEFNUF9UT19FREdFKTtcclxuXHJcbiAgICAgICAgLy8g44Of44OD44OX44Oe44OD44OX44KS55Sf5oiQXHJcbiAgICAgICAgX2dsLmdlbmVyYXRlTWlwbWFwKF9nbC5URVhUVVJFXzJEKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgICAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOeUn+aIkOOBl+OBn+ODhuOCr+OCueODgeODo+OCkuOCsOODreODvOODkOODq+WkieaVsOOBq+S7o+WFpVxyXG4gICAgICAgICAgICBzcGhlcmVUZXh0dXJlID0gdGV4O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu44K944O844K544KS5oyH5a6aXHJcbiAgICBpbWcuc3JjID0gX3NvdXJjZTtcclxufVxyXG4vLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLjgqrjg5bjgrjjgqfjgq/jg4jjgajjgZfjgabnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX2ZyYW1lYnVmZmVyKF9nbCxfd2lkdGgsIF9oZWlnaHQpe1xyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44Gu55Sf5oiQXHJcbiAgICB2YXIgZnJhbWVCdWZmZXIgPSBfZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44KSV2ViR0zjgavjg5DjgqTjg7Pjg4lcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBmcmFtZUJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOa3seW6puODkOODg+ODleOCoeeUqOODrOODs+ODgOODvOODkOODg+ODleOCoeOBrueUn+aIkOOBqOODkOOCpOODs+ODiVxyXG4gICAgdmFyIGRlcHRoUmVuZGVyQnVmZmVyID0gX2dsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgX2dsLmJpbmRSZW5kZXJidWZmZXIoX2dsLlJFTkRFUkJVRkZFUiwgZGVwdGhSZW5kZXJCdWZmZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqHjgpLmt7Hluqbjg5Djg4Pjg5XjgqHjgajjgZfjgaboqK3lrppcclxuICAgIF9nbC5yZW5kZXJidWZmZXJTdG9yYWdlKF9nbC5SRU5ERVJCVUZGRVIsIF9nbC5ERVBUSF9DT01QT05FTlQxNiwgX3dpZHRoLCBfaGVpZ2h0KTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh44Gr44Os44Oz44OA44O844OQ44OD44OV44Kh44KS6Zai6YCj5LuY44GR44KLXHJcbiAgICBfZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBfZ2wuREVQVEhfQVRUQUNITUVOVCwgX2dsLlJFTkRFUkJVRkZFUiwgZGVwdGhSZW5kZXJCdWZmZXIpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHnlKjjg4bjgq/jgrnjg4Hjg6Pjga7nlJ/miJBcclxuICAgIHZhciBmVGV4dHVyZSA9IF9nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOOBruODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODiVxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBmVGV4dHVyZSk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOOBruODhuOCr+OCueODgeODo+OBq+OCq+ODqeODvOeUqOOBruODoeODouODqumgmOWfn+OCkueiuuS/nVxyXG4gICAgX2dsLnRleEltYWdlMkQoX2dsLlRFWFRVUkVfMkQsIDAsIF9nbC5SR0JBLCBfd2lkdGgsIF9oZWlnaHQsIDAsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+ODkeODqeODoeODvOOCv1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX01BR19GSUxURVIsIF9nbC5MSU5FQVIpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX01JTl9GSUxURVIsIF9nbC5MSU5FQVIpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX1dSQVBfUywgX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsIF9nbC5URVhUVVJFX1dSQVBfVCwgX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgavjg4bjgq/jgrnjg4Hjg6PjgpLplqLpgKPku5jjgZHjgotcclxuICAgIF9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChfZ2wuRlJBTUVCVUZGRVIsIF9nbC5DT0xPUl9BVFRBQ0hNRU5UMCwgX2dsLlRFWFRVUkVfMkQsIGZUZXh0dXJlLCAwKTtcclxuICAgIFxyXG4gICAgLy8g5ZCE56iu44Kq44OW44K444Kn44Kv44OI44Gu44OQ44Kk44Oz44OJ44KS6Kej6ZmkXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgX2dsLmJpbmRSZW5kZXJidWZmZXIoX2dsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XHJcbiAgICBfZ2wuYmluZEZyYW1lYnVmZmVyKF9nbC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbiAgICBcclxuICAgIC8vIOOCquODluOCuOOCp+OCr+ODiOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIHtmIDogZnJhbWVCdWZmZXIsIGQgOiBkZXB0aFJlbmRlckJ1ZmZlciwgdCA6IGZUZXh0dXJlfTtcclxufVxyXG4iXX0=
