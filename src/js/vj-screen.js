'use strict';
// テクスチャ用変数の宣言
var texture=[];
var mx,my,cw,ch;
var select=1;
window.resize=function(){
    cw=window.innerWidth;
    ch=window.innerHeight;
};
window.onload=function(){
    var socket =io();
    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    cw=window.innerWidth;
    ch=window.innerHeight;
    c.width = cw;
    c.height = ch;

    //キーが押されたら
    document.addEventListener("keydown" , KeyDown);
    //canvas上でマウスが動いたら
    c.addEventListener("mousemove",mouseMove,true);
    // webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    // 背景側の初期設定
    var backgroundData=initBackground(gl,"tvs","tfs");

    var intensiveData=initBackground(gl,"tvs","intensiveFs");

    // 全体的の初期設定
    var overallData=initOverall(gl);

    // 各種行列の生成と初期化
    var m = new matIV();
    var mMatrix   = m.identity(m.create());
    var vMatrix   = m.identity(m.create());
    var pMatrix   = m.identity(m.create());
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
    var posX=[];
    //テクスチャのy座標
    var posY=[];
    //テクスチャのz座標
    var posZ=[];
    //socketのイベントが何回きたかしらべる
    var getnumber=0;

    var joFrag=false;

    //サーバーからデータを受け取る
    socket.on("pushImageFromServer",function(data){
            console.log(data);
            if(joFrag){
                create_texture(gl,"../img/joe.jpg",getnumber);
            }else{
                create_texture(gl,data.imgdata,getnumber);
            }
            posX[getnumber]=data.x*5.0;
            posY[getnumber]=data.y*5.0;
            posZ[getnumber]=0;
            console.log(getnumber);
            console.log(texture);
            getnumber++;
    });
    //joさんボタンを押したかどうかをチェック
    socket.on("pushJoFragFromServer",function(data){
        console.log(data.joFrag);
        if(data.joFrag===true){
            joFrag=true;
        }
    });
    //最初にjoさんフラグをfalseにするようにメッセージを送る
    socket.emit("pushJoFragFromScreen",{
            joFrag:false
    });

    // フレームバッファオブジェクトの取得
    var fBufferWidth  = cw;
    var fBufferHeight = ch;
    var fBuffer = create_framebuffer(gl,fBufferWidth, fBufferHeight);
    // カウンタの宣言
    var count = 0;
    var count2=0;
    //一応
    mx=0.5;my=0.5;
    var startTime=new Date().getTime();

    //ブレンドファンクしてるぞ
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    // 恒常ループ
    (function loop(){
        // カウンタを元にラジアンを算出
        count++;
        if (count % 10 === 0) {
            count2++;
        }
        var hsv=hsva(count2%360,1,1,1);
        var rad = (count % 360) * Math.PI / 180;
        /*-------------------フレームバッファ----------------------*/
        //時間
        var time=(new Date().getTime() - startTime)*0.001;
        /*--フレームバッファをバインド--*/
        if(select==1){
            bindBackground(gl,fBuffer,backgroundData,time,mx,my,cw,ch,hsv);
        }else if(select==2){
            bindBackground(gl,fBuffer,intensiveData,time,mx,my,cw,ch,hsv);
        }

        //全体的に
        bindOverall(gl,overallData,fBuffer,m,mMatrix,tmpMatrix,mvpMatrix,rad,texture,posX,posY,posZ,getnumber);
        // コンテキストの再描画
        gl.flush();
        //タブが非アクティブの場合はFPSを落とす
        requestAnimationFrame(loop);
    })();

};
function KeyDown(e){
    if(e.keyCode==49){
        //1を押したら
        select=1;
    }else if(e.keyCode==50){
        //2を押したら
        select=2;
    }
}
function mouseMove(e){
    mx=e.offsetX/cw;
    my=e.offsetY/ch;
}
function initBackground(_gl,_vsId,_fsId){
    var prg=create_program(_gl,create_shader(_gl,_vsId),create_shader(_gl,_fsId));
    var uniLocation=[];
    uniLocation[0]=_gl.getUniformLocation(prg,"time");
    uniLocation[1]=_gl.getUniformLocation(prg,"mouse");
    uniLocation[2]=_gl.getUniformLocation(prg,"iResolution");
    uniLocation[3]=_gl.getUniformLocation(prg,"hsv");

    var Position=[
    -1.0,1.0,0.0,
    1.0,1.0,0.0,
    -1.0,-1.0,0.0,
    1.0,-1.0,0.0,
    ];
    var Index=[
    0,2,1,
    1,2,3
    ];
    var vPosition=create_vbo(_gl,Position);
    var vIndex=create_ibo(_gl,Index);
    var vAttLocation=_gl.getAttribLocation(prg,"position");

    return{prg:prg,uniLocation:uniLocation,vPosition:vPosition,vIndex:vIndex,attLocation:vAttLocation};
}
function initOverall(_gl){
    // プログラムオブジェクトの生成とリンク
    var prg = create_program(_gl,create_shader(_gl,'vs'), create_shader(_gl,'fs'));

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
    var vPosition     = create_vbo(_gl,position);
    var vColor        = create_vbo(_gl,color);
    var vTextureCoord = create_vbo(_gl,textureCoord);
    var VBOList       = [vPosition, vColor, vTextureCoord];
    var iIndex        = create_ibo(_gl,index);

    // uniformLocationを配列に取得
    var uniLocation = [];
    uniLocation[0]  = _gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1]  = _gl.getUniformLocation(prg, 'texture');

    return{prg:prg,attLocation:attLocation,attStride:attStride,VBOList:VBOList,iIndex:iIndex,uniLocation:uniLocation};
}
function bindBackground(_gl,_fBuffer,_backgroundData,_time,_mx,_my,_cw,_ch,_hsv){
    _gl.bindFramebuffer(_gl.FRAMEBUFFER,_fBuffer.f);
    _gl.clearColor(0.0,0.0,0.0,1.0);
    _gl.clear(_gl.COLOR_BUFFER_BIT);

    _gl.useProgram(_backgroundData.prg);
    // ブレンディングを無効にする
    _gl.disable(_gl.BLEND);
    //attributeの登録
    _gl.bindBuffer(_gl.ARRAY_BUFFER,_backgroundData.vPosition);
    _gl.enableVertexAttribArray(_backgroundData.vAttLocation);
    _gl.vertexAttribPointer(_backgroundData.vAttLocation,3,_gl.FLOAT,false,0,0);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER,_backgroundData.vIndex);

    _gl.uniform1f(_backgroundData.uniLocation[0],_time);
    _gl.uniform2fv(_backgroundData.uniLocation[1],[_mx,_my]);
    _gl.uniform2fv(_backgroundData.uniLocation[2],[_cw,_ch]);
    _gl.uniform4fv(_backgroundData.uniLocation[3],[_hsv[0],_hsv[1],_hsv[2],_hsv[3]]);
    _gl.drawElements(_gl.TRIANGLES,6,_gl.UNSIGNED_SHORT,0);

    _gl.bindFramebuffer(_gl.FRAMEBUFFER,null);

}
function bindOverall(_gl,_overallData,_fBuffer,_m,_mMatrix,_tmpMatrix,_mvpMatrix,_rad,_texture,_posX,_posY,_posZ,_getnumber){
    // canvasを初期化
    _gl.clearColor(0.0,0.0,0.0,1.0);
    _gl.clearDepth(1.0);
    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);

    /*------------------背景テクスチャ(オフスクリーンレンタリング)---------------------*/
    _gl.useProgram(_overallData.prg);
    // ブレンディングを無効にする
    _gl.disable(_gl.BLEND);
    // VBOとIBOの登録
    set_attribute(_gl,_overallData.VBOList, _overallData.attLocation, _overallData.attStride);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _overallData.iIndex);
    /*移動、回転、拡大縮小*/
    _m.identity(_mMatrix);
    _m.translate(_mMatrix,[0.0,0.0,-95.0],_mMatrix);
    _m.scale(_mMatrix,[100.0,70.0,1.0],_mMatrix);
    _m.multiply(_tmpMatrix, _mMatrix, _mvpMatrix);
    //uniformを登録
    _gl.bindTexture(_gl.TEXTURE_2D,_fBuffer.t);
    _gl.uniform1i(_overallData.uniLocation[1], 0);
    _gl.uniformMatrix4fv(_overallData.uniLocation[0], false, _mvpMatrix);
    _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);

    /*テクスチャ*/
    // ブレンディングを有効にする
    _gl.enable(_gl.BLEND);
   if(_texture){
       for(var i=0;i<_texture.length;i++){
        _posZ[i]-=0.40;
        if(_posZ[i]<-100){
            // カメラより前にすすんだら、配列を減らす処理が微妙
            console.log("削除してます");
            _texture.shift();
            _posX.shift();
            _posY.shift();
            _posZ.shift();
            _getnumber--;
        }
        bindPlatePoly(_gl,_m,_mMatrix,_rad,_tmpMatrix,_mvpMatrix,_overallData.uniLocation,i,_posX[i],_posY[i],_posZ[i]);
       }
   }

}
function bindPlatePoly(_gl,_m,_mMatrix,_rad,_tmpMatrix,_mvpMatrix,_uniLocation,_number,_posX,_posY,_posZ){
    // モデル座標変換行列の生成
    _m.identity(_mMatrix);
    _m.translate(_mMatrix,[_posX,_posY,_posZ],_mMatrix);
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
// フレームバッファをオブジェクトとして生成する関数
function create_framebuffer(_gl,_width, _height){
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
    return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
}
    
