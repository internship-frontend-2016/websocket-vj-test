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
            //bindInSphere(c,gl,fBuffer,overallData,inSphereData,fBuffer,texture,posX,posY,posZ,posXm,posYm,posZm,getnumber,sphereCountW,sphereCountH);
            bindInSphere(c, gl, fBuffer, overallData, inSphereData, texture, posX, posY, posZ, posXm, posYm, posZm, getnumber, sphereCountW, sphereCountH);
            //            bindInSphere(c,gl,fBuffer,overallData,centerPosition,upPosition,inSphereData,fBuffer,m,mMatrix,pMatrix,tmpMatrix,mvpMatrix,rad,texture,posX,posY,posZ,posXm,posYm,posZm,getnumber,sphereCountW,sphereCountH);
            bindZoomblur(gl, zoomblurData, fBuffer);
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
function bindZoomblur(_gl, _zoomblurData, _fBuffer) {
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

    var strength = 10;
    _gl.activeTexture(_gl.TEXTURE0);
    _gl.bindTexture(_gl.TEXTURE_2D, _fBuffer.t);
    set_attribute(_gl, _zoomblurData.VBOList, _zoomblurData.attLocation, _zoomblurData.attStride);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _zoomblurData.iIndex);
    _gl.uniformMatrix4fv(_zoomblurData.uniLocation[0], false, tmpMatrix);
    _gl.uniform1i(_zoomblurData.uniLocation[1], 0);
    _gl.uniform1f(_zoomblurData.uniLocation[2], strength);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1zY3JlZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBQ0E7QUFDQSxJQUFJLFVBQVEsRUFBWjtBQUNBO0FBQ0EsSUFBSSxnQkFBYyxJQUFsQjs7QUFFQTtBQUNBLElBQUksRUFBSixFQUFPLEVBQVAsRUFBVSxFQUFWLEVBQWEsRUFBYjtBQUNBO0FBQ0EsSUFBSSxTQUFPLENBQVg7QUFDQTtBQUNBLElBQUksRUFBSjtBQUNBO0FBQ0EsSUFBSSxlQUFhLENBQWpCO0FBQ0EsSUFBSSxlQUFhLENBQWpCO0FBQ0EsT0FBTyxNQUFQLEdBQWMsWUFBVTtBQUNwQixTQUFHLE9BQU8sVUFBVjtBQUNBLFNBQUcsT0FBTyxXQUFWO0FBQ0gsQ0FIRDtBQUlBLE9BQU8sTUFBUCxHQUFjLFlBQVU7QUFDcEIsUUFBSSxTQUFRLElBQVo7QUFDQTtBQUNBLFFBQUksSUFBSSxTQUFTLGNBQVQsQ0FBd0IsUUFBeEIsQ0FBUjtBQUNBLFNBQUcsT0FBTyxVQUFWO0FBQ0EsU0FBRyxPQUFPLFdBQVY7QUFDQSxNQUFFLEtBQUYsR0FBVSxFQUFWO0FBQ0EsTUFBRSxNQUFGLEdBQVcsRUFBWDs7QUFFQTtBQUNBLGFBQVMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBc0MsT0FBdEM7QUFDQTtBQUNBLE1BQUUsZ0JBQUYsQ0FBbUIsV0FBbkIsRUFBK0IsU0FBL0IsRUFBeUMsSUFBekM7QUFDQTtBQUNBLFNBQUssRUFBRSxVQUFGLENBQWEsT0FBYixLQUF5QixFQUFFLFVBQUYsQ0FBYSxvQkFBYixDQUE5Qjs7QUFFQTtBQUNBLFFBQUksaUJBQWUsZUFBZSxFQUFmLEVBQWtCLEtBQWxCLEVBQXdCLEtBQXhCLENBQW5COztBQUVBLFFBQUksZ0JBQWMsZUFBZSxFQUFmLEVBQWtCLEtBQWxCLEVBQXdCLGFBQXhCLENBQWxCO0FBQ0E7QUFD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QWpGLEVBQTJGLENBQTNGOztBQUVBO0FBQ0EsUUFBSSxXQUFKLENBQWdCLElBQUksVUFBcEIsRUFBZ0MsSUFBaEM7QUFDQSxRQUFJLGdCQUFKLENBQXFCLElBQUksWUFBekIsRUFBdUMsSUFBdkM7QUFDQSxRQUFJLGVBQUosQ0FBb0IsSUFBSSxXQUF4QixFQUFxQyxJQUFyQzs7QUFFQTtBQUNBLFdBQU8sRUFBQyxHQUFJLFdBQUwsRUFBa0IsR0FBSSxpQkFBdEIsRUFBeUMsR0FBSSxRQUE3QyxFQUFQO0FBQ0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8ndXNlIHN0cmljdCc7XHJcbi8vIOODhuOCr+OCueODgeODo+eUqOWkieaVsOOBruWuo+iogFxyXG52YXIgdGV4dHVyZT1bXTtcclxuLy/nkIPkvZPog4zmma/jga7jg4bjgq/jgrnjg4Hjg6NcclxudmFyIHNwaGVyZVRleHR1cmU9bnVsbDtcclxuXHJcbi8v44Oe44Km44K544Gu5L2N572u44CB55S75YOP44Gu5aSn44GN44GV44CB6IOM5pmv44K344Kn44O844OA44O844Gr5rih44GZ44KC44GuXHJcbnZhciBteCxteSxjdyxjaDtcclxuLy/og4zmma/jgpLliIfjgormm7/jgYjjgovjgoLjga5cclxudmFyIHNlbGVjdD0xO1xyXG4vL3dlYmds44Gu44GE44KN44KT44Gq44KC44Gu44GM5YWl44Gj44Gm44KLXHJcbnZhciBnbDtcclxuLy8z55Wq6IOM5pmv44Gu44Go44GN44Gr6IOM5pmv44KS5YuV44GL44GZ44Go44GN44Gr44Gk44GL44GGXHJcbnZhciBzcGhlcmVDb3VudFc9MDtcclxudmFyIHNwaGVyZUNvdW50SD0wO1xyXG53aW5kb3cucmVzaXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxufTtcclxud2luZG93Lm9ubG9hZD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHNvY2tldCA9aW8oKTtcclxuICAgIC8vIGNhbnZhc+OCqOODrOODoeODs+ODiOOCkuWPluW+l1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XHJcbiAgICBjdz13aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNoPXdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIGMud2lkdGggPSBjdztcclxuICAgIGMuaGVpZ2h0ID0gY2g7XHJcblxyXG4gICAgLy/jgq3jg7zjgYzmirzjgZXjgozjgZ/jgolcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIgLCBLZXlEb3duKTtcclxuICAgIC8vY2FudmFz5LiK44Gn44Oe44Km44K544GM5YuV44GE44Gf44KJXHJcbiAgICBjLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIixtb3VzZU1vdmUsdHJ1ZSk7XHJcbiAgICAvLyB3ZWJnbOOCs+ODs+ODhuOCreOCueODiOOCkuWPluW+l1xyXG4gICAgZ2wgPSBjLmdldENvbnRleHQoJ3dlYmdsJykgfHwgYy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcclxuXHJcbiAgICAvLyDog4zmma/lgbTjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBiYWNrZ3JvdW5kRGF0YT1pbml0QmFja2dyb3VuZChnbCxcInR2c1wiLFwidGZzXCIpO1xyXG5cclxuICAgIHZhciBpbnRlbnNpdmVEYXRhPWluaXRCYWNrZ3JvdW5kKGdsLFwidHZzXCIsXCJpbnRlbnNpdmVGc1wiKTtcclxuICAgIC8vIOWFqOS9k+OBruODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkOOBqOODquODs+OCr1xyXG4gICAgLy9zcGhlcmVTY2VuZeOBruWIneacn+ioreWumlxyXG4gICAgdmFyIGluU3BoZXJlRGF0YT1pbml0SW5TcGhlcmUoZ2wpO1xyXG5cclxuICAgIC8vem9vbWJsdXLjgpLpgannlKjjgZnjgotcclxuICAgIHZhciB6b29tYmx1ckRhdGE9aW5pdFpvb21CbHVyKGdsLFwiem9vbS52c1wiLFwiem9vbS5mc1wiKTtcclxuXHJcbiAgICAvLyDlhajkvZPnmoTjga7liJ3mnJ/oqK3lrppcclxuICAgIHZhciBvdmVyYWxsRGF0YT1pbml0T3ZlcmFsbChnbCk7XHJcblxyXG5cclxuICAgIC8vIOWQhOeoruihjOWIl+OBrueUn+aIkOOBqOWIneacn+WMllxyXG4gICAgdmFyIG0gPSBuZXcgbWF0SVYoKTtcclxuICAgIHZhciBtTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHZNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgcE1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB0bXBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIG12cE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICAvLyDjg5Pjg6Xjg7zDl+ODl+ODreOCuOOCp+OCr+OCt+ODp+ODs+W6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgdmFyIGV5ZVBvc2l0aW9uPVswLjAsIDAuMCwgNS4wXTtcclxuICAgIHZhciBjZW50ZXJQb3NpdGlvbj1bMC4wLCAwLjAsIDAuMF07XHJcbiAgICB2YXIgdXBQb3NpdGlvbj1bMC4wLCAxLjAsIDAuMF07XHJcbiAgICBtLmxvb2tBdChleWVQb3NpdGlvbiwgY2VudGVyUG9zaXRpb24sIHVwUG9zaXRpb24sIHZNYXRyaXgpO1xyXG4gICAgbS5wZXJzcGVjdGl2ZSg0NSwgYy53aWR0aCAvIGMuaGVpZ2h0LCAwLjEsIDEwMCwgcE1hdHJpeCk7XHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcbiAgICAvLyDmt7Hluqbjg4bjgrnjg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcclxuICAgIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xyXG4gICAgLy8g5pyJ5Yq544Gr44GZ44KL44OG44Kv44K544OB44Oj44Om44OL44OD44OI44KS5oyH5a6aXHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NYPVtdO1xyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga555bqn5qiZXHJcbiAgICB2YXIgcG9zWT1bXTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueuW6p+aomVxyXG4gICAgdmFyIHBvc1o9W107XHJcblxyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga555bqn5qiZXHJcbiAgICB2YXIgcG9zWG09W107XHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBrnnluqfmqJlcclxuICAgIHZhciBwb3NZbT1bXTtcclxuICAgIC8v44OG44Kv44K544OB44Oj44GueuW6p+aomVxyXG4gICAgdmFyIHBvc1ptPVtdO1xyXG5cclxuXHJcblxyXG4gICAgLy9zb2NrZXTjga7jgqTjg5njg7Pjg4jjgYzkvZXlm57jgY3jgZ/jgYvjgZfjgonjgbnjgotcclxuICAgIHZhciBnZXRudW1iZXI9MDtcclxuXHJcbiAgICB2YXIgam9GcmFnPWZhbHNlO1xyXG5cclxuXHJcbiAgICAvL+OCteODvOODkOODvOOBi+OCieODh+ODvOOCv+OCkuWPl+OBkeWPluOCi1xyXG4gICAgc29ja2V0Lm9uKFwicHVzaEltYWdlRnJvbVNlcnZlclwiLGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgIGlmKGpvRnJhZyl7XHJcbiAgICAgICAgICAgIGNyZWF0ZV90ZXh0dXJlKGdsLFwiLi4vaW1nL2pvZS5qcGdcIixnZXRudW1iZXIpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBjcmVhdGVfdGV4dHVyZShnbCxkYXRhLmltZ2RhdGEsZ2V0bnVtYmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJkYXRhLmZyYWdcIitkYXRhLmZyYWcpO1xyXG4gICAgICAgIC8v55yf44KT5Lit44Gu44Oc44K/44Oz44KS5oq844GX44Gf44GL44Gp44GG44GLXHJcbiAgICAgICAgaWYoZGF0YS5mcmFnPT10cnVlKXtcclxuICAgICAgICAgICAgcG9zWG1bZ2V0bnVtYmVyXT0wO1xyXG4gICAgICAgICAgICBwb3NZbVtnZXRudW1iZXJdPTA7XHJcbiAgICAgICAgICAgIHBvc1ptW2dldG51bWJlcl09LTk1O1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBwb3NYW2dldG51bWJlcl09ZGF0YS54KjUuMDtcclxuICAgICAgICAgICAgcG9zWVtnZXRudW1iZXJdPWRhdGEueSo1LjA7XHJcbiAgICAgICAgICAgIHBvc1pbZ2V0bnVtYmVyXT0wO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vc2VsZWN0XHJcbiAgICAgICAgaWYoc2VsZWN0PT0zKXtcclxuICAgICAgICAgICAgcG9zWFtnZXRudW1iZXJdPWRhdGEueCo1LjA7XHJcbiAgICAgICAgICAgIHBvc1lbZ2V0bnVtYmVyXT01LjA7XHJcbiAgICAgICAgICAgIHBvc1pbZ2V0bnVtYmVyXT1kYXRhLnk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGdldG51bWJlcik7XHJcbiAgICAgICAgY29uc29sZS5sb2codGV4dHVyZSk7XHJcbiAgICAgICAgZ2V0bnVtYmVyKys7XHJcbiAgICB9KTtcclxuICAgIC8vam/jgZXjgpPjg5zjgr/jg7PjgpLmirzjgZfjgZ/jgYvjganjgYbjgYvjgpLjg4Hjgqfjg4Pjgq9cclxuICAgIHNvY2tldC5vbihcInB1c2hKb0ZyYWdGcm9tU2VydmVyXCIsZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZGF0YS5qb0ZyYWcpO1xyXG4gICAgICAgIGlmKGRhdGEuam9GcmFnPT09dHJ1ZSl7XHJcbiAgICAgICAgICAgIGpvRnJhZz10cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy/mnIDliJ3jgatqb+OBleOCk+ODleODqeOCsOOCkmZhbHNl44Gr44GZ44KL44KI44GG44Gr44Oh44OD44K744O844K444KS6YCB44KLXHJcbiAgICBzb2NrZXQuZW1pdChcInB1c2hKb0ZyYWdGcm9tU2NyZWVuXCIse1xyXG4gICAgICAgICAgICBqb0ZyYWc6ZmFsc2VcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7lj5blvpdcclxuICAgIHZhciBmQnVmZmVyV2lkdGggID0gY3c7XHJcbiAgICB2YXIgZkJ1ZmZlckhlaWdodCA9IGNoO1xyXG4gICAgdmFyIGZCdWZmZXIgPSBjcmVhdGVfZnJhbWVidWZmZXIoZ2wsZkJ1ZmZlcldpZHRoLCBmQnVmZmVySGVpZ2h0KTtcclxuICAgIC8vIOOCq+OCpuODs+OCv+OBruWuo+iogFxyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHZhciBjb3VudDI9MDtcclxuICAgIC8v5LiA5b+cXHJcbiAgICBteD0wLjU7bXk9MC41O1xyXG4gICAgdmFyIHN0YXJ0VGltZT1uZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAvL+ODluODrOODs+ODieODleOCoeODs+OCr+OBl+OBpuOCi+OBnlxyXG4gICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSxnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcclxuXHJcbiAgICAvLyDmgZLluLjjg6vjg7zjg5dcclxuICAgIChmdW5jdGlvbiBsb29wKCl7XHJcbiAgICAgICAgLy8g44Kr44Km44Oz44K/44KS5YWD44Gr44Op44K444Ki44Oz44KS566X5Ye6XHJcbiAgICAgICAgY291bnQrKztcclxuICAgICAgICBpZiAoY291bnQgJSAxMCA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb3VudDIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGhzdj1oc3ZhKGNvdW50MiUzNjAsMSwxLDEpO1xyXG4gICAgICAgIHZhciByYWQgPSAoY291bnQgJSAzNjApICogTWF0aC5QSSAvIDE4MDtcclxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS3jg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqEtLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuICAgICAgICAvL+aZgumWk1xyXG4gICAgICAgIHZhciB0aW1lPShuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkqMC4wMDE7XHJcbiAgICAgICAgLyotLeODleODrOODvOODoOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODiS0tKi9cclxuICAgICAgICBpZihzZWxlY3Q9PTEpe1xyXG4gICAgICAgICAgICBiaW5kQmFja2dyb3VuZChnbCxmQnVmZmVyLGJhY2tncm91bmREYXRhLHRpbWUsbXgsbXksY3csY2gsaHN2KTtcclxuICAgICAgICB9ZWxzZSBpZihzZWxlY3Q9PTIpe1xyXG4gICAgICAgICAgICBiaW5kQmFja2dyb3VuZChnbCxmQnVmZmVyLGludGVuc2l2ZURhdGEsdGltZSxteCxteSxjdyxjaCxoc3YpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy/lhajkvZPnmoTjgapcclxuICAgICAgICAvL3NoYWRlckJhY2tncm91bmTjga7loLTlkIhcclxuICAgICAgICBpZihzZWxlY3Q9PTF8fHNlbGVjdD09Mil7XHJcbiAgICAgICAgICAgIGJpbmRPdmVyYWxsKGdsLG92ZXJhbGxEYXRhLGZCdWZmZXIsbSxtTWF0cml4LHRtcE1hdHJpeCxtdnBNYXRyaXgscmFkLHRleHR1cmUscG9zWCxwb3NZLHBvc1oscG9zWG0scG9zWW0scG9zWm0sZ2V0bnVtYmVyKTtcclxuICAgICAgICB9ZWxzZSBpZihzZWxlY3Q9PTMpe1xyXG4gICAgICAgICAgICAvL2JpbmRJblNwaGVyZShjLGdsLGZCdWZmZXIsb3ZlcmFsbERhdGEsaW5TcGhlcmVEYXRhLGZCdWZmZXIsdGV4dHVyZSxwb3NYLHBvc1kscG9zWixwb3NYbSxwb3NZbSxwb3NabSxnZXRudW1iZXIsc3BoZXJlQ291bnRXLHNwaGVyZUNvdW50SCk7XHJcbiAgICAgICAgICAgIGJpbmRJblNwaGVyZShjLGdsLGZCdWZmZXIsb3ZlcmFsbERhdGEsaW5TcGhlcmVEYXRhLHRleHR1cmUscG9zWCxwb3NZLHBvc1oscG9zWG0scG9zWW0scG9zWm0sZ2V0bnVtYmVyLHNwaGVyZUNvdW50VyxzcGhlcmVDb3VudEgpO1xyXG4vLyAgICAgICAgICAgIGJpbmRJblNwaGVyZShjLGdsLGZCdWZmZXIsb3ZlcmFsbERhdGEsY2VudGVyUG9zaXRpb24sdXBQb3NpdGlvbixpblNwaGVyZURhdGEsZkJ1ZmZlcixtLG1NYXRyaXgscE1hdHJpeCx0bXBNYXRyaXgsbXZwTWF0cml4LHJhZCx0ZXh0dXJlLHBvc1gscG9zWSxwb3NaLHBvc1htLHBvc1ltLHBvc1ptLGdldG51bWJlcixzcGhlcmVDb3VudFcsc3BoZXJlQ291bnRIKTtcclxuICAgICAgICAgICAgYmluZFpvb21ibHVyKGdsLHpvb21ibHVyRGF0YSxmQnVmZmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g44Kz44Oz44OG44Kt44K544OI44Gu5YaN5o+P55S7XHJcbiAgICAgICAgZ2wuZmx1c2goKTtcclxuICAgICAgICAvL+OCv+ODluOBjOmdnuOCouOCr+ODhuOCo+ODluOBruWgtOWQiOOBr0ZQU+OCkuiQveOBqOOBmVxyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcclxuICAgIH0pKCk7XHJcblxyXG59O1xyXG5mdW5jdGlvbiBLZXlEb3duKGUpe1xyXG4gICAgaWYoZS5rZXlDb2RlPT00OSl7XHJcbiAgICAgICAgLy8x44KS5oq844GX44Gf44KJXHJcbiAgICAgICAgc2VsZWN0PTE7XHJcbiAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTUwKXtcclxuICAgICAgICAvLzLjgpLmirzjgZfjgZ/jgolcclxuICAgICAgICBzZWxlY3Q9MjtcclxuICAgIH1lbHNlIGlmKGUua2V5Q29kZT09NTEpe1xyXG4gICAgICAgIHNlbGVjdD0zO1xyXG4gICAgICAgIGNyZWF0ZVNwaGVyZVRleHR1cmUoZ2wsXCIuLi9pbWcvdGVzdC5qcGdcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy/ljYHlrZfjgq3jg7xcclxuICAgICAgICBpZihlLmtleUNvZGU9PTM3KXtcclxuICAgICAgICAgICAgLy/lt6ZcclxuICAgICAgICAgICAgc3BoZXJlQ291bnRXKys7XHJcbiAgICAgICAgfWVsc2UgaWYoZS5rZXlDb2RlPT0zOSl7XHJcbiAgICAgICAgICAgIC8v5Y+zXHJcbiAgICAgICAgICAgIHNwaGVyZUNvdW50Vy0tO1xyXG4gICAgICAgIH1lbHNlIGlmKGUua2V5Q29kZT09Mzgpe1xyXG4gICAgICAgICAgICAvL+S4ilxyXG4gICAgICAgICAgICBzcGhlcmVDb3VudEgtLTtcclxuICAgICAgICB9ZWxzZSBpZihlLmtleUNvZGU9PTQwKXtcclxuICAgICAgICAgICAgLy/kuItcclxuICAgICAgICAgICAgc3BoZXJlQ291bnRIKys7XHJcbiAgICAgICAgfVxyXG5cclxufVxyXG5mdW5jdGlvbiBtb3VzZU1vdmUoZSl7XHJcbiAgICBteD1lLm9mZnNldFgvY3c7XHJcbiAgICBteT1lLm9mZnNldFkvY2g7XHJcbn1cclxuZnVuY3Rpb24gaW5pdEJhY2tncm91bmQoX2dsLF92c0lkLF9mc0lkKXtcclxuICAgIHZhciBwcmc9Y3JlYXRlX3Byb2dyYW0oX2dsLGNyZWF0ZV9zaGFkZXIoX2dsLF92c0lkKSxjcmVhdGVfc2hhZGVyKF9nbCxfZnNJZCkpO1xyXG4gICAgdmFyIHVuaUxvY2F0aW9uPVtdO1xyXG4gICAgdW5pTG9jYXRpb25bMF09X2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsXCJ0aW1lXCIpO1xyXG4gICAgdW5pTG9jYXRpb25bMV09X2dsLmdldFVuaWZvcm1Mb2NhdGlvbihwcmcsXCJtb3VzZVwiKTtcclxuICAgIHVuaUxvY2F0aW9uWzJdPV9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLFwiaVJlc29sdXRpb25cIik7XHJcbiAgICB1bmlMb2NhdGlvblszXT1fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZyxcImhzdlwiKTtcclxuXHJcbiAgICB2YXIgUG9zaXRpb249W1xyXG4gICAgLTEuMCwxLjAsMC4wLFxyXG4gICAgMS4wLDEuMCwwLjAsXHJcbiAgICAtMS4wLC0xLjAsMC4wLFxyXG4gICAgMS4wLC0xLjAsMC4wLFxyXG4gICAgXTtcclxuICAgIHZhciBJbmRleD1bXHJcbiAgICAwLDIsMSxcclxuICAgIDEsMiwzXHJcbiAgICBdO1xyXG4gICAgdmFyIHZQb3NpdGlvbj1jcmVhdGVfdmJvKF9nbCxQb3NpdGlvbik7XHJcbiAgICB2YXIgdkluZGV4PWNyZWF0ZV9pYm8oX2dsLEluZGV4KTtcclxuICAgIHZhciB2QXR0TG9jYXRpb249X2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZyxcInBvc2l0aW9uXCIpO1xyXG5cclxuICAgIHJldHVybntwcmc6cHJnLHVuaUxvY2F0aW9uOnVuaUxvY2F0aW9uLHZQb3NpdGlvbjp2UG9zaXRpb24sdkluZGV4OnZJbmRleCxhdHRMb2NhdGlvbjp2QXR0TG9jYXRpb259O1xyXG59XHJcbmZ1bmN0aW9uIGluaXRJblNwaGVyZShfZ2wpe1xyXG4gICAgdmFyIGVhcnRoRGF0YSAgICAgPSBzcGhlcmUoNjQsIDY0LCAxLjAsIFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcclxuICAgIHZhciBlUG9zaXRpb24gICAgID0gY3JlYXRlX3ZibyhfZ2wsZWFydGhEYXRhLnApO1xyXG4gICAgdmFyIGVDb2xvciAgICAgICAgPSBjcmVhdGVfdmJvKF9nbCxlYXJ0aERhdGEuYyk7XHJcbiAgICB2YXIgZVRleHR1cmVDb29yZCA9IGNyZWF0ZV92Ym8oX2dsLGVhcnRoRGF0YS50KTtcclxuICAgIHZhciBlVkJPTGlzdCAgICAgID0gW2VQb3NpdGlvbixlQ29sb3IsIGVUZXh0dXJlQ29vcmRdO1xyXG4gICAgdmFyIGVJbmRleCAgICAgICAgPSBjcmVhdGVfaWJvKF9nbCxlYXJ0aERhdGEuaSk7XHJcblxyXG4gICAgcmV0dXJuIHtWQk9MaXN0OmVWQk9MaXN0LGlJbmRleDplSW5kZXgsaW5kZXg6ZWFydGhEYXRhLml9XHJcbn1cclxuZnVuY3Rpb24gaW5pdFpvb21CbHVyKF9nbCxfdnNJZCxfZnNJZCl7XHJcbiAgICB2YXIgcHJnID0gY3JlYXRlX3Byb2dyYW0oX2dsLGNyZWF0ZV9zaGFkZXIoX2dsLF92c0lkKSxjcmVhdGVfc2hhZGVyKF9nbCxfZnNJZCkpO1xyXG4gICAgdmFyIGF0dExvY2F0aW9uID0gW107XHJcbiAgICBhdHRMb2NhdGlvblswXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdwb3NpdGlvbicpO1xyXG4gICAgYXR0TG9jYXRpb25bMV0gPSBfZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAndGV4Q29vcmQnKTtcclxuICAgIHZhciBhdHRTdHJpZGUgPSBuZXcgQXJyYXkoKTtcclxuICAgIGF0dFN0cmlkZVswXSA9IDM7XHJcbiAgICBhdHRTdHJpZGVbMV0gPSAyO1xyXG4gICAgdmFyIHVuaUxvY2F0aW9uID0gW107XHJcbiAgICB1bmlMb2NhdGlvblswXSA9IF9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAnbXZwTWF0cml4Jyk7XHJcbiAgICB1bmlMb2NhdGlvblsxXSA9IF9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAndGV4dHVyZScpO1xyXG4gICAgdW5pTG9jYXRpb25bMl0gPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ3N0cmVuZ3RoJyk7XHJcbiAgICAvLyDmnb/jg53jg6rjgrTjg7NcclxuICAgIHZhciBwb3NpdGlvbiA9IFstMS4wLCAxLjAsIDAuMCxcclxuICAgIDEuMCwgMS4wLCAwLjAsIC0gMS4wLCAtIDEuMCwgMC4wLFxyXG4gICAgMS4wLCAtIDEuMCwgMC4wXTtcclxuICAgIHZhciB0ZXhDb29yZCA9IFtcclxuICAgIDAuMCwgMC4wLFxyXG4gICAgMS4wLCAwLjAsXHJcbiAgICAwLjAsIDEuMCxcclxuICAgIDEuMCwgMS4wXTtcclxuICAgIHZhciBpbmRleCA9IFtcclxuICAgIDAsIDIsIDEsXHJcbiAgICAyLCAzLCAxXTtcclxuICAgIHZhciB2UG9zaXRpb24gPSBjcmVhdGVfdmJvKF9nbCxwb3NpdGlvbik7XHJcbiAgICB2YXIgdlRleENvb3JkID0gY3JlYXRlX3ZibyhfZ2wsdGV4Q29vcmQpO1xyXG4gICAgdmFyIHZWQk9MaXN0ID0gW3ZQb3NpdGlvbiwgdlRleENvb3JkXTtcclxuICAgIHZhciBpSW5kZXggPSBjcmVhdGVfaWJvKF9nbCxpbmRleCk7XHJcblxyXG4gICAgcmV0dXJue3ByZzpwcmcsIGF0dExvY2F0aW9uOmF0dExvY2F0aW9uLCBhdHRTdHJpZGU6YXR0U3RyaWRlLHVuaUxvY2F0aW9uOnVuaUxvY2F0aW9uICxWQk9MaXN0OnZWQk9MaXN0LCBpbmRleDppbmRleCwgaUluZGV4OmlJbmRleH1cclxufVxyXG5mdW5jdGlvbiBpbml0T3ZlcmFsbChfZ2wsKXtcclxuICAgIC8vIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkOOBqOODquODs+OCr1xyXG4gICAgIHZhciBwcmcgPSBjcmVhdGVfcHJvZ3JhbShfZ2wsY3JlYXRlX3NoYWRlcihfZ2wsJ3ZzJyksIGNyZWF0ZV9zaGFkZXIoX2dsLCdmcycpKTtcclxuXHJcbiAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkumFjeWIl+OBq+WPluW+l1xyXG4gICAgdmFyIGF0dExvY2F0aW9uID0gW107XHJcbiAgICBhdHRMb2NhdGlvblswXSA9IF9nbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdwb3NpdGlvbicpO1xyXG4gICAgYXR0TG9jYXRpb25bMV0gPSBfZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAnY29sb3InKTtcclxuICAgIGF0dExvY2F0aW9uWzJdID0gX2dsLmdldEF0dHJpYkxvY2F0aW9uKHByZywgJ3RleHR1cmVDb29yZCcpO1xyXG4gICAgLy8gYXR0cmlidXRl44Gu6KaB57Sg5pWw44KS6YWN5YiX44Gr5qC857SNXHJcbiAgICB2YXIgYXR0U3RyaWRlID0gW107XHJcbiAgICBhdHRTdHJpZGVbMF0gPSAzO1xyXG4gICAgYXR0U3RyaWRlWzFdID0gNDtcclxuICAgIGF0dFN0cmlkZVsyXSA9IDI7XHJcbiAgICAvLyDpoILngrnjga7kvY3nva5cclxuICAgIHZhciBwb3NpdGlvbiA9IFtcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgICAxLjAsICAxLjAsICAwLjAsXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAtMS4wLCAgMC4wXHJcbiAgICBdO1xyXG4gICAgLy8g6aCC54K56ImyXHJcbiAgICB2YXIgY29sb3IgPSBbXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wXHJcbiAgICBdO1xyXG4gICAgLy8g44OG44Kv44K544OB44Oj5bqn5qiZXHJcbiAgICB2YXIgdGV4dHVyZUNvb3JkID0gW1xyXG4gICAgICAgIDAuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgMC4wLFxyXG4gICAgICAgIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wXHJcbiAgICBdO1xyXG4gICAgLy8g6aCC54K544Kk44Oz44OH44OD44Kv44K5XHJcbiAgICB2YXIgaW5kZXggPSBbXHJcbiAgICAgICAgMCwgMSwgMixcclxuICAgICAgICAzLCAyLCAxXHJcbiAgICBdO1xyXG4gICAgLy8gVkJP44GoSUJP44Gu55Sf5oiQXHJcbiAgICB2YXIgdlBvc2l0aW9uICAgICA9IGNyZWF0ZV92Ym8oX2dsLHBvc2l0aW9uKTtcclxuICAgIHZhciB2Q29sb3IgICAgICAgID0gY3JlYXRlX3ZibyhfZ2wsY29sb3IpO1xyXG4gICAgdmFyIHZUZXh0dXJlQ29vcmQgPSBjcmVhdGVfdmJvKF9nbCx0ZXh0dXJlQ29vcmQpO1xyXG4gICAgdmFyIFZCT0xpc3QgICAgICAgPSBbdlBvc2l0aW9uLCB2Q29sb3IsIHZUZXh0dXJlQ29vcmRdO1xyXG4gICAgdmFyIGlJbmRleCAgICAgICAgPSBjcmVhdGVfaWJvKF9nbCxpbmRleCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybUxvY2F0aW9u44KS6YWN5YiX44Gr5Y+W5b6XXHJcbiAgICB2YXIgdW5pTG9jYXRpb24gPSBbXTtcclxuICAgIHVuaUxvY2F0aW9uWzBdICA9IF9nbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAnbXZwTWF0cml4Jyk7XHJcbiAgICB1bmlMb2NhdGlvblsxXSAgPSBfZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ3RleHR1cmUnKTtcclxuXHJcbiAgICByZXR1cm57cHJnOnByZyxhdHRMb2NhdGlvbjphdHRMb2NhdGlvbixhdHRTdHJpZGU6YXR0U3RyaWRlLFZCT0xpc3Q6VkJPTGlzdCxpSW5kZXg6aUluZGV4LHVuaUxvY2F0aW9uOnVuaUxvY2F0aW9ufTtcclxufVxyXG5mdW5jdGlvbiBiaW5kQmFja2dyb3VuZChfZ2wsX2ZCdWZmZXIsX2JhY2tncm91bmREYXRhLF90aW1lLF9teCxfbXksX2N3LF9jaCxfaHN2KXtcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLF9mQnVmZmVyLmYpO1xyXG4gICAgX2dsLmNsZWFyQ29sb3IoMC4wLDAuMCwwLjAsMS4wKTtcclxuICAgIF9nbC5jbGVhcihfZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgX2dsLnVzZVByb2dyYW0oX2JhY2tncm91bmREYXRhLnByZyk7XHJcbiAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLnhKHlirnjgavjgZnjgotcclxuICAgIF9nbC5kaXNhYmxlKF9nbC5CTEVORCk7XHJcbiAgICAvL2F0dHJpYnV0ZeOBrueZu+mMslxyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkFSUkFZX0JVRkZFUixfYmFja2dyb3VuZERhdGEudlBvc2l0aW9uKTtcclxuICAgIF9nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShfYmFja2dyb3VuZERhdGEudkF0dExvY2F0aW9uKTtcclxuICAgIF9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKF9iYWNrZ3JvdW5kRGF0YS52QXR0TG9jYXRpb24sMyxfZ2wuRkxPQVQsZmFsc2UsMCwwKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUixfYmFja2dyb3VuZERhdGEudkluZGV4KTtcclxuXHJcbiAgICBfZ2wudW5pZm9ybTFmKF9iYWNrZ3JvdW5kRGF0YS51bmlMb2NhdGlvblswXSxfdGltZSk7XHJcbiAgICBfZ2wudW5pZm9ybTJmdihfYmFja2dyb3VuZERhdGEudW5pTG9jYXRpb25bMV0sW19teCxfbXldKTtcclxuICAgIF9nbC51bmlmb3JtMmZ2KF9iYWNrZ3JvdW5kRGF0YS51bmlMb2NhdGlvblsyXSxbX2N3LF9jaF0pO1xyXG4gICAgX2dsLnVuaWZvcm00ZnYoX2JhY2tncm91bmREYXRhLnVuaUxvY2F0aW9uWzNdLFtfaHN2WzBdLF9oc3ZbMV0sX2hzdlsyXSxfaHN2WzNdXSk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsNixfZ2wuVU5TSUdORURfU0hPUlQsMCk7XHJcblxyXG4gICAgX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsbnVsbCk7XHJcblxyXG59XHJcbmZ1bmN0aW9uIGJpbmRab29tYmx1cihfZ2wsX3pvb21ibHVyRGF0YSxfZkJ1ZmZlcil7XHJcbi8q6aCR5by144Gj44Gm5pu444GN5o+b44GI44KLKi9cclxuICAgIHZhciBtID0gbmV3IG1hdElWKCk7XHJcbiAgICB2YXIgbU1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB2TWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHBNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdG1wTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBtdnBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gu6YG45oqeXHJcbiAgICBfZ2wudXNlUHJvZ3JhbShfem9vbWJsdXJEYXRhLnByZyk7XHJcblxyXG4gICAgX2dsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcclxuICAgIF9nbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICBfZ2wuY2xlYXIoX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCBfZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy8g5q2j5bCE5b2x55So44Gu5bqn5qiZ5aSJ5o+b6KGM5YiXXHJcbiAgICBtLmxvb2tBdChbMC4wLCAwLjAsIDAuNV0sIFswLjAsIDAuMCwgMC4wXSwgWzAuMCwgMS4wLCAwLjBdLCB2TWF0cml4KTtcclxuICAgIG0ub3J0aG8oLTEuMCwgMS4wLCAxLjAsIC0gMS4wLCAwLjEsIDEsIHBNYXRyaXgpO1xyXG4gICAgbS5tdWx0aXBseShwTWF0cml4LCB2TWF0cml4LCB0bXBNYXRyaXgpO1xyXG5cclxuICAgIHZhciBzdHJlbmd0aCA9IDEwO1xyXG4gICAgIF9nbC5hY3RpdmVUZXh0dXJlKF9nbC5URVhUVVJFMCk7XHJcbiAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBfZkJ1ZmZlci50KTtcclxuICAgICBzZXRfYXR0cmlidXRlKF9nbCxfem9vbWJsdXJEYXRhLlZCT0xpc3QsIF96b29tYmx1ckRhdGEuYXR0TG9jYXRpb24sIF96b29tYmx1ckRhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX3pvb21ibHVyRGF0YS5pSW5kZXgpO1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX3pvb21ibHVyRGF0YS51bmlMb2NhdGlvblswXSwgZmFsc2UsIHRtcE1hdHJpeCk7XHJcbiAgICBfZ2wudW5pZm9ybTFpKF96b29tYmx1ckRhdGEudW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgX2dsLnVuaWZvcm0xZihfem9vbWJsdXJEYXRhLnVuaUxvY2F0aW9uWzJdLCBzdHJlbmd0aCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIF96b29tYmx1ckRhdGEuaW5kZXgubGVuZ3RoLCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxufVxyXG5mdW5jdGlvbiBiaW5kT3ZlcmFsbChfZ2wsX292ZXJhbGxEYXRhLF9mQnVmZmVyLF9tLF9tTWF0cml4LF90bXBNYXRyaXgsX212cE1hdHJpeCxfcmFkLF90ZXh0dXJlLF9wb3NYLF9wb3NZLF9wb3NaLF9wb3NYbSxfcG9zWW0sX3Bvc1ptLF9nZXRudW1iZXIpe1xyXG4gICAgLy8gY2FudmFz44KS5Yid5pyf5YyWXHJcbiAgICBfZ2wuY2xlYXJDb2xvcigwLjAsMC4wLDAuMCwxLjApO1xyXG4gICAgX2dsLmNsZWFyRGVwdGgoMS4wKTtcclxuICAgIF9nbC5jbGVhcihfZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IF9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLeiDjOaZr+ODhuOCr+OCueODgeODoyjjgqrjg5Xjgrnjgq/jg6rjg7zjg7Pjg6zjg7Pjgr/jg6rjg7PjgrApLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuICAgIF9nbC51c2VQcm9ncmFtKF9vdmVyYWxsRGF0YS5wcmcpO1xyXG4gICAgLy8g44OW44Os44Oz44OH44Kj44Oz44Kw44KS54Sh5Yq544Gr44GZ44KLXHJcbiAgICBfZ2wuZGlzYWJsZShfZ2wuQkxFTkQpO1xyXG4gICAgLy8gVkJP44GoSUJP44Gu55m76YyyXHJcbiAgICBzZXRfYXR0cmlidXRlKF9nbCxfb3ZlcmFsbERhdGEuVkJPTGlzdCwgX292ZXJhbGxEYXRhLmF0dExvY2F0aW9uLCBfb3ZlcmFsbERhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX292ZXJhbGxEYXRhLmlJbmRleCk7XHJcbiAgICAvKuenu+WLleOAgeWbnui7ouOAgeaLoeWkp+e4ruWwjyovXHJcbiAgICBfbS5pZGVudGl0eShfbU1hdHJpeCk7XHJcbiAgICBfbS50cmFuc2xhdGUoX21NYXRyaXgsWzAuMCwwLjAsLTk1LjBdLF9tTWF0cml4KTtcclxuICAgIF9tLnNjYWxlKF9tTWF0cml4LFsxMDAuMCw3MC4wLDEuMF0sX21NYXRyaXgpO1xyXG4gICAgX20ubXVsdGlwbHkoX3RtcE1hdHJpeCwgX21NYXRyaXgsIF9tdnBNYXRyaXgpO1xyXG4gICAgLy91bmlmb3Jt44KS55m76YyyXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsX2ZCdWZmZXIudCk7XHJcbiAgICBfZ2wudW5pZm9ybTFpKF9vdmVyYWxsRGF0YS51bmlMb2NhdGlvblsxXSwgMCk7XHJcbiAgICBfZ2wudW5pZm9ybU1hdHJpeDRmdihfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMF0sIGZhbHNlLCBfbXZwTWF0cml4KTtcclxuICAgIF9nbC5kcmF3RWxlbWVudHMoX2dsLlRSSUFOR0xFUywgNiwgX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICAvKuODhuOCr+OCueODgeODoyovXHJcbiAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLmnInlirnjgavjgZnjgotcclxuXHJcbiAgICBfZ2wuZW5hYmxlKF9nbC5CTEVORCk7XHJcbiAgIGlmKF90ZXh0dXJlKXtcclxuICAgICAgIGZvcih2YXIgaT0wO2k8X3RleHR1cmUubGVuZ3RoO2krKyl7XHJcblxyXG4gICAgICAgIF9wb3NaW2ldLT0wLjQwO1xyXG4gICAgICAgIF9wb3NabVtpXSs9MS4wO1xyXG4gICAgICAgIGlmKF9wb3NaW2ldPC0xMDApe1xyXG4gICAgICAgICAgICAvLyDjgqvjg6Hjg6njgojjgorliY3jgavjgZnjgZnjgpPjgaDjgonjgIHphY3liJfjgpLmuJvjgonjgZnlh6bnkIbjgYzlvq7lpplcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgIF90ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NaLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXItLTtcclxuICAgICAgICB9ZWxzZSBpZihfcG9zWm1baV0+MTApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgX3RleHR1cmUuc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1htLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWm0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX2dldG51bWJlci0tO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiaW5kUGxhdGVQb2x5KF9nbCxfbSxfbU1hdHJpeCxfdG1wTWF0cml4LF9tdnBNYXRyaXgsX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uLGksX3Bvc1hbaV0sX3Bvc1lbaV0sX3Bvc1pbaV0sX3Bvc1htW2ldLF9wb3NZbVtpXSxfcG9zWm1baV0sZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgfVxyXG59XHJcbmZ1bmN0aW9uIGJpbmRJblNwaGVyZShfYyxfZ2wsX2ZCdWZmZXIsX292ZXJhbGxEYXRhLF9pblNwaGVyZURhdGEsX3RleHR1cmUsX3Bvc1gsX3Bvc1ksX3Bvc1osX3Bvc1htLF9wb3NZbSxfcG9zWm0sX2dldG51bWJlcixfc3BoZXJlQ291bnRXLF9zcGhlcmVDb3VudEgpe1xyXG4gICAgdmFyIHJhZFcgPSAoX3NwaGVyZUNvdW50VyAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgdmFyIHJhZEggPSAoX3NwaGVyZUNvdW50SCAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgdmFyIG0gPSBuZXcgbWF0SVYoKTtcclxuICAgIHZhciBtTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHZNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgcE1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB0bXBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIG12cE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICAvLyDjg5Pjg6Xjg7zDl+ODl+ODreOCuOOCp+OCr+OCt+ODp+ODs+W6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgdmFyIGV5ZVBvc2l0aW9uPVswLjAsIDAuMCwgNS4wXTtcclxuICAgIHZhciBjZW50ZXJQb3NpdGlvbj1bMC4wLCAwLjAsIDAuMF07XHJcbiAgICB2YXIgdXBQb3NpdGlvbj1bMC4wLCAxLjAsIDAuMF07XHJcbiAgICBtLnBlcnNwZWN0aXZlKDQ1LCBfYy53aWR0aCAvIF9jLmhlaWdodCwgMC4xLCAxMDAsIHBNYXRyaXgpO1xyXG4gICAgbS5tdWx0aXBseShwTWF0cml4LCB2TWF0cml4LCB0bXBNYXRyaXgpO1xyXG5cclxuXHJcbiAgICB2YXIgcT1uZXcgcXRuSVYoKTtcclxuICAgIHZhciBjYW1RPXEuaWRlbnRpdHkocS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgY2FtVz1xLmlkZW50aXR5KHEuY3JlYXRlKCkpO1xyXG4gICAgdmFyIGNhbUg9cS5pZGVudGl0eShxLmNyZWF0ZSgpKTtcclxuXHJcbiAgICBxLnJvdGF0ZShyYWRXLFswLDEsMF0sY2FtVyk7XHJcbiAgICBxLnJvdGF0ZShyYWRILFsxLDAsMF0sY2FtSCk7XHJcbiAgICBxLm11bHRpcGx5KGNhbUgsY2FtVyxjYW1RKTtcclxuICAgIHZhciBjYW1VcD1bXTtcclxuICAgIHZhciBjYW1mb3J3YXJkPVtdO1xyXG4gICAgcS50b1ZlY0lJSSh1cFBvc2l0aW9uLGNhbVEsY2FtVXApO1xyXG4gICAgcS50b1ZlY0lJSShbMC4wLDAuMCwtMS4wXSxjYW1RLGNhbWZvcndhcmQpO1xyXG5cclxuICAgIHZhciBleWVDYW09W107XHJcbiAgICBleWVDYW1bMF09ZXllUG9zaXRpb25bMF0rY2FtZm9yd2FyZFswXTtcclxuICAgIGV5ZUNhbVsxXT1leWVQb3NpdGlvblsxXStjYW1mb3J3YXJkWzFdO1xyXG4gICAgZXllQ2FtWzJdPWV5ZVBvc2l0aW9uWzJdK2NhbWZvcndhcmRbMl07XHJcbiAgICBtLmxvb2tBdChleWVQb3NpdGlvbiwgZXllQ2FtLCBjYW1VcCwgdk1hdHJpeCk7XHJcblxyXG4gICAgbS5tdWx0aXBseShwTWF0cml4LCB2TWF0cml4LCB0bXBNYXRyaXgpO1xyXG5cclxuXHJcbl9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLF9mQnVmZmVyLmYpO1xyXG4gICAgLy8gY2FudmFz44KS5Yid5pyf5YyWXHJcbiAgICBfZ2wuY2xlYXJDb2xvcigwLjAsMC4wLDAuMCwxLjApO1xyXG4gICAgX2dsLmNsZWFyRGVwdGgoMS4wKTtcclxuICAgIF9nbC5jbGVhcihfZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IF9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcblxyXG4gICAgX2dsLnVzZVByb2dyYW0oX292ZXJhbGxEYXRhLnByZyk7XHJcbiAgICAvLyDjg5bjg6zjg7Pjg4fjgqPjg7PjgrDjgpLnhKHlirnjgavjgZnjgotcclxuICAgIF9nbC5kaXNhYmxlKF9nbC5CTEVORCk7XHJcbiAgICAvLyBWQk/jgahJQk/jga7nmbvpjLJcclxuICAgIHNldF9hdHRyaWJ1dGUoX2dsLF9pblNwaGVyZURhdGEuVkJPTGlzdCwgX292ZXJhbGxEYXRhLmF0dExvY2F0aW9uLCBfb3ZlcmFsbERhdGEuYXR0U3RyaWRlKTtcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgX2luU3BoZXJlRGF0YS5pSW5kZXgpO1xyXG4gICAgLyrnp7vli5XjgIHlm57ou6LjgIHmi6HlpKfnuK7lsI8qL1xyXG5cclxuICAgIG0uaWRlbnRpdHkobU1hdHJpeCk7XHJcbiAgICBtLnRyYW5zbGF0ZShtTWF0cml4LFswLjAsMC4wLDUuMF0sbU1hdHJpeCk7XHJcbiAgICBtLnNjYWxlKG1NYXRyaXgsWzEwLjAsMTAuMCwxMC4wXSxtTWF0cml4KTtcclxuICAgIG0ucm90YXRlKG1NYXRyaXgsIDE4MCwgWzEsIDAsIDBdLCBtTWF0cml4KTtcclxuXHJcbiAgICBtLm11bHRpcGx5KHRtcE1hdHJpeCwgbU1hdHJpeCwgbXZwTWF0cml4KTtcclxuICAgIC8vdW5pZm9ybeOCkueZu+mMslxyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELHNwaGVyZVRleHR1cmUpO1xyXG4gICAgX2dsLnVuaWZvcm0xaShfb3ZlcmFsbERhdGEudW5pTG9jYXRpb25bMV0sIDApO1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX292ZXJhbGxEYXRhLnVuaUxvY2F0aW9uWzBdLCBmYWxzZSwgbXZwTWF0cml4KTtcclxuXHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIF9pblNwaGVyZURhdGEuaW5kZXgubGVuZ3RoLCBfZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxuXHJcbiAgICAvLyBWQk/jgahJQk/jga7nmbvpjLJcclxuICAgIHNldF9hdHRyaWJ1dGUoX2dsLF9vdmVyYWxsRGF0YS5WQk9MaXN0LCBfb3ZlcmFsbERhdGEuYXR0TG9jYXRpb24sIF9vdmVyYWxsRGF0YS5hdHRTdHJpZGUpO1xyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBfb3ZlcmFsbERhdGEuaUluZGV4KTtcclxuICAgIF9nbC5lbmFibGUoX2dsLkJMRU5EKTtcclxuICAgaWYoX3RleHR1cmUpe1xyXG4gICAgICAgZm9yKHZhciBpPTA7aTxfdGV4dHVyZS5sZW5ndGg7aSsrKXtcclxuICAgICAgICBfcG9zWVtpXS09MC4xO1xyXG4gICAgICAgIC8vIF9wb3NaW2ldLT0wLjQwO1xyXG4gICAgICAgIF9wb3NabVtpXSs9MS4wO1xyXG4gICAgICAgIGlmKF9wb3NaW2ldPC0xMDApe1xyXG4gICAgICAgICAgICAvLyDjgqvjg6Hjg6njgojjgorliY3jgavjgZnjgZnjgpPjgaDjgonjgIHphY3liJfjgpLmuJvjgonjgZnlh6bnkIbjgYzlvq7lpplcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLliYrpmaTjgZfjgabjgb7jgZlcIik7XHJcbiAgICAgICAgICAgIF90ZXh0dXJlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NYLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NaLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9nZXRudW1iZXItLTtcclxuICAgICAgICB9ZWxzZSBpZihfcG9zWm1baV0+MTApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWJiumZpOOBl+OBpuOBvuOBmVwiKTtcclxuICAgICAgICAgICAgX3RleHR1cmUuc2hpZnQoKTtcclxuICAgICAgICAgICAgX3Bvc1htLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIF9wb3NZbS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBfcG9zWm0uc2hpZnQoKTtcclxuICAgICAgICAgICAgX2dldG51bWJlci0tO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiaW5kUGxhdGVQb2x5KF9nbCxtLG1NYXRyaXgsdG1wTWF0cml4LG12cE1hdHJpeCxfb3ZlcmFsbERhdGEudW5pTG9jYXRpb24saSxfcG9zWFtpXSxfcG9zWVtpXSxfcG9zWltpXSxfcG9zWG1baV0sX3Bvc1ltW2ldLF9wb3NabVtpXSx0cnVlKTtcclxuICAgICAgIH1cclxuICAgfVxyXG5cclxuX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsbnVsbCk7XHJcblxyXG59XHJcbmZ1bmN0aW9uIGJpbmRQbGF0ZVBvbHkoX2dsLF9tLF9tTWF0cml4LF90bXBNYXRyaXgsX212cE1hdHJpeCxfdW5pTG9jYXRpb24sX251bWJlcixfcG9zWCxfcG9zWSxfcG9zWixfcG9zWG0sX3Bvc1ltLF9wb3NabSxfc2NhbGVGcmFnKXtcclxuICAgIC8vIOODouODh+ODq+W6p+aomeWkieaPm+ihjOWIl+OBrueUn+aIkFxyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFtfcG9zWCxfcG9zWSxfcG9zWl0sX21NYXRyaXgpO1xyXG4gICAgaWYoX3NjYWxlRnJhZyl7XHJcbiAgICAgICAgX20uc2NhbGUoX21NYXRyaXgsWzAuNSwwLjUsMC41XSxfbU1hdHJpeCk7XHJcbiAgICB9XHJcbiAgICBfbS5tdWx0aXBseShfdG1wTWF0cml4LCBfbU1hdHJpeCwgX212cE1hdHJpeCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXh0dXJlW19udW1iZXJdKTtcclxuICAgIFxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBq+ODhuOCr+OCueODgeODo+OCkueZu+mMslxyXG4gICBfZ2wudW5pZm9ybTFpKF91bmlMb2NhdGlvblsxXSwgMCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBrueZu+mMsuOBqOaPj+eUu1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX3VuaUxvY2F0aW9uWzBdLCBmYWxzZSwgX212cE1hdHJpeCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIDYsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcblxyXG4gICAgX20uaWRlbnRpdHkoX21NYXRyaXgpO1xyXG4gICAgX20udHJhbnNsYXRlKF9tTWF0cml4LFtfcG9zWG0sX3Bvc1ltLF9wb3NabV0sX21NYXRyaXgpO1xyXG4gICAgaWYoX3NjYWxlRnJhZyl7XHJcbiAgICAgICAgX20uc2NhbGUoX21NYXRyaXgsWzAuNSwwLjUsMC41XSxfbU1hdHJpeCk7XHJcbiAgICB9XHJcbiAgICBfbS5tdWx0aXBseShfdG1wTWF0cml4LCBfbU1hdHJpeCwgX212cE1hdHJpeCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXh0dXJlW19udW1iZXJdKTtcclxuICAgIFxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBq+ODhuOCr+OCueODgeODo+OCkueZu+mMslxyXG4gICBfZ2wudW5pZm9ybTFpKF91bmlMb2NhdGlvblsxXSwgMCk7XHJcblxyXG4gICAgLy8gdW5pZm9ybeWkieaVsOOBrueZu+mMsuOBqOaPj+eUu1xyXG4gICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoX3VuaUxvY2F0aW9uWzBdLCBmYWxzZSwgX212cE1hdHJpeCk7XHJcbiAgICBfZ2wuZHJhd0VsZW1lbnRzKF9nbC5UUklBTkdMRVMsIDYsIF9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbiAgICBcclxufVxyXG5cclxuLy8g44K344Kn44O844OA44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9zaGFkZXIoX2dsLF9pZCl7XHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgpLmoLzntI3jgZnjgovlpInmlbBcclxuICAgIHZhciBzaGFkZXI7XHJcbiAgICBcclxuICAgIC8vIEhUTUzjgYvjgolzY3JpcHTjgr/jgrDjgbjjga7lj4LnhafjgpLlj5blvpdcclxuICAgIHZhciBzY3JpcHRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoX2lkKTtcclxuICAgIFxyXG4gICAgLy8gc2NyaXB044K/44Kw44GM5a2Y5Zyo44GX44Gq44GE5aC05ZCI44Gv5oqc44GR44KLXHJcbiAgICBpZighc2NyaXB0RWxlbWVudCl7cmV0dXJuO31cclxuICAgIFxyXG4gICAgLy8gc2NyaXB044K/44Kw44GudHlwZeWxnuaAp+OCkuODgeOCp+ODg+OCr1xyXG4gICAgc3dpdGNoKHNjcmlwdEVsZW1lbnQudHlwZSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g6aCC54K544K344Kn44O844OA44Gu5aC05ZCIXHJcbiAgICAgICAgY2FzZSAneC1zaGFkZXIveC12ZXJ0ZXgnOlxyXG4gICAgICAgICAgICBzaGFkZXIgPSBfZ2wuY3JlYXRlU2hhZGVyKF9nbC5WRVJURVhfU0hBREVSKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIC8vIOODleODqeOCsOODoeODs+ODiOOCt+OCp+ODvOODgOOBruWgtOWQiFxyXG4gICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOlxyXG4gICAgICAgICAgICBzaGFkZXIgPSBfZ2wuY3JlYXRlU2hhZGVyKF9nbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0IDpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyDnlJ/miJDjgZXjgozjgZ/jgrfjgqfjg7zjg4Djgavjgr3jg7zjgrnjgpLlibLjgorlvZPjgabjgotcclxuICAgIF9nbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzY3JpcHRFbGVtZW50LnRleHQpO1xyXG4gICAgXHJcbiAgICAvLyDjgrfjgqfjg7zjg4DjgpLjgrPjg7Pjg5HjgqTjg6vjgZnjgotcclxuICAgIF9nbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOBjOato+OBl+OBj+OCs+ODs+ODkeOCpOODq+OBleOCjOOBn+OBi+ODgeOCp+ODg+OCr1xyXG4gICAgaWYoX2dsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIF9nbC5DT01QSUxFX1NUQVRVUykpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOaIkOWKn+OBl+OBpuOBhOOBn+OCieOCt+OCp+ODvOODgOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgICAgIHJldHVybiBzaGFkZXI7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBcclxuICAgICAgICAvLyDlpLHmlZfjgZfjgabjgYTjgZ/jgonjgqjjg6njg7zjg63jgrDjgpLjgqLjg6njg7zjg4jjgZnjgotcclxuICAgICAgICBhbGVydChfZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcclxuICAgIH1cclxufVxyXG4vLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLnlJ/miJDjgZfjgrfjgqfjg7zjg4DjgpLjg6rjg7Pjgq/jgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3Byb2dyYW0oX2dsLF92cywgX2ZzKXtcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIHByb2dyYW0gPSBfZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgavjgrfjgqfjg7zjg4DjgpLlibLjgorlvZPjgabjgotcclxuICAgIF9nbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgX3ZzKTtcclxuICAgIF9nbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgX2ZzKTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44KS44Oq44Oz44KvXHJcbiAgICBfZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOBruODquODs+OCr+OBjOato+OBl+OBj+ihjOOBquOCj+OCjOOBn+OBi+ODgeOCp+ODg+OCr1xyXG4gICAgaWYoX2dsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgX2dsLkxJTktfU1RBVFVTKSl7XHJcbiAgICBcclxuICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgICAgICBfZ2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gcHJvZ3JhbTtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOWkseaVl+OBl+OBpuOBhOOBn+OCieOCqOODqeODvOODreOCsOOCkuOCouODqeODvOODiOOBmeOCi1xyXG4gICAgICAgIGFsZXJ0KF9nbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSk7XHJcbiAgICB9XHJcbn1cclxuLy8gVkJP44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV92Ym8oX2dsLF9kYXRhKXtcclxuICAgIC8vIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIHZibyA9IF9nbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjgavjg4fjg7zjgr/jgpLjgrvjg4Pjg4hcclxuICAgIF9nbC5idWZmZXJEYXRhKF9nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoX2RhdGEpLCBfZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xyXG4gICAgXHJcbiAgICAvLyDnlJ/miJDjgZfjgZ8gVkJPIOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgcmV0dXJuIHZibztcclxufVxyXG4vLyBWQk/jgpLjg5DjgqTjg7Pjg4njgZfnmbvpjLLjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZShfZ2wsX3ZibywgX2F0dEwsIF9hdHRTKXtcclxuICAgIC8vIOW8leaVsOOBqOOBl+OBpuWPl+OBkeWPluOBo+OBn+mFjeWIl+OCkuWHpueQhuOBmeOCi1xyXG4gICAgZm9yKHZhciBpIGluIF92Ym8pe1xyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kQnVmZmVyKF9nbC5BUlJBWV9CVUZGRVIsIF92Ym9baV0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGF0dHJpYnV0ZUxvY2F0aW9u44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICAgICAgX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KF9hdHRMW2ldKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkumAmuefpeOBl+eZu+mMsuOBmeOCi1xyXG4gICAgICAgIF9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKF9hdHRMW2ldLCBfYXR0U1tpXSwgX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICB9XHJcbn1cclxuLy8gSUJP44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbmZ1bmN0aW9uIGNyZWF0ZV9pYm8oX2dsLF9kYXRhKXtcclxuICAgIC8vIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGlibyA9IF9nbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIFxyXG4gICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICBfZ2wuYmluZEJ1ZmZlcihfZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBq+ODh+ODvOOCv+OCkuOCu+ODg+ODiFxyXG4gICAgX2dsLmJ1ZmZlckRhdGEoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgSW50MTZBcnJheShfZGF0YSksIF9nbC5TVEFUSUNfRFJBVyk7XHJcbiAgICBcclxuICAgIC8vIOODkOODg+ODleOCoeOBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgX2dsLmJpbmRCdWZmZXIoX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g55Sf5oiQ44GX44GfSUJP44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICByZXR1cm4gaWJvO1xyXG59XHJcblxyXG4vLyDjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJDjgZnjgovplqLmlbBcclxuZnVuY3Rpb24gY3JlYXRlX3RleHR1cmUoX2dsLF9zb3VyY2UsX24pe1xyXG4gICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICBcclxuICAgIC8vIOODh+ODvOOCv+OBruOCquODs+ODreODvOODieOCkuODiOODquOCrOODvOOBq+OBmeOCi1xyXG4gICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgdmFyIHRleCA9IF9nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBuOOCpOODoeODvOOCuOOCkumBqeeUqFxyXG4gICAgICAgIF9nbC50ZXhJbWFnZTJEKF9nbC5URVhUVVJFXzJELCAwLCBfZ2wuUkdCQSwgX2dsLlJHQkEsIF9nbC5VTlNJR05FRF9CWVRFLCBpbWcpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01BR19GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUixfZ2wuTElORUFSKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1MsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX1dSQVBfVCxfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG4gICAgICAgIC8vIOODn+ODg+ODl+ODnuODg+ODl+OCkueUn+aIkFxyXG4gICAgICAgIF9nbC5nZW5lcmF0ZU1pcG1hcChfZ2wuVEVYVFVSRV8yRCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICAgICAgX2dsLmJpbmRUZXh0dXJlKF9nbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDnlJ/miJDjgZfjgZ/jg4bjgq/jgrnjg4Hjg6PjgpLjgrDjg63jg7zjg5Djg6vlpInmlbDjgavku6PlhaVcclxuICAgICAgICAgICAgdGV4dHVyZVtfbl0gPSB0ZXg7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7jgr3jg7zjgrnjgpLmjIflrppcclxuICAgIGltZy5zcmMgPSBfc291cmNlO1xyXG59XHJcbi8vIOODhuOCr+OCueODgeODo+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVTcGhlcmVUZXh0dXJlKF9nbCxfc291cmNlKXtcclxuICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgXHJcbiAgICAvLyDjg4fjg7zjgr/jga7jgqrjg7Pjg63jg7zjg4njgpLjg4jjg6rjgqzjg7zjgavjgZnjgotcclxuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciB0ZXggPSBfZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgbjjgqTjg6Hjg7zjgrjjgpLpgannlKhcclxuICAgICAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF9nbC5SR0JBLCBfZ2wuVU5TSUdORURfQllURSwgaW1nKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9NQUdfRklMVEVSLF9nbC5MSU5FQVIpO1xyXG4gICAgICAgIF9nbC50ZXhQYXJhbWV0ZXJpKF9nbC5URVhUVVJFXzJELF9nbC5URVhUVVJFX01JTl9GSUxURVIsX2dsLkxJTkVBUik7XHJcbiAgICAgICAgX2dsLnRleFBhcmFtZXRlcmkoX2dsLlRFWFRVUkVfMkQsX2dsLlRFWFRVUkVfV1JBUF9TLF9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCxfZ2wuVEVYVFVSRV9XUkFQX1QsX2dsLkNMQU1QX1RPX0VER0UpO1xyXG5cclxuICAgICAgICAvLyDjg5/jg4Pjg5fjg57jg4Pjg5fjgpLnlJ/miJBcclxuICAgICAgICBfZ2wuZ2VuZXJhdGVNaXBtYXAoX2dsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g55Sf5oiQ44GX44Gf44OG44Kv44K544OB44Oj44KS44Kw44Ot44O844OQ44Or5aSJ5pWw44Gr5Luj5YWlXHJcbiAgICAgICAgICAgIHNwaGVyZVRleHR1cmUgPSB0ZXg7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7jgr3jg7zjgrnjgpLmjIflrppcclxuICAgIGltZy5zcmMgPSBfc291cmNlO1xyXG59XHJcbi8vIOODleODrOODvOODoOODkOODg+ODleOCoeOCkuOCquODluOCuOOCp+OCr+ODiOOBqOOBl+OBpueUn+aIkOOBmeOCi+mWouaVsFxyXG5mdW5jdGlvbiBjcmVhdGVfZnJhbWVidWZmZXIoX2dsLF93aWR0aCwgX2hlaWdodCl7XHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjga7nlJ/miJBcclxuICAgIHZhciBmcmFtZUJ1ZmZlciA9IF9nbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpJXZWJHTOOBq+ODkOOCpOODs+ODiVxyXG4gICAgX2dsLmJpbmRGcmFtZWJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsIGZyYW1lQnVmZmVyKTtcclxuICAgIFxyXG4gICAgLy8g5rex5bqm44OQ44OD44OV44Kh55So44Os44Oz44OA44O844OQ44OD44OV44Kh44Gu55Sf5oiQ44Go44OQ44Kk44Oz44OJXHJcbiAgICB2YXIgZGVwdGhSZW5kZXJCdWZmZXIgPSBfZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XHJcbiAgICBfZ2wuYmluZFJlbmRlcmJ1ZmZlcihfZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOODrOODs+ODgOODvOODkOODg+ODleOCoeOCkua3seW6puODkOODg+ODleOCoeOBqOOBl+OBpuioreWumlxyXG4gICAgX2dsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoX2dsLlJFTkRFUkJVRkZFUiwgX2dsLkRFUFRIX0NPTVBPTkVOVDE2LCBfd2lkdGgsIF9oZWlnaHQpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgavjg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqHjgpLplqLpgKPku5jjgZHjgotcclxuICAgIF9nbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihfZ2wuRlJBTUVCVUZGRVIsIF9nbC5ERVBUSF9BVFRBQ0hNRU5ULCBfZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeeUqOODhuOCr+OCueODgeODo+OBrueUn+aIkFxyXG4gICAgdmFyIGZUZXh0dXJlID0gX2dsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh55So44Gu44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJXHJcbiAgICBfZ2wuYmluZFRleHR1cmUoX2dsLlRFWFRVUkVfMkQsIGZUZXh0dXJlKTtcclxuICAgIFxyXG4gICAgLy8g44OV44Os44O844Og44OQ44OD44OV44Kh55So44Gu44OG44Kv44K544OB44Oj44Gr44Kr44Op44O855So44Gu44Oh44Oi44Oq6aCY5Z+f44KS56K65L+dXHJcbiAgICBfZ2wudGV4SW1hZ2UyRChfZ2wuVEVYVFVSRV8yRCwgMCwgX2dsLlJHQkEsIF93aWR0aCwgX2hlaWdodCwgMCwgX2dsLlJHQkEsIF9nbC5VTlNJR05FRF9CWVRFLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g44OG44Kv44K544OB44Oj44OR44Op44Oh44O844K/XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgX2dsLkxJTkVBUik7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgX2dsLkxJTkVBUik7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfV1JBUF9TLCBfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBfZ2wudGV4UGFyYW1ldGVyaShfZ2wuVEVYVFVSRV8yRCwgX2dsLlRFWFRVUkVfV1JBUF9ULCBfZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBcclxuICAgIC8vIOODleODrOODvOODoOODkOODg+ODleOCoeOBq+ODhuOCr+OCueODgeODo+OCkumWoumAo+S7mOOBkeOCi1xyXG4gICAgX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKF9nbC5GUkFNRUJVRkZFUiwgX2dsLkNPTE9SX0FUVEFDSE1FTlQwLCBfZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUsIDApO1xyXG4gICAgXHJcbiAgICAvLyDlkITnqK7jgqrjg5bjgrjjgqfjgq/jg4jjga7jg5DjgqTjg7Pjg4njgpLop6PpmaRcclxuICAgIF9nbC5iaW5kVGV4dHVyZShfZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICBfZ2wuYmluZFJlbmRlcmJ1ZmZlcihfZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcclxuICAgIF9nbC5iaW5kRnJhbWVidWZmZXIoX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcclxuICAgIFxyXG4gICAgLy8g44Kq44OW44K444Kn44Kv44OI44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICByZXR1cm4ge2YgOiBmcmFtZUJ1ZmZlciwgZCA6IGRlcHRoUmVuZGVyQnVmZmVyLCB0IDogZlRleHR1cmV9O1xyXG59XHJcbiJdfQ==
