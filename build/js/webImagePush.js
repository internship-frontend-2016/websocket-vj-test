(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

window.onload = function () {
    var socket = io();
    //サーバーからデータを受け取る
    socket.on("pushImageFromServer", function (data) {
        //    var image = document.getElementById("image");
        console.log(data);
        init(data);
        //    image.src=data;
    });
};

function init(img_data) {
    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;

    console.log("hi");
    // webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    console.log(gl);
    // 頂点シェーダとフラグメントシェーダの生成
    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');

    // プログラムオブジェクトの生成とリンク
    var prg = create_program(v_shader, f_shader);

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
    var vPosition = create_vbo(position);
    var vColor = create_vbo(color);
    var vTextureCoord = create_vbo(textureCoord);
    var VBOList = [vPosition, vColor, vTextureCoord];
    var iIndex = create_ibo(index);

    // VBOとIBOの登録
    set_attribute(VBOList, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);

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
    m.lookAt([0.0, 2.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    // 深度テストを有効にする
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // 有効にするテクスチャユニットを指定
    gl.activeTexture(gl.TEXTURE0);

    // テクスチャ用変数の宣言
    var texture = null;

    // テクスチャを生成
    //    create_texture("../img/test.jpg");
    create_texture(img_data);
    // カウンタの宣言
    var count = 0;
    // 恒常ループ
    (function loop() {
        // canvasを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンタを元にラジアンを算出
        count++;
        var rad = count % 360 * Math.PI / 180;

        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[1], 0);

        // モデル座標変換行列の生成
        m.identity(mMatrix);
        m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        // uniform変数の登録と描画
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        // コンテキストの再描画
        gl.flush();

        // ループのために再帰呼び出し
        //setTimeout(loop, 1000 / 30);
        requestAnimationFrame(loop);
    })();

    // シェーダを生成する関数
    function create_shader(id) {
        // シェーダを格納する変数
        var shader;

        // HTMLからscriptタグへの参照を取得
        var scriptElement = document.getElementById(id);

        // scriptタグが存在しない場合は抜ける
        if (!scriptElement) {
            return;
        }

        // scriptタグのtype属性をチェック
        switch (scriptElement.type) {

            // 頂点シェーダの場合
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;

            // フラグメントシェーダの場合
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default:
                return;
        }

        // 生成されたシェーダにソースを割り当てる
        gl.shaderSource(shader, scriptElement.text);

        // シェーダをコンパイルする
        gl.compileShader(shader);

        // シェーダが正しくコンパイルされたかチェック
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

            // 成功していたらシェーダを返して終了
            return shader;
        } else {

            // 失敗していたらエラーログをアラートする
            alert(gl.getShaderInfoLog(shader));
        }
    }

    // プログラムオブジェクトを生成しシェーダをリンクする関数
    function create_program(vs, fs) {
        // プログラムオブジェクトの生成
        var program = gl.createProgram();

        // プログラムオブジェクトにシェーダを割り当てる
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);

        // シェーダをリンク
        gl.linkProgram(program);

        // シェーダのリンクが正しく行なわれたかチェック
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {

            // 成功していたらプログラムオブジェクトを有効にする
            gl.useProgram(program);

            // プログラムオブジェクトを返して終了
            return program;
        } else {

            // 失敗していたらエラーログをアラートする
            alert(gl.getProgramInfoLog(program));
        }
    }

    // VBOを生成する関数
    function create_vbo(data) {
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
    function set_attribute(vbo, attL, attS) {
        // 引数として受け取った配列を処理する
        for (var i in vbo) {
            // バッファをバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);

            // attributeLocationを有効にする
            gl.enableVertexAttribArray(attL[i]);

            // attributeLocationを通知し登録する
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }

    // IBOを生成する関数
    function create_ibo(data) {
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
    function create_texture(source) {
        // イメージオブジェクトの生成
        var img = new Image();

        // データのオンロードをトリガーにする
        img.onload = function () {
            // テクスチャオブジェクトの生成
            var tex = gl.createTexture();

            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, tex);

            // テクスチャへイメージを適用
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

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
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx3ZWJJbWFnZVB1c2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0NBLE9BQU8sTUFBUCxHQUFjLFlBQVU7QUFDcEIsUUFBSSxTQUFRLElBQVo7QUFDQTtBQUNBLFdBQU8sRUFBUCxDQUFVLHFCQUFWLEVBQWdDLFVBQVMsSUFBVCxFQUFjO0FBQzlDO0FBQ0ksZ0JBQVEsR0FBUixDQUFZLElBQVo7QUFDQSxhQUFLLElBQUw7QUFDSjtBQUNDLEtBTEQ7QUFNSCxDQVREOztBQVdBLFNBQVMsSUFBVCxDQUFjLFFBQWQsRUFBdUI7QUFDbkI7QUFDQSxRQUFJLElBQUksU0FBUyxjQUFULENBQXdCLFFBQXhCLENBQVI7QUFDQSxNQUFFLEtBQUYsR0FBVSxHQUFWO0FBQ0EsTUFBRSxNQUFGLEdBQVcsR0FBWDs7QUFFQSxZQUFRLEdBQVIsQ0FBWSxJQUFaO0FBQ0E7QUFDQSxRQUFJLEtBQUssRUFBRSxVQUFGLENBQWEsT0FBYixLQUF5QixFQUFFLFVBQUYsQ0FBYSxvQkFBYixDQUFsQztBQUNBLFlBQVEsR0FBUixDQUFZLEVBQVo7QUFDQTtBQUNBLFFBQUksV0FBVyxjQUFjLElBQWQsQ0FBZjtBQUNBLFFBQUksV0FBVyxjQUFjLElBQWQsQ0FBZjs7QUFFQTtBQUNBLFFBQUksTUFBTSxlQUFlLFFBQWYsRUFBeUIsUUFBekIsQ0FBVjs7QUFFQTtBQUNBLFFBQUksY0FBYyxJQUFJLEtBQUosRUFBbEI7QUFDQSxnQkFBWSxDQUFaLElBQWlCLEdBQUcsaUJBQUgsQ0FBcUIsR0FBckIsRUFBMEIsVUFBMUIsQ0FBakI7QUFDQSxnQkFBWSxDQUFaLElBQWlCLEdBQUcsaUJBQUgsQ0FBcUIsR0FBckIsRUFBMEIsT0FBMUIsQ0FBakI7QUFDQSxnQkFBWSxDQUFaLElBQWlCLEdBQUcsaUJBQUgsQ0FBcUIsR0FBckIsRUFBMEIsY0FB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QUFULENBQXdCLE1BQXhCLEVBQStCO0FBQzNCO0FBQ0EsWUFBSSxNQUFNLElBQUksS0FBSixFQUFWOztBQUVBO0FBQ0EsWUFBSSxNQUFKLEdBQWEsWUFBVTtBQUNuQjtBQUNBLGdCQUFJLE1BQU0sR0FBRyxhQUFILEVBQVY7O0FBRUE7QUFDQSxlQUFHLFdBQUgsQ0FBZSxHQUFHLFVBQWxCLEVBQThCLEdBQTlCOztBQUVBO0FBQ0EsZUFBRyxVQUFILENBQWMsR0FBRyxVQUFqQixFQUE2QixDQUE3QixFQUFnQyxHQUFHLElBQW5DLEVBQXlDLEdBQUcsSUFBNUMsRUFBa0QsR0FBRyxhQUFyRCxFQUFvRSxHQUFwRTtBQUNKLGVBQUcsYUFBSCxDQUFpQixHQUFHLFVBQXBCLEVBQStCLEdBQUcsa0JBQWxDLEVBQXFELEdBQUcsTUFBeEQ7QUFDQSxlQUFHLGFBQUgsQ0FBaUIsR0FBRyxVQUFwQixFQUErQixHQUFHLGtCQUFsQyxFQUFxRCxHQUFHLE1BQXhEO0FBQ0EsZUFBRyxhQUFILENBQWlCLEdBQUcsVUFBcEIsRUFBK0IsR0FBRyxjQUFsQyxFQUFpRCxHQUFHLGFBQXBEO0FBQ0EsZUFBRyxhQUFILENBQWlCLEdBQUcsVUFBcEIsRUFBK0IsR0FBRyxjQUFsQyxFQUFpRCxHQUFHLGFBQXBEOztBQUdJO0FBQ0EsZUFBRyxjQUFILENBQWtCLEdBQUcsVUFBckI7O0FBRUE7QUFDQSxlQUFHLFdBQUgsQ0FBZSxHQUFHLFVBQWxCLEVBQThCLElBQTlCOztBQUVBO0FBQ0Esc0JBQVUsR0FBVjtBQUNILFNBdkJEOztBQXlCQTtBQUNBLFlBQUksR0FBSixHQUFVLE1BQVY7QUFDSDtBQUVKIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxyXG53aW5kb3cub25sb2FkPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgc29ja2V0ID1pbygpO1xyXG4gICAgLy/jgrXjg7zjg5Djg7zjgYvjgonjg4fjg7zjgr/jgpLlj5fjgZHlj5bjgotcclxuICAgIHNvY2tldC5vbihcInB1c2hJbWFnZUZyb21TZXJ2ZXJcIixmdW5jdGlvbihkYXRhKXtcclxuICAgIC8vICAgIHZhciBpbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW1hZ2VcIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgaW5pdChkYXRhKTtcclxuICAgIC8vICAgIGltYWdlLnNyYz1kYXRhO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXQoaW1nX2RhdGEpe1xyXG4gICAgLy8gY2FudmFz44Ko44Os44Oh44Oz44OI44KS5Y+W5b6XXHJcbiAgICB2YXIgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcclxuICAgIGMud2lkdGggPSA1MDA7XHJcbiAgICBjLmhlaWdodCA9IDMwMDtcclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coXCJoaVwiKTtcclxuICAgIC8vIHdlYmds44Kz44Oz44OG44Kt44K544OI44KS5Y+W5b6XXHJcbiAgICB2YXIgZ2wgPSBjLmdldENvbnRleHQoJ3dlYmdsJykgfHwgYy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcclxuICAgIGNvbnNvbGUubG9nKGdsKTtcclxuICAgIC8vIOmggueCueOCt+OCp+ODvOODgOOBqOODleODqeOCsOODoeODs+ODiOOCt+OCp+ODvOODgOOBrueUn+aIkFxyXG4gICAgdmFyIHZfc2hhZGVyID0gY3JlYXRlX3NoYWRlcigndnMnKTtcclxuICAgIHZhciBmX3NoYWRlciA9IGNyZWF0ZV9zaGFkZXIoJ2ZzJyk7XHJcbiAgICBcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkOOBqOODquODs+OCr1xyXG4gICAgdmFyIHByZyA9IGNyZWF0ZV9wcm9ncmFtKHZfc2hhZGVyLCBmX3NoYWRlcik7XHJcbiAgICBcclxuICAgIC8vIGF0dHJpYnV0ZUxvY2F0aW9u44KS6YWN5YiX44Gr5Y+W5b6XXHJcbiAgICB2YXIgYXR0TG9jYXRpb24gPSBuZXcgQXJyYXkoKTtcclxuICAgIGF0dExvY2F0aW9uWzBdID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAncG9zaXRpb24nKTtcclxuICAgIGF0dExvY2F0aW9uWzFdID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAnY29sb3InKTtcclxuICAgIGF0dExvY2F0aW9uWzJdID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJnLCAndGV4dHVyZUNvb3JkJyk7XHJcbiAgICBcclxuICAgIC8vIGF0dHJpYnV0ZeOBruimgee0oOaVsOOCkumFjeWIl+OBq+agvOe0jVxyXG4gICAgdmFyIGF0dFN0cmlkZSA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0U3RyaWRlWzBdID0gMztcclxuICAgIGF0dFN0cmlkZVsxXSA9IDQ7XHJcbiAgICBhdHRTdHJpZGVbMl0gPSAyO1xyXG4gICAgXHJcbiAgICAvLyDpoILngrnjga7kvY3nva5cclxuICAgIHZhciBwb3NpdGlvbiA9IFtcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMC4wLFxyXG4gICAgICAgICAxLjAsICAxLjAsICAwLjAsXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgIDAuMCxcclxuICAgICAgICAgMS4wLCAtMS4wLCAgMC4wXHJcbiAgICBdO1xyXG4gICAgXHJcbiAgICAvLyDpoILngrnoibJcclxuICAgIHZhciBjb2xvciA9IFtcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjBcclxuICAgIF07XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+W6p+aomVxyXG4gICAgdmFyIHRleHR1cmVDb29yZCA9IFtcclxuICAgICAgICAwLjAsIDAuMCxcclxuICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIFxyXG4gICAgLy8g6aCC54K544Kk44Oz44OH44OD44Kv44K5XHJcbiAgICB2YXIgaW5kZXggPSBbXHJcbiAgICAgICAgMCwgMSwgMixcclxuICAgICAgICAzLCAyLCAxXHJcbiAgICBdO1xyXG4gICAgXHJcbiAgICAvLyBWQk/jgahJQk/jga7nlJ/miJBcclxuICAgIHZhciB2UG9zaXRpb24gICAgID0gY3JlYXRlX3Zibyhwb3NpdGlvbik7XHJcbiAgICB2YXIgdkNvbG9yICAgICAgICA9IGNyZWF0ZV92Ym8oY29sb3IpO1xyXG4gICAgdmFyIHZUZXh0dXJlQ29vcmQgPSBjcmVhdGVfdmJvKHRleHR1cmVDb29yZCk7XHJcbiAgICB2YXIgVkJPTGlzdCAgICAgICA9IFt2UG9zaXRpb24sIHZDb2xvciwgdlRleHR1cmVDb29yZF07XHJcbiAgICB2YXIgaUluZGV4ICAgICAgICA9IGNyZWF0ZV9pYm8oaW5kZXgpO1xyXG4gICAgXHJcbiAgICAvLyBWQk/jgahJQk/jga7nmbvpjLJcclxuICAgIHNldF9hdHRyaWJ1dGUoVkJPTGlzdCwgYXR0TG9jYXRpb24sIGF0dFN0cmlkZSk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpSW5kZXgpO1xyXG4gICAgXHJcbiAgICAvLyB1bmlmb3JtTG9jYXRpb27jgpLphY3liJfjgavlj5blvpdcclxuICAgIHZhciB1bmlMb2NhdGlvbiA9IG5ldyBBcnJheSgpO1xyXG4gICAgdW5pTG9jYXRpb25bMF0gID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ212cE1hdHJpeCcpO1xyXG4gICAgdW5pTG9jYXRpb25bMV0gID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByZywgJ3RleHR1cmUnKTtcclxuICAgIFxyXG4gICAgLy8g5ZCE56iu6KGM5YiX44Gu55Sf5oiQ44Go5Yid5pyf5YyWXHJcbiAgICB2YXIgbSA9IG5ldyBtYXRJVigpO1xyXG4gICAgdmFyIG1NYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdk1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBwTWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHRtcE1hdHJpeCA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgbXZwTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIFxyXG4gICAgLy8g44OT44Ol44O8w5fjg5fjg63jgrjjgqfjgq/jgrfjg6fjg7PluqfmqJnlpInmj5vooYzliJdcclxuICAgIG0ubG9va0F0KFswLjAsIDIuMCwgNS4wXSwgWzAsIDAsIDBdLCBbMCwgMSwgMF0sIHZNYXRyaXgpO1xyXG4gICAgbS5wZXJzcGVjdGl2ZSg0NSwgYy53aWR0aCAvIGMuaGVpZ2h0LCAwLjEsIDEwMCwgcE1hdHJpeCk7XHJcbiAgICBtLm11bHRpcGx5KHBNYXRyaXgsIHZNYXRyaXgsIHRtcE1hdHJpeCk7XHJcbiAgICBcclxuICAgIC8vIOa3seW6puODhuOCueODiOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xyXG4gICAgZ2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XHJcbiAgICBcclxuICAgIC8vIOacieWKueOBq+OBmeOCi+ODhuOCr+OCueODgeODo+ODpuODi+ODg+ODiOOCkuaMh+WumlxyXG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+eUqOWkieaVsOOBruWuo+iogFxyXG4gICAgdmFyIHRleHR1cmUgPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJBcclxuLy8gICAgY3JlYXRlX3RleHR1cmUoXCIuLi9pbWcvdGVzdC5qcGdcIik7XHJcbiAgICBjcmVhdGVfdGV4dHVyZShpbWdfZGF0YSk7XHJcbiAgICAvLyDjgqvjgqbjg7Pjgr/jga7lrqPoqIBcclxuICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAvLyDmgZLluLjjg6vjg7zjg5dcclxuICAgIChmdW5jdGlvbiBsb29wKCl7XHJcbiAgICAgICAgLy8gY2FudmFz44KS5Yid5pyf5YyWXHJcbiAgICAgICAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApO1xyXG4gICAgICAgIGdsLmNsZWFyRGVwdGgoMS4wKTtcclxuICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44Kr44Km44Oz44K/44KS5YWD44Gr44Op44K444Ki44Oz44KS566X5Ye6XHJcbiAgICAgICAgY291bnQrKztcclxuICAgICAgICB2YXIgcmFkID0gKGNvdW50ICUgMzYwKSAqIE1hdGguUEkgLyAxODA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OG44Kv44K544OB44Oj44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdW5pZm9ybeWkieaVsOOBq+ODhuOCr+OCueODgeODo+OCkueZu+mMslxyXG4gICAgICAgIGdsLnVuaWZvcm0xaSh1bmlMb2NhdGlvblsxXSwgMCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44Oi44OH44Or5bqn5qiZ5aSJ5o+b6KGM5YiX44Gu55Sf5oiQXHJcbiAgICAgICAgbS5pZGVudGl0eShtTWF0cml4KTtcclxuICAgICAgICBtLnJvdGF0ZShtTWF0cml4LCByYWQsIFswLCAxLCAwXSwgbU1hdHJpeCk7XHJcbiAgICAgICAgbS5tdWx0aXBseSh0bXBNYXRyaXgsIG1NYXRyaXgsIG12cE1hdHJpeCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdW5pZm9ybeWkieaVsOOBrueZu+mMsuOBqOaPj+eUu1xyXG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYodW5pTG9jYXRpb25bMF0sIGZhbHNlLCBtdnBNYXRyaXgpO1xyXG4gICAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsIGluZGV4Lmxlbmd0aCwgZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOOCs+ODs+ODhuOCreOCueODiOOBruWGjeaPj+eUu1xyXG4gICAgICAgIGdsLmZsdXNoKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44Or44O844OX44Gu44Gf44KB44Gr5YaN5biw5ZG844Gz5Ye644GXXHJcbiAgICAgICAgLy9zZXRUaW1lb3V0KGxvb3AsIDEwMDAgLyAzMCk7XHJcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xyXG4gICAgfSkoKTtcclxuICAgIFxyXG4gICAgLy8g44K344Kn44O844OA44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVfc2hhZGVyKGlkKXtcclxuICAgICAgICAvLyDjgrfjgqfjg7zjg4DjgpLmoLzntI3jgZnjgovlpInmlbBcclxuICAgICAgICB2YXIgc2hhZGVyO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEhUTUzjgYvjgolzY3JpcHTjgr/jgrDjgbjjga7lj4LnhafjgpLlj5blvpdcclxuICAgICAgICB2YXIgc2NyaXB0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBzY3JpcHTjgr/jgrDjgYzlrZjlnKjjgZfjgarjgYTloLTlkIjjga/mipzjgZHjgotcclxuICAgICAgICBpZighc2NyaXB0RWxlbWVudCl7cmV0dXJuO31cclxuICAgICAgICBcclxuICAgICAgICAvLyBzY3JpcHTjgr/jgrDjga50eXBl5bGe5oCn44KS44OB44Kn44OD44KvXHJcbiAgICAgICAgc3dpdGNoKHNjcmlwdEVsZW1lbnQudHlwZSl7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyDpoILngrnjgrfjgqfjg7zjg4Djga7loLTlkIhcclxuICAgICAgICAgICAgY2FzZSAneC1zaGFkZXIveC12ZXJ0ZXgnOlxyXG4gICAgICAgICAgICAgICAgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g44OV44Op44Kw44Oh44Oz44OI44K344Kn44O844OA44Gu5aC05ZCIXHJcbiAgICAgICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOlxyXG4gICAgICAgICAgICAgICAgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOeUn+aIkOOBleOCjOOBn+OCt+OCp+ODvOODgOOBq+OCveODvOOCueOCkuWJsuOCiuW9k+OBpuOCi1xyXG4gICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNjcmlwdEVsZW1lbnQudGV4dCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44K344Kn44O844OA44KS44Kz44Oz44OR44Kk44Or44GZ44KLXHJcbiAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOOCt+OCp+ODvOODgOOBjOato+OBl+OBj+OCs+ODs+ODkeOCpOODq+OBleOCjOOBn+OBi+ODgeOCp+ODg+OCr1xyXG4gICAgICAgIGlmKGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSl7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjgrfjgqfjg7zjg4DjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICAgICAgcmV0dXJuIHNoYWRlcjtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOWkseaVl+OBl+OBpuOBhOOBn+OCieOCqOODqeODvOODreOCsOOCkuOCouODqeODvOODiOOBmeOCi1xyXG4gICAgICAgICAgICBhbGVydChnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GX44K344Kn44O844OA44KS44Oq44Oz44Kv44GZ44KL6Zai5pWwXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVfcHJvZ3JhbSh2cywgZnMpe1xyXG4gICAgICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOBq+OCt+OCp+ODvOODgOOCkuWJsuOCiuW9k+OBpuOCi1xyXG4gICAgICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cyk7XHJcbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjgrfjgqfjg7zjg4DjgpLjg6rjg7Pjgq9cclxuICAgICAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjgrfjgqfjg7zjg4Djga7jg6rjg7Pjgq/jgYzmraPjgZfjgY/ooYzjgarjgo/jgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgICAgICBpZihnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOaIkOWKn+OBl+OBpuOBhOOBn+OCieODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkuacieWKueOBq+OBmeOCi1xyXG4gICAgICAgICAgICBnbC51c2VQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgICAgIHJldHVybiBwcm9ncmFtO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g5aSx5pWX44GX44Gm44GE44Gf44KJ44Ko44Op44O844Ot44Kw44KS44Ki44Op44O844OI44GZ44KLXHJcbiAgICAgICAgICAgIGFsZXJ0KGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFZCT+OCkueUn+aIkOOBmeOCi+mWouaVsFxyXG4gICAgZnVuY3Rpb24gY3JlYXRlX3ZibyhkYXRhKXtcclxuICAgICAgICAvLyDjg5Djg4Pjg5XjgqHjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgICAgICB2YXIgdmJvID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZibyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44Gr44OH44O844K/44KS44K744OD44OIXHJcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoZGF0YSksIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbnVsbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g55Sf5oiQ44GX44GfIFZCTyDjgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gdmJvO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBWQk/jgpLjg5DjgqTjg7Pjg4njgZfnmbvpjLLjgZnjgovplqLmlbBcclxuICAgIGZ1bmN0aW9uIHNldF9hdHRyaWJ1dGUodmJvLCBhdHRMLCBhdHRTKXtcclxuICAgICAgICAvLyDlvJXmlbDjgajjgZfjgablj5fjgZHlj5bjgaPjgZ/phY3liJfjgpLlh6bnkIbjgZnjgotcclxuICAgICAgICBmb3IodmFyIGkgaW4gdmJvKXtcclxuICAgICAgICAgICAgLy8g44OQ44OD44OV44Kh44KS44OQ44Kk44Oz44OJ44GZ44KLXHJcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2Ym9baV0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLmnInlirnjgavjgZnjgotcclxuICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoYXR0TFtpXSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBhdHRyaWJ1dGVMb2NhdGlvbuOCkumAmuefpeOBl+eZu+mMsuOBmeOCi1xyXG4gICAgICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGF0dExbaV0sIGF0dFNbaV0sIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBJQk/jgpLnlJ/miJDjgZnjgovplqLmlbBcclxuICAgIGZ1bmN0aW9uIGNyZWF0ZV9pYm8oZGF0YSl7XHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgdmFyIGlibyA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44Gr44OH44O844K/44KS44K744OD44OIXHJcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IEludDE2QXJyYXkoZGF0YSksIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg5Djg4Pjg5XjgqHjga7jg5DjgqTjg7Pjg4njgpLnhKHlirnljJZcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDnlJ/miJDjgZfjgZ9JQk/jgpLov5TjgZfjgabntYLkuoZcclxuICAgICAgICByZXR1cm4gaWJvO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJDjgZnjgovplqLmlbBcclxuICAgIGZ1bmN0aW9uIGNyZWF0ZV90ZXh0dXJlKHNvdXJjZSl7XHJcbiAgICAgICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODh+ODvOOCv+OBruOCquODs+ODreODvOODieOCkuODiOODquOCrOODvOOBq+OBmeOCi1xyXG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6Pjgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgICAgICAgICAgdmFyIHRleCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g44OG44Kv44K544OB44Oj44G444Kk44Oh44O844K444KS6YGp55SoXHJcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1nKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsZ2wuVEVYVFVSRV9NQUdfRklMVEVSLGdsLkxJTkVBUik7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELGdsLlRFWFRVUkVfTUlOX0ZJTFRFUixnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCxnbC5URVhUVVJFX1dSQVBfUyxnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsZ2wuVEVYVFVSRV9XUkFQX1QsZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8g44Of44OD44OX44Oe44OD44OX44KS55Sf5oiQXHJcbiAgICAgICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g55Sf5oiQ44GX44Gf44OG44Kv44K544OB44Oj44KS44Kw44Ot44O844OQ44Or5aSJ5pWw44Gr5Luj5YWlXHJcbiAgICAgICAgICAgIHRleHR1cmUgPSB0ZXg7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjgqTjg6Hjg7zjgrjjgqrjg5bjgrjjgqfjgq/jg4jjga7jgr3jg7zjgrnjgpLmjIflrppcclxuICAgICAgICBpbWcuc3JjID0gc291cmNlO1xyXG4gICAgfVxyXG4gICAgXHJcbn07Il19
