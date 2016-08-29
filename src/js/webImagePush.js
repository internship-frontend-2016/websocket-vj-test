window.onload=function(){
    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;
    // webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    console.log(gl);
    // 頂点シェーダとフラグメントシェーダの生成
    var v_shader = create_shader(gl,'vs');
    var f_shader = create_shader(gl,'fs');
    
    // プログラムオブジェクトの生成とリンク
    var prg = create_program(gl,v_shader, f_shader);
    
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
    
    // テクスチャ座標
    var textureCoord = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    
    // 頂点インデックス
    var index = [
        0, 1, 2,
        3, 2, 1
    ];
    
    // VBOとIBOの生成
    var vPosition     = create_vbo(gl,position);
    var vColor        = create_vbo(gl,color);
    var vTextureCoord = create_vbo(gl,textureCoord);
    var VBOList       = [vPosition, vColor, vTextureCoord];
    var iIndex        = create_ibo(gl,index);
    
    // VBOとIBOの登録
    set_attribute(gl,VBOList, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);
    
    // uniformLocationを配列に取得
    var uniLocation = new Array();
    uniLocation[0]  = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1]  = gl.getUniformLocation(prg, 'texture');
    
    // 各種行列の生成と初期化
    var m = new matIV();
    var mMatrix   = m.identity(m.create());
    var vMatrix   = m.identity(m.create());
    var pMatrix   = m.identity(m.create());
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
    var texture=new Array();
    //texture[0] = null;

    var posZ=new Array();
    //テクスチャ呼ばれたら
    var socket =io();

    //socketのイベントが何回きたかしらべる
    var getnumber=0;
    //サーバーからデータを受け取る

    socket.on("pushImageFromServer",function(data){
    //    var image = document.getElementById("image");
        create_texture(gl,data,getnumber);
        posZ[getnumber]=-105;
        getnumber++;
        console.log(getnumber);
        console.log(texture);
    });

    // テクスチャを生成
    //create_texture(gl,"../img/test.jpg",0);
    //create_texture(gl,img_data);
    // カウンタの宣言
    var count = 0;
    var count2=0;
    // 恒常ループ
    (function loop(){
        // canvasを初期化
//        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        var hsv = hsva(count2 % 360, 1, 1, 1);
        gl.clearColor(hsv[0], hsv[1], hsv[2], hsv[3]);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // カウンタを元にラジアンを算出
        count++;
        if (count % 10 == 0) {
            count2++;
        }
        var rad = (count % 360) * Math.PI / 180;
        

       //  // モデル座標変換行列の生成
       //  m.identity(mMatrix);
       //  m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
       //  m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        
       //  // テクスチャをバインドする
       //  gl.bindTexture(gl.TEXTURE_2D, texture[0]);
        
       //  // uniform変数にテクスチャを登録
       // gl.uniform1i(uniLocation[1], 0);

       //  // uniform変数の登録と描画
       //  gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
       //  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
       if(texture){
            for(var i=0;i<texture.length;i++){
                if(posZ[i]==7){
                    texture.shift();
                    posZ.shift();
                    getnumber--;
                    console.log(texture);
                    /*
カメラより前にすすんだら、配列を減らす処理が微妙
                    */
                }
            }
           for(var i=0;i<texture.length;i++){
            posZ[i]+=0.25;
            bindPlatePoly(gl,m,mMatrix,rad,tmpMatrix,mvpMatrix,uniLocation,index,i,posZ[i]);
           }
       }
        // コンテキストの再描画
        gl.flush();

        // ループのために再帰呼び出し
        //setTimeout(loop, 1000 / 30);
        //タブが非アクティブの場合はFPSを落とす
        requestAnimationFrame(loop);
    })();

    function bindPlatePoly(_gl,_m,_mMatrix,_rad,_tmpMatrix,_mvpMatrix,_uniLocation,_index,_number,_posZ){
        // モデル座標変換行列の生成
        _m.identity(_mMatrix);
        _m.translate(_mMatrix,[0,0,_posZ],_mMatrix);
        _m.rotate(_mMatrix, _rad, [0, 1, 0], _mMatrix);
        _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);
        
        // テクスチャをバインドする
        _gl.bindTexture(_gl.TEXTURE_2D, texture[_number]);
        
        // uniform変数にテクスチャを登録
       _gl.uniform1i(_uniLocation[1], 0);

        // uniform変数の登録と描画
        _gl.uniformMatrix4fv(_uniLocation[0], false, _mvpMatrix);
        _gl.drawElements(_gl.TRIANGLES, _index.length, _gl.UNSIGNED_SHORT, 0);
        
    }
    // テクスチャを生成する関数
    function create_texture(_gl,_source,_n){
        // イメージオブジェクトの生成
        var img = new Image();
        
        // データのオンロードをトリガーにする
        img.onload = function(){
            // テクスチャオブジェクトの生成
            var tex = _gl.createTexture();
            
            // テクスチャをバインドする
            _gl.bindTexture(_gl.TEXTURE_2D, tex);
            
            // テクスチャへイメージを適用
            _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, img);
            _gl.texParameteri(_gl.TEXTURE_2D,_gl.TEXTURE_MAG_FILTER,_gl.LINEAR);
            _gl.texParameteri(_gl.TEXTURE_2D,_gl.TEXTURE_MIN_FILTER,_gl.LINEAR);
            _gl.texParameteri(_gl.TEXTURE_2D,_gl.TEXTURE_WRAP_S,_gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D,_gl.TEXTURE_WRAP_T,_gl.CLAMP_TO_EDGE);

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
    
};

// シェーダを生成する関数
function create_shader(_gl,_id){
    // シェーダを格納する変数
    var shader;
    
    // HTMLからscriptタグへの参照を取得
    var scriptElement = document.getElementById(_id);
    
    // scriptタグが存在しない場合は抜ける
    if(!scriptElement){return;}
    
    // scriptタグのtype属性をチェック
    switch(scriptElement.type){
        
        // 頂点シェーダの場合
        case 'x-shader/x-vertex':
            shader = _gl.createShader(_gl.VERTEX_SHADER);
            break;
            
        // フラグメントシェーダの場合
        case 'x-shader/x-fragment':
            shader = _gl.createShader(_gl.FRAGMENT_SHADER);
            break;
        default :
            return;
    }
    
    // 生成されたシェーダにソースを割り当てる
    _gl.shaderSource(shader, scriptElement.text);
    
    // シェーダをコンパイルする
    _gl.compileShader(shader);
    
    // シェーダが正しくコンパイルされたかチェック
    if(_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)){
        
        // 成功していたらシェーダを返して終了
        return shader;
    }else{
        
        // 失敗していたらエラーログをアラートする
        alert(_gl.getShaderInfoLog(shader));
    }
}
// プログラムオブジェクトを生成しシェーダをリンクする関数
function create_program(_gl,_vs, _fs){
    // プログラムオブジェクトの生成
    var program = _gl.createProgram();
    
    // プログラムオブジェクトにシェーダを割り当てる
    _gl.attachShader(program, _vs);
    _gl.attachShader(program, _fs);
    
    // シェーダをリンク
    _gl.linkProgram(program);
    
    // シェーダのリンクが正しく行なわれたかチェック
    if(_gl.getProgramParameter(program, _gl.LINK_STATUS)){
    
        // 成功していたらプログラムオブジェクトを有効にする
        _gl.useProgram(program);
        
        // プログラムオブジェクトを返して終了
        return program;
    }else{
        
        // 失敗していたらエラーログをアラートする
        alert(_gl.getProgramInfoLog(program));
    }
}
// VBOを生成する関数
function create_vbo(_gl,_data){
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
function set_attribute(_gl,_vbo, _attL, _attS){
    // 引数として受け取った配列を処理する
    for(var i in _vbo){
        // バッファをバインドする
        _gl.bindBuffer(_gl.ARRAY_BUFFER, _vbo[i]);
        
        // attributeLocationを有効にする
        _gl.enableVertexAttribArray(_attL[i]);
        
        // attributeLocationを通知し登録する
        _gl.vertexAttribPointer(_attL[i], _attS[i], _gl.FLOAT, false, 0, 0);
    }
}
// IBOを生成する関数
function create_ibo(_gl,_data){
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