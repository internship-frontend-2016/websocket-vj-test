(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.onload = function () {
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
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
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
    create_texture("../img/test.jpg");
    //create_texture(img_data);
    // カウンタの宣言
    var count = 0;
    var speed = -105;

    // 恒常ループ
    (function loop() {
        // canvasを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンタを元にラジアンを算出
        //console.log(speed);
        if (speed == 7) {
            speed = -105;
        }
        speed += 0.5;
        count++;
        var rad = count % 360 * Math.PI / 180;

        // モデル座標変換行列の生成
        m.identity(mMatrix);
        m.translate(mMatrix, [0, 0, speed], mMatrix);
        m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        // uniform変数の登録と描画

        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[1], 0);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        m.identity(mMatrix);
        m.translate(mMatrix, [0, 0, speed + 100], mMatrix);
        m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        // uniform変数の登録と描画

        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[1], 0);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx3ZWJnbFRlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE9BQU8sTUFBUCxHQUFjLFlBQVU7QUFDcEI7QUFDQSxRQUFJLElBQUksU0FBUyxjQUFULENBQXdCLFFBQXhCLENBQVI7QUFDQSxNQUFFLEtBQUYsR0FBVSxHQUFWO0FBQ0EsTUFBRSxNQUFGLEdBQVcsR0FBWDs7QUFFQSxZQUFRLEdBQVIsQ0FBWSxJQUFaO0FBQ0E7QUFDQSxRQUFJLEtBQUssRUFBRSxVQUFGLENBQWEsT0FBYixLQUF5QixFQUFFLFVBQUYsQ0FBYSxvQkFBYixDQUFsQztBQUNBLFlBQVEsR0FBUixDQUFZLEVBQVo7QUFDQTtBQUNBLFFBQUksV0FBVyxjQUFjLElBQWQsQ0FBZjtBQUNBLFFBQUksV0FBVyxjQUFjLElBQWQsQ0FBZjs7QUFFQTtBQUNBLFFBQUksTUFBTSxlQUFlLFFBQWYsRUFBeUIsUUFBekIsQ0FBVjs7QUFFQTtBQUNBLFFBQUksY0FBYyxJQUFJLEtBQUosRUFBbEI7QUFDQSxnQkFBWSxDQUFaLElBQWlCLEdBQUcsaUJBQUgsQ0FBcUIsR0FBckIsRUFBMEIsVUFBMUIsQ0FBakI7QUFDQSxnQkFBWSxDQUFaLElBQWlCLEdBQUcsaUJBQUgsQ0FBcUIsR0FBckIsRUFBMEIsT0FBMUIsQ0FBakI7QUFDQSxnQkFBWSxDQUFaLElBQWlCLEdBQUcsaUJBQUgsQ0FBcUIsR0FBckIsRUFBMEIsY0FBMUIsQ0FBakI7O0FBRUE7QUFDQSxRQUFJLFlBQVksSUFBSSxLQUFKLEVBQWhCO0FBQ0EsY0FBVSxDQUFWLElBQWUsQ0FBZjtBQUNBLGNBQVUsQ0FBVixJQUFlLENBQWY7QUFDQSxjQUFVLENBQVYsSUFBZSxDQUFmOztBQUVBO0FBQ0EsUUFBSSxXQUFXLENBQ1gsQ0FBQyxHQURVLEVBQ0osR0FESSxFQUNFLEdBREYsRUFFVixHQUZVLEVBRUosR0FGSSxFQUVFLEdBRkYsRUFHWCxDQUFDLEdBSFUsRUFHTCxDQUFDLEdBSEksRUFHRSxHQUhGLEVBSVYsR0FKVSxFQUlMLENBQUMsR0FKSSxFQUlFLEdBSkYsQ0FBZjs7QUFPQTtBQUNBLFFBQUksUUFBUSxDQUNSLEdBRFEsRUFDSCxHQURHLEVBQ0UsR0FERixFQUNPLEdBRFAsRUFFUixHQUZRLEVBRUgsR0FGRyxFQUVFLEdBRkYsRUFFTyxHQUZQLEVBR1IsR0FIUSxFQUdILEdBSEcsRUFHRSxHQUhGLEVBR08sR0FIUCxFQUlSLEdBSlEsRUFJSCxHQUpHLEVBSUUsR0FKRixFQUlPLEdBSlAsQ0FBWjs7QUFPQTtBQUNBLFFBQUksZUFBZSxDQUNmLEdBRGUsRUFDVixHQURVLEVBRWYsR0FGZSxFQUVWLEdBRlUsRUFHZixHQUhlLEVBR1YsR0FIVSxFQUlmLEdBSmUsRUFJVixHQUpVLENBQW5COztBQU9BO0FBQ0EsUUFBSSxRQUFRLENBQ1IsQ0FEUSxFQUNMLENBREssRUFDRixDQURFLEVBRVIsQ0FGUSxFQUVMLENBRkssRUFFRixDQUZFLENBQVo7O0FBS0E7QUFDQSxRQUFJLFlBQWdCLFdBQVcsUUFBWCxDQUFwQjtBQUNBLFFBQUksU0FBZ0IsV0FBVyxLQUFYLENBQXBCO0FBQ0EsUUFBSSxnQkFBZ0IsV0FBVyxZQUFYLENBQXBCO0FBQ0EsUUFBSSxVQUFnQixDQUFDLFNBQUQsRUFBWSxNQUFaLEVBQW9CLGFBQXBCLENBQXBCO0FBQ0EsUUFBSSxTQUFnQixXQUFXLEtBQVgsQ0FBcEI7O0FBRUE7QUFDQSxrQkFBYyxPQUFkLEVBQXVCLFdBQXZCLEVBQW9DLFNBQXBDO0FBQ0EsT0FBRyxVQUFILENBQWMsR0FBRyxvQkFBakIsRUFBdUMsTUFBdkM7O0FBRUE7QUFDQSxRQUFJLGNBQWMsSUFBSSxLQUFKLEVBQWxCO0FBQ0EsZ0JBQVksQ0FBWixJQUFrQixHQUFHLGtCQUFILENBQXNCLEdBQXRCLEVBQTJCLFdBQTNCLENBQWxCO0FBQ0EsZ0JBQVksQ0FBWixJQUFrQixHQUFHLGtCQUFILENBQXNCLEdBQXRCLEVBQTJCLFNBQTNCLENBQWxCOztBQUVBO0FBQ0EsUUFBSSxJQUFJLElBQUksS0FBSixFQUFSO0FBQ0EsUUFBSSxVQUFZLEVBQUUsUUFBRixDQUFXLEVBQUUsTUFBRixFQUFYLENBQWhCO0FBQ0EsUUFBSSxVQUFZLEVBQUUsUUFBRixDQUFXLEVBQUUsTUFBRixFQUFYLENBQWhCO0FBQ0EsUUFBSSxVQUFZLEVBQUUsUUFBRixDQUFXLEVBQUUsTUFBRixFQUFYLENBQWhCO0FBQ0EsUUFBSSxZQUFZLEVBQUUsUUFBRixDQUFXLEVBQUUsTUFBRixFQUFYLENBQWhCO0FBQ0EsUUFBSSxZQUFZLEVBQUUsUUFBRixDQUFXLEVBQUUsTUFBRixFQUFYLENBQWhCOztBQUVBO0FBQ0EsTUFBRSxNQUFGLENBQVMsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsQ0FBVCxFQUEwQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUExQixFQUFxQyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUFyQyxFQUFnRCxPQUFoRDtBQUNBLE1BQUUsV0FBRixDQUFjLEVBQWQsRUFBa0IsRUFBRSxLQUFGLEdBQVUsRUFBRSxNQUE5QixFQUFzQyxHQUF0QyxFQUEyQyxHQUEzQyxFQUFnRCxPQUFoRDtBQUNBLE1BQUUsUUFBRixDQUFXLE9BQVgsRUFBb0IsT0FBcEIsRUFBNkIsU0FBN0I7O0FBRUE7QUFDQSxPQUFHLE1BQUgsQ0FBVSxHQUFHLFVBQWI7QUFDQSxPQUFHLFNBQUgsQ0FBYSxHQUFHLE1BQWhCOztBQUVBO0FBQ0EsT0FBRyxhQUFILENBQWlCLEdBQUcsUUFBcEI7O0FBRUE7QUFDQSxRQUFJLFVBQVUsSUFBZDs7QUFFQTtBQUNBLG1CQUFlLGlCQUFmO0FBQ0E7QUFDQTtBQUNBLFFBQUksUUFBUSxDQUFaO0FBQ0EsUUFBSSxRQUFNLENBQUMsR0FBWDs7QUFHQTtBQUNBLEtBQUMsU0FBUyxJQUFULEdBQWU7QUFDWjtBQUNBLFdBQUcsVUFBSCxDQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0IsR0FBeEIsRUFBNkIsR0FBN0I7QUFDQSxXQUFHLFVBQUgsQ0FBYyxHQUFkO0FBQ0EsV0FBRyxLQUFILENBQVMsR0FBRyxnQkFBSCxHQUFzQixHQUFHLGdCQUFsQzs7QUFFQTtBQUNBO0FBQ0EsWUFBRyxTQUFPLENBQVYsRUFBWTtBQUFDLG9CQUFNLENBQUMsR0FBUDtBQUFZO0FBQ3pCLGlCQUFPLEdBQVA7QUFDQTtBQUNBLFlBQUksTUFBTyxRQUFRLEdBQVQsR0FBZ0IsS0FBSyxFQUFyQixHQUEwQixHQUFwQzs7QUFFQTtBQUNBLFVBQUUsUUFBRixDQUFXLE9BQVg7QUFDQSxVQUFFLFNBQUYsQ0FBWSxPQUFaLEVBQW9CLENBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxLQUFMLENBQXBCLEVBQWdDLE9BQWhDO0FBQ0EsVUFBRSxNQUFGLENBQVMsT0FBVCxFQUFrQixHQUFsQixFQUF1QixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUF2QixFQUFrQyxPQUFsQztBQUNBLFVBQUUsUUFBRixDQUFXLFNBQVgsRUFBc0IsT0FBdEIsRUFBK0IsU0FBL0I7O0FBRUE7O0FBRUE7QUFDQSxXQUFHLFdBQUgsQ0FBZSxHQUFHLFVBQWxCLEVBQThCLE9BQTlCOztBQUVBO0FBQ0EsV0FBRyxTQUFILENBQWEsWUFBWSxDQUFaLENBQWIsRUFBNkIsQ0FBN0I7O0FBRUEsV0FBRyxnQkFBSCxDQUFvQixZQUFZLENBQVosQ0FBcEIsRUFBb0MsS0FBcEMsRUFBMkMsU0FBM0M7QUFDQSxXQUFHLFlBQUgsQ0FBZ0IsR0FBRyxTQUFuQixFQUE4QixNQUFNLE1BQXBDLEVBQTRDLEdBQUcsY0FBL0MsRUFBK0QsQ0FBL0Q7O0FBRUEsVUFBRSxRQUFGLENBQVcsT0FBWDtBQUNBLFVBQUUsU0FBRixDQUFZLE9BQVosRUFBb0IsQ0FBQyxDQUFELEVBQUcsQ0FBSCxFQUFLLFFBQU0sR0FBWCxDQUFwQixFQUFvQyxPQUFwQztBQUNBLFVBQUUsTUFBRixDQUFTLE9BQVQsRUFBa0IsR0FBbEIsRUFBdUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FBdkIsRUFBa0MsT0FBbEM7QUFDQSxVQUFFLFFBQUYsQ0FBVyxTQUFYLEVBQXNCLE9BQXRCLEVBQStCLFNBQS9COztBQUVBOztBQUVBO0FBQ0EsV0FBRyxXQUFILENBQWUsR0FBRyxVQUFsQixFQUE4QixPQUE5Qjs7QUFFQTtBQUNBLFdBQUcsU0FBSCxDQUFhLFlBQVksQ0FBWixDQUFiLEVBQTZCLENBQTdCOztBQUVBLFdBQUcsZ0JBQUgsQ0FBb0IsWUFBWSxDQUFaLENBQXBCLEVBQW9DLEtBQXBDLEVBQTJDLFNBQTNDO0FBQ0EsV0FBRyxZQUFILENBQWdCLEdBQUcsU0FBbkIsRUFBOEIsTUFBTSxNQUFwQyxFQUE0QyxHQUFHLGNBQS9DLEVBQStELENBQS9EOztBQUVBO0FBQ0EsV0FBRyxLQUFIOztBQUVBO0FBQ0E7QUFDQSw4QkFBc0IsSUFBdEI7QUFDSCxLQXBERDs7QUFzREE7QUFDQSxhQUFTLGFBQVQsQ0FBdUIsRUFBdkIsRUFBMEI7QUFDdEI7QUFDQSxZQUFJLE1BQUo7O0FBRUE7QUFDQSxZQUFJLGdCQUFnQixTQUFTLGNBQVQsQ0FBd0IsRUFBeEIsQ0FBcEI7O0FBRUE7QUFDQSxZQUFHLENBQUMsYUFBSixFQUFrQjtBQUFDO0FBQVE7O0FBRTNCO0FBQ0EsZ0JBQU8sY0FBYyxJQUFyQjs7QUFFSTtBQUNBLGlCQUFLLG1CQUFMO0FBQ0kseUJBQVMsR0FBRyxZQUFILENBQWdCLEdBQUcsYUFBbkIsQ0FBVDtBQUNBOztBQUVKO0FBQ0EsaUJBQUsscUJBQUw7QUFDSSx5QkFBUyxHQUFHLFlBQUgsQ0FBZ0IsR0FBRyxlQUFuQixDQUFUO0FBQ0E7QUFDSjtBQUNJO0FBWlI7O0FBZUE7QUFDQSxXQUFHLFlBQUgsQ0FBZ0IsTUFBaEIsRUFBd0IsY0FBYyxJQUF0Qzs7QUFFQTtBQUNBLFdBQUcsYUFBSCxDQUFpQixNQUFqQjs7QUFFQTtBQUNBLFlBQUcsR0FBRyxrQkFBSCxDQUFzQixNQUF0QixFQUE4QixHQUFHLGNBQWpDLENBQUgsRUFBb0Q7O0FBRWhEO0FBQ0EsbUJBQU8sTUFBUDtBQUNILFNBSkQsTUFJSzs7QUFFRDtBQUNBLGtCQUFNLEdBQUcsZ0JBQUgsQ0FBb0IsTUFBcEIsQ0FBTjtBQUNIO0FBQ0o7O0FBRUQ7QUFDQSxhQUFTLGNBQVQsQ0FBd0IsRUFBeEIsRUFBNEIsRUFBNUIsRUFBK0I7QUFDM0I7QUFDQSxZQUFJLFVBQVUsR0FBRyxhQUFILEVBQWQ7O0FBRUE7QUFDQSxXQUFHLFlBQUgsQ0FBZ0IsT0FBaEIsRUFBeUIsRUFBekI7QUFDQSxXQUFHLFlBQUgsQ0FBZ0IsT0FBaEIsRUFBeUIsRUFBekI7O0FBRUE7QUFDQSxXQUFHLFdBQUgsQ0FBZSxPQUFmOztBQUVBO0FBQ0EsWUFBRyxHQUFHLG1CQUFILENBQXVCLE9BQXZCLEVBQWdDLEdBQUcsV0FBbkMsQ0FBSCxFQUFtRDs7QUFFL0M7QUFDQSxlQUFHLFVBQUgsQ0FBYyxPQUFkOztBQUVBO0FBQ0EsbUJBQU8sT0FBUDtBQUNILFNBUEQsTUFPSzs7QUFFRDtBQUNBLGtCQUFNLEdBQUcsaUJBQUgsQ0FBcUIsT0FBckIsQ0FBTjtBQUNIO0FBQ0o7O0FBRUQ7QUFDQSxhQUFTLFVBQVQsQ0FBb0IsSUFBcEIsRUFBeUI7QUFDckI7QUFDQSxZQUFJLE1BQU0sR0FBRyxZQUFILEVBQVY7O0FBRUE7QUFDQSxXQUFHLFVBQUgsQ0FBYyxHQUFHLFlBQWpCLEVBQStCLEdBQS9COztBQUVBO0FBQ0EsV0FBRyxVQUFILENBQWMsR0FBRyxZQUFqQixFQUErQixJQUFJLFlBQUosQ0FBaUIsSUFBakIsQ0FBL0IsRUFBdUQsR0FBRyxXQUExRDs7QUFFQTtBQUNBLFdBQUcsVUFBSCxDQUFjLEdBQUcsWUFBakIsRUFBK0IsSUFBL0I7O0FBRUE7QUFDQSxlQUFPLEdBQVA7QUFDSDs7QUFFRDtBQUNBLGFBQVMsYUFBVCxDQUF1QixHQUF2QixFQUE0QixJQUE1QixFQUFrQyxJQUFsQyxFQUF1QztBQUNuQztBQUNBLGFBQUksSUFBSSxDQUFSLElBQWEsR0FBYixFQUFpQjtBQUNiO0FBQ0EsZUFBRyxVQUFILENBQWMsR0FBRyxZQUFqQixFQUErQixJQUFJLENBQUosQ0FBL0I7O0FBRUE7QUFDQSxlQUFHLHVCQUFILENBQTJCLEtBQUssQ0FBTCxDQUEzQjs7QUFFQTtBQUNBLGVBQUcsbUJBQUgsQ0FBdUIsS0FBSyxDQUFMLENBQXZCLEVBQWdDLEtBQUssQ0FBTCxDQUFoQyxFQUF5QyxHQUFHLEtBQTVDLEVBQW1ELEtBQW5ELEVBQTBELENBQTFELEVBQTZELENBQTdEO0FBQ0g7QUFDSjs7QUFFRDtBQUNBLGFBQVMsVUFBVCxDQUFvQixJQUFwQixFQUF5QjtBQUNyQjtBQUNBLFlBQUksTUFBTSxHQUFHLFlBQUgsRUFBVjs7QUFFQTtBQUNBLFdBQUcsVUFBSCxDQUFjLEdBQUcsb0JBQWpCLEVBQXVDLEdBQXZDOztBQUVBO0FBQ0EsV0FBRyxVQUFILENBQWMsR0FBRyxvQkFBakIsRUFBdUMsSUFBSSxVQUFKLENBQWUsSUFBZixDQUF2QyxFQUE2RCxHQUFHLFdBQWhFOztBQUVBO0FBQ0EsV0FBRyxVQUFILENBQWMsR0FBRyxvQkFBakIsRUFBdUMsSUFBdkM7O0FBRUE7QUFDQSxlQUFPLEdBQVA7QUFDSDs7QUFFRDtBQUNBLGFBQVMsY0FBVCxDQUF3QixNQUF4QixFQUErQjtBQUMzQjtBQUNBLFlBQUksTUFBTSxJQUFJLEtBQUosRUFBVjs7QUFFQTtBQUNBLFlBQUksTUFBSixHQUFhLFlBQVU7QUFDbkI7QUFDQSxnQkFBSSxNQUFNLEdBQUcsYUFBSCxFQUFWOztBQUVBO0FBQ0EsZUFBRyxXQUFILENBQWUsR0FBRyxVQUFsQixFQUE4QixHQUE5Qjs7QUFFQTtBQUNBLGVBQUcsVUFBSCxDQUFjLEdBQUcsVUFBakIsRUFBNkIsQ0FBN0IsRUFBZ0MsR0FBRyxJQUFuQyxFQUF5QyxHQUFHLElBQTVDLEVBQWtELEdBQUcsYUFBckQsRUFBb0UsR0FBcEU7QUFDSixlQUFHLGFBQUgsQ0FBaUIsR0FBRyxVQUFwQixFQUErQixHQUFHLGtCQUFsQyxFQUFxRCxHQUFHLE1BQXhEO0FBQ0EsZUFBRyxhQUFILENBQWlCLEdBQUcsVUFBcEIsRUFBK0IsR0FBRyxrQkFBbEMsRUFBcUQsR0FBRyxNQUF4RDtBQUNBLGVBQUcsYUFBSCxDQUFpQixHQUFHLFVBQXBCLEVBQStCLEdBQUcsY0FBbEMsRUFBaUQsR0FBRyxhQUFwRDtBQUNBLGVBQUcsYUFBSCxDQUFpQixHQUFHLFVBQXBCLEVBQStCLEdBQUcsY0FBbEMsRUFBaUQsR0FBRyxhQUFwRDs7QUFHSTtBQUNBLGVBQUcsY0FBSCxDQUFrQixHQUFHLFVBQXJCOztBQUVBO0FBQ0EsZUFBRyxXQUFILENBQWUsR0FBRyxVQUFsQixFQUE4QixJQUE5Qjs7QUFFQTtBQUNBLHNCQUFVLEdBQVY7QUFDSCxTQXZCRDs7QUF5QkE7QUFDQSxZQUFJLEdBQUosR0FBVSxNQUFWO0FBQ0g7QUFFSixDQS9URCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ3aW5kb3cub25sb2FkPWZ1bmN0aW9uKCl7XHJcbiAgICAvLyBjYW52YXPjgqjjg6zjg6Hjg7Pjg4jjgpLlj5blvpdcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xyXG4gICAgYy53aWR0aCA9IDUwMDtcclxuICAgIGMuaGVpZ2h0ID0gMzAwO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhcImhpXCIpO1xyXG4gICAgLy8gd2ViZ2zjgrPjg7Pjg4bjgq3jgrnjg4jjgpLlj5blvpdcclxuICAgIHZhciBnbCA9IGMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fCBjLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpO1xyXG4gICAgY29uc29sZS5sb2coZ2wpO1xyXG4gICAgLy8g6aCC54K544K344Kn44O844OA44Go44OV44Op44Kw44Oh44Oz44OI44K344Kn44O844OA44Gu55Sf5oiQXHJcbiAgICB2YXIgdl9zaGFkZXIgPSBjcmVhdGVfc2hhZGVyKCd2cycpO1xyXG4gICAgdmFyIGZfc2hhZGVyID0gY3JlYXRlX3NoYWRlcignZnMnKTtcclxuICAgIFxyXG4gICAgLy8g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQ44Go44Oq44Oz44KvXHJcbiAgICB2YXIgcHJnID0gY3JlYXRlX3Byb2dyYW0odl9zaGFkZXIsIGZfc2hhZGVyKTtcclxuICAgIFxyXG4gICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLphY3liJfjgavlj5blvpdcclxuICAgIHZhciBhdHRMb2NhdGlvbiA9IG5ldyBBcnJheSgpO1xyXG4gICAgYXR0TG9jYXRpb25bMF0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdwb3NpdGlvbicpO1xyXG4gICAgYXR0TG9jYXRpb25bMV0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICdjb2xvcicpO1xyXG4gICAgYXR0TG9jYXRpb25bMl0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmcsICd0ZXh0dXJlQ29vcmQnKTtcclxuICAgIFxyXG4gICAgLy8gYXR0cmlidXRl44Gu6KaB57Sg5pWw44KS6YWN5YiX44Gr5qC857SNXHJcbiAgICB2YXIgYXR0U3RyaWRlID0gbmV3IEFycmF5KCk7XHJcbiAgICBhdHRTdHJpZGVbMF0gPSAzO1xyXG4gICAgYXR0U3RyaWRlWzFdID0gNDtcclxuICAgIGF0dFN0cmlkZVsyXSA9IDI7XHJcbiAgICBcclxuICAgIC8vIOmggueCueOBruS9jee9rlxyXG4gICAgdmFyIHBvc2l0aW9uID0gW1xyXG4gICAgICAgIC0xLjAsICAxLjAsICAwLjAsXHJcbiAgICAgICAgIDEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMC4wLFxyXG4gICAgICAgICAxLjAsIC0xLjAsICAwLjBcclxuICAgIF07XHJcbiAgICBcclxuICAgIC8vIOmggueCueiJslxyXG4gICAgdmFyIGNvbG9yID0gW1xyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wLCAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIFxyXG4gICAgLy8g44OG44Kv44K544OB44Oj5bqn5qiZXHJcbiAgICB2YXIgdGV4dHVyZUNvb3JkID0gW1xyXG4gICAgICAgIDAuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgMC4wLFxyXG4gICAgICAgIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgMS4wXHJcbiAgICBdO1xyXG4gICAgXHJcbiAgICAvLyDpoILngrnjgqTjg7Pjg4fjg4Pjgq/jgrlcclxuICAgIHZhciBpbmRleCA9IFtcclxuICAgICAgICAwLCAxLCAyLFxyXG4gICAgICAgIDMsIDIsIDFcclxuICAgIF07XHJcbiAgICBcclxuICAgIC8vIFZCT+OBqElCT+OBrueUn+aIkFxyXG4gICAgdmFyIHZQb3NpdGlvbiAgICAgPSBjcmVhdGVfdmJvKHBvc2l0aW9uKTtcclxuICAgIHZhciB2Q29sb3IgICAgICAgID0gY3JlYXRlX3Zibyhjb2xvcik7XHJcbiAgICB2YXIgdlRleHR1cmVDb29yZCA9IGNyZWF0ZV92Ym8odGV4dHVyZUNvb3JkKTtcclxuICAgIHZhciBWQk9MaXN0ICAgICAgID0gW3ZQb3NpdGlvbiwgdkNvbG9yLCB2VGV4dHVyZUNvb3JkXTtcclxuICAgIHZhciBpSW5kZXggICAgICAgID0gY3JlYXRlX2libyhpbmRleCk7XHJcbiAgICBcclxuICAgIC8vIFZCT+OBqElCT+OBrueZu+mMslxyXG4gICAgc2V0X2F0dHJpYnV0ZShWQk9MaXN0LCBhdHRMb2NhdGlvbiwgYXR0U3RyaWRlKTtcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlJbmRleCk7XHJcbiAgICBcclxuICAgIC8vIHVuaWZvcm1Mb2NhdGlvbuOCkumFjeWIl+OBq+WPluW+l1xyXG4gICAgdmFyIHVuaUxvY2F0aW9uID0gbmV3IEFycmF5KCk7XHJcbiAgICB1bmlMb2NhdGlvblswXSAgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAnbXZwTWF0cml4Jyk7XHJcbiAgICB1bmlMb2NhdGlvblsxXSAgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJnLCAndGV4dHVyZScpO1xyXG4gICAgXHJcbiAgICAvLyDlkITnqK7ooYzliJfjga7nlJ/miJDjgajliJ3mnJ/ljJZcclxuICAgIHZhciBtID0gbmV3IG1hdElWKCk7XHJcbiAgICB2YXIgbU1hdHJpeCAgID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciB2TWF0cml4ICAgPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgdmFyIHBNYXRyaXggICA9IG0uaWRlbnRpdHkobS5jcmVhdGUoKSk7XHJcbiAgICB2YXIgdG1wTWF0cml4ID0gbS5pZGVudGl0eShtLmNyZWF0ZSgpKTtcclxuICAgIHZhciBtdnBNYXRyaXggPSBtLmlkZW50aXR5KG0uY3JlYXRlKCkpO1xyXG4gICAgXHJcbiAgICAvLyDjg5Pjg6Xjg7zDl+ODl+ODreOCuOOCp+OCr+OCt+ODp+ODs+W6p+aomeWkieaPm+ihjOWIl1xyXG4gICAgbS5sb29rQXQoWzAuMCwgMC4wLCA1LjBdLCBbMCwgMCwgMF0sIFswLCAxLCAwXSwgdk1hdHJpeCk7XHJcbiAgICBtLnBlcnNwZWN0aXZlKDQ1LCBjLndpZHRoIC8gYy5oZWlnaHQsIDAuMSwgMTAwLCBwTWF0cml4KTtcclxuICAgIG0ubXVsdGlwbHkocE1hdHJpeCwgdk1hdHJpeCwgdG1wTWF0cml4KTtcclxuICAgIFxyXG4gICAgLy8g5rex5bqm44OG44K544OI44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XHJcbiAgICBnbC5kZXB0aEZ1bmMoZ2wuTEVRVUFMKTtcclxuICAgIFxyXG4gICAgLy8g5pyJ5Yq544Gr44GZ44KL44OG44Kv44K544OB44Oj44Om44OL44OD44OI44KS5oyH5a6aXHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuICAgIFxyXG4gICAgLy8g44OG44Kv44K544OB44Oj55So5aSJ5pWw44Gu5a6j6KiAXHJcbiAgICB2YXIgdGV4dHVyZSA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIOODhuOCr+OCueODgeODo+OCkueUn+aIkFxyXG4gICAgY3JlYXRlX3RleHR1cmUoXCIuLi9pbWcvdGVzdC5qcGdcIik7XHJcbiAgICAvL2NyZWF0ZV90ZXh0dXJlKGltZ19kYXRhKTtcclxuICAgIC8vIOOCq+OCpuODs+OCv+OBruWuo+iogFxyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHZhciBzcGVlZD0tMTA1O1xyXG5cclxuICAgIFxyXG4gICAgLy8g5oGS5bi444Or44O844OXXHJcbiAgICAoZnVuY3Rpb24gbG9vcCgpe1xyXG4gICAgICAgIC8vIGNhbnZhc+OCkuWIneacn+WMllxyXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcclxuICAgICAgICBnbC5jbGVhckRlcHRoKDEuMCk7XHJcbiAgICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOOCq+OCpuODs+OCv+OCkuWFg+OBq+ODqeOCuOOCouODs+OCkueul+WHulxyXG4gICAgICAgIC8vY29uc29sZS5sb2coc3BlZWQpO1xyXG4gICAgICAgIGlmKHNwZWVkPT03KXtzcGVlZD0tMTA1O31cclxuICAgICAgICBzcGVlZCs9MC41O1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgdmFyIHJhZCA9IChjb3VudCAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODouODh+ODq+W6p+aomeWkieaPm+ihjOWIl+OBrueUn+aIkFxyXG4gICAgICAgIG0uaWRlbnRpdHkobU1hdHJpeCk7XHJcbiAgICAgICAgbS50cmFuc2xhdGUobU1hdHJpeCxbMCwwLHNwZWVkXSxtTWF0cml4KTtcclxuICAgICAgICBtLnJvdGF0ZShtTWF0cml4LCByYWQsIFswLCAxLCAwXSwgbU1hdHJpeCk7XHJcbiAgICAgICAgbS5tdWx0aXBseSh0bXBNYXRyaXgsIG1NYXRyaXgsIG12cE1hdHJpeCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdW5pZm9ybeWkieaVsOOBrueZu+mMsuOBqOaPj+eUu1xyXG5cclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyB1bmlmb3Jt5aSJ5pWw44Gr44OG44Kv44K544OB44Oj44KS55m76YyyXHJcbiAgICAgICAgZ2wudW5pZm9ybTFpKHVuaUxvY2F0aW9uWzFdLCAwKTtcclxuICAgICAgICBcclxuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHVuaUxvY2F0aW9uWzBdLCBmYWxzZSwgbXZwTWF0cml4KTtcclxuICAgICAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBpbmRleC5sZW5ndGgsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICAgICAgbS5pZGVudGl0eShtTWF0cml4KTtcclxuICAgICAgICBtLnRyYW5zbGF0ZShtTWF0cml4LFswLDAsc3BlZWQrMTAwXSxtTWF0cml4KTtcclxuICAgICAgICBtLnJvdGF0ZShtTWF0cml4LCByYWQsIFswLCAxLCAwXSwgbU1hdHJpeCk7XHJcbiAgICAgICAgbS5tdWx0aXBseSh0bXBNYXRyaXgsIG1NYXRyaXgsIG12cE1hdHJpeCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdW5pZm9ybeWkieaVsOOBrueZu+mMsuOBqOaPj+eUu1xyXG5cclxuICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyB1bmlmb3Jt5aSJ5pWw44Gr44OG44Kv44K544OB44Oj44KS55m76YyyXHJcbiAgICAgICAgZ2wudW5pZm9ybTFpKHVuaUxvY2F0aW9uWzFdLCAwKTtcclxuICAgICAgICBcclxuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHVuaUxvY2F0aW9uWzBdLCBmYWxzZSwgbXZwTWF0cml4KTtcclxuICAgICAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBpbmRleC5sZW5ndGgsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjgrPjg7Pjg4bjgq3jgrnjg4jjga7lho3mj4/nlLtcclxuICAgICAgICBnbC5mbHVzaCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODq+ODvOODl+OBruOBn+OCgeOBq+WGjeW4sOWRvOOBs+WHuuOBl1xyXG4gICAgICAgIC8vc2V0VGltZW91dChsb29wLCAxMDAwIC8gMzApO1xyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcclxuICAgIH0pKCk7XHJcbiAgICBcclxuICAgIC8vIOOCt+OCp+ODvOODgOOCkueUn+aIkOOBmeOCi+mWouaVsFxyXG4gICAgZnVuY3Rpb24gY3JlYXRlX3NoYWRlcihpZCl7XHJcbiAgICAgICAgLy8g44K344Kn44O844OA44KS5qC857SN44GZ44KL5aSJ5pWwXHJcbiAgICAgICAgdmFyIHNoYWRlcjtcclxuICAgICAgICBcclxuICAgICAgICAvLyBIVE1M44GL44KJc2NyaXB044K/44Kw44G444Gu5Y+C54Wn44KS5Y+W5b6XXHJcbiAgICAgICAgdmFyIHNjcmlwdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gc2NyaXB044K/44Kw44GM5a2Y5Zyo44GX44Gq44GE5aC05ZCI44Gv5oqc44GR44KLXHJcbiAgICAgICAgaWYoIXNjcmlwdEVsZW1lbnQpe3JldHVybjt9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gc2NyaXB044K/44Kw44GudHlwZeWxnuaAp+OCkuODgeOCp+ODg+OCr1xyXG4gICAgICAgIHN3aXRjaChzY3JpcHRFbGVtZW50LnR5cGUpe1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g6aCC54K544K344Kn44O844OA44Gu5aC05ZCIXHJcbiAgICAgICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtdmVydGV4JzpcclxuICAgICAgICAgICAgICAgIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOODleODqeOCsOODoeODs+ODiOOCt+OCp+ODvOODgOOBruWgtOWQiFxyXG4gICAgICAgICAgICBjYXNlICd4LXNoYWRlci94LWZyYWdtZW50JzpcclxuICAgICAgICAgICAgICAgIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQgOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyDnlJ/miJDjgZXjgozjgZ/jgrfjgqfjg7zjg4Djgavjgr3jg7zjgrnjgpLlibLjgorlvZPjgabjgotcclxuICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzY3JpcHRFbGVtZW50LnRleHQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOOCt+OCp+ODvOODgOOCkuOCs+ODs+ODkeOCpOODq+OBmeOCi1xyXG4gICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjgrfjgqfjg7zjg4DjgYzmraPjgZfjgY/jgrPjg7Pjg5HjgqTjg6vjgZXjgozjgZ/jgYvjg4Hjgqfjg4Pjgq9cclxuICAgICAgICBpZihnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpe1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g5oiQ5Yqf44GX44Gm44GE44Gf44KJ44K344Kn44O844OA44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgICAgIHJldHVybiBzaGFkZXI7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyDlpLHmlZfjgZfjgabjgYTjgZ/jgonjgqjjg6njg7zjg63jgrDjgpLjgqLjg6njg7zjg4jjgZnjgotcclxuICAgICAgICAgICAgYWxlcnQoZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkueUn+aIkOOBl+OCt+OCp+ODvOODgOOCkuODquODs+OCr+OBmeOCi+mWouaVsFxyXG4gICAgZnVuY3Rpb24gY3JlYXRlX3Byb2dyYW0odnMsIGZzKXtcclxuICAgICAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjga7nlJ/miJBcclxuICAgICAgICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgavjgrfjgqfjg7zjg4DjgpLlibLjgorlvZPjgabjgotcclxuICAgICAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpO1xyXG4gICAgICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44K344Kn44O844OA44KS44Oq44Oz44KvXHJcbiAgICAgICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44K344Kn44O844OA44Gu44Oq44Oz44Kv44GM5q2j44GX44GP6KGM44Gq44KP44KM44Gf44GL44OB44Kn44OD44KvXHJcbiAgICAgICAgaWYoZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpe1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAvLyDmiJDlip/jgZfjgabjgYTjgZ/jgonjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLmnInlirnjgavjgZnjgotcclxuICAgICAgICAgICAgZ2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkui/lOOBl+OBpue1guS6hlxyXG4gICAgICAgICAgICByZXR1cm4gcHJvZ3JhbTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOWkseaVl+OBl+OBpuOBhOOBn+OCieOCqOODqeODvOODreOCsOOCkuOCouODqeODvOODiOOBmeOCi1xyXG4gICAgICAgICAgICBhbGVydChnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBWQk/jgpLnlJ/miJDjgZnjgovplqLmlbBcclxuICAgIGZ1bmN0aW9uIGNyZWF0ZV92Ym8oZGF0YSl7XHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgdmFyIHZibyA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOBq+ODh+ODvOOCv+OCkuOCu+ODg+ODiFxyXG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KGRhdGEpLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOeUn+aIkOOBl+OBnyBWQk8g44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgcmV0dXJuIHZibztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVkJP44KS44OQ44Kk44Oz44OJ44GX55m76Yyy44GZ44KL6Zai5pWwXHJcbiAgICBmdW5jdGlvbiBzZXRfYXR0cmlidXRlKHZibywgYXR0TCwgYXR0Uyl7XHJcbiAgICAgICAgLy8g5byV5pWw44Go44GX44Gm5Y+X44GR5Y+W44Gj44Gf6YWN5YiX44KS5Yem55CG44GZ44KLXHJcbiAgICAgICAgZm9yKHZhciBpIGluIHZibyl7XHJcbiAgICAgICAgICAgIC8vIOODkOODg+ODleOCoeOCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmJvW2ldKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGF0dHJpYnV0ZUxvY2F0aW9u44KS5pyJ5Yq544Gr44GZ44KLXHJcbiAgICAgICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dExbaV0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gYXR0cmlidXRlTG9jYXRpb27jgpLpgJrnn6XjgZfnmbvpjLLjgZnjgotcclxuICAgICAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRMW2ldLCBhdHRTW2ldLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gSUJP44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVfaWJvKGRhdGEpe1xyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciBpYm8gPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg5Djg4Pjg5XjgqHjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpYm8pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOODkOODg+ODleOCoeOBq+ODh+ODvOOCv+OCkuOCu+ODg+ODiFxyXG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBJbnQxNkFycmF5KGRhdGEpLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44OQ44OD44OV44Kh44Gu44OQ44Kk44Oz44OJ44KS54Sh5Yq55YyWXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g55Sf5oiQ44GX44GfSUJP44KS6L+U44GX44Gm57WC5LqGXHJcbiAgICAgICAgcmV0dXJuIGlibztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GZ44KL6Zai5pWwXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVfdGV4dHVyZShzb3VyY2Upe1xyXG4gICAgICAgIC8vIOOCpOODoeODvOOCuOOCquODluOCuOOCp+OCr+ODiOOBrueUn+aIkFxyXG4gICAgICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDjg4fjg7zjgr/jga7jgqrjg7Pjg63jg7zjg4njgpLjg4jjg6rjgqzjg7zjgavjgZnjgotcclxuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgLy8g44OG44Kv44K544OB44Oj44Kq44OW44K444Kn44Kv44OI44Gu55Sf5oiQXHJcbiAgICAgICAgICAgIHZhciB0ZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyDjg4bjgq/jgrnjg4Hjg6PjgpLjg5DjgqTjg7Pjg4njgZnjgotcclxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBuOOCpOODoeODvOOCuOOCkumBqeeUqFxyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltZyk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELGdsLlRFWFRVUkVfTUFHX0ZJTFRFUixnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCxnbC5URVhUVVJFX01JTl9GSUxURVIsZ2wuTElORUFSKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsZ2wuVEVYVFVSRV9XUkFQX1MsZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELGdsLlRFWFRVUkVfV1JBUF9ULGdsLkNMQU1QX1RPX0VER0UpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIC8vIOODn+ODg+ODl+ODnuODg+ODl+OCkueUn+aIkFxyXG4gICAgICAgICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOODhuOCr+OCueODgeODo+OBruODkOOCpOODs+ODieOCkueEoeWKueWMllxyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOeUn+aIkOOBl+OBn+ODhuOCr+OCueODgeODo+OCkuOCsOODreODvOODkOODq+WkieaVsOOBq+S7o+WFpVxyXG4gICAgICAgICAgICB0ZXh0dXJlID0gdGV4O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g44Kk44Oh44O844K444Kq44OW44K444Kn44Kv44OI44Gu44K944O844K544KS5oyH5a6aXHJcbiAgICAgICAgaW1nLnNyYyA9IHNvdXJjZTtcclxuICAgIH1cclxuICAgIFxyXG59OyJdfQ==