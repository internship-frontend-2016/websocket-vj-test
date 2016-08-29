var c,cw,ch,mx,my,gl,run,eCheck;
var startTime;
var time=0.0;
var tempTime=0.0;
var fps=1000/30;
var uniLocation=new Array();

window.onload=function(){
	c=document.getElementById("canvas");
	cw=512;
	ch=512;
	c.width=cw;
	c.height=ch;

	eCheck=document.getElementById("check");

	c.addEventListener("mousemove",mouseMove,true);
	eCheck.addEventListener("change",checkChange,true);

	gl=c.getContext("webgl")||c.getContext("experimental-webgl");

	var prg=create_program(gl,create_shader(gl,"vs"),create_shader(gl,"fs"));
	run=(prg!=null);
	if(!run){
		eCheck.checked=false;
	}
	uniLocation[0]=gl.getUniformLocation(prg,"time");
	uniLocation[1]=gl.getUniformLocation(prg,"mouse");
	uniLocation[2]=gl.getUniformLocation(prg,"iResolution");

	var position=[
	-1.0,1.0,0.0,
	1.0,1.0,0.0,
	-1.0,-1.0,0.0,
	1.0,-1.0,0.0,
	]
	var index=[
	0,2,1,
	1,2,3
	]
	var vPosition=create_vbo(gl,position);
	var vIndex=create_ibo(gl,index);
	var vAttLocation=gl.getAttribLocation(prg,"position");
	gl.bindBuffer(gl.ARRAY_BUFFER,vPosition);
	gl.enableVertexAttribArray(vAttLocation);
	gl.vertexAttribPointer(vAttLocation,3,gl.FLOAT,false,0,0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,vIndex);

	gl.clearColor(0.0,0.0,0.0,1.0);
	mx=0.5;my=0.5;
	startTime=new Date().getTime();

	render();

}
function render(){
	if(!run){
		return;
	}
	time=(new Date().getTime() - startTime)*0.001;
	gl.clear(gl.COLOR_BUFFER_BIT);

//	console.log(time+tempTime);
	gl.uniform1f(uniLocation[0],time+tempTime);
	gl.uniform2fv(uniLocation[1],[mx,my]);
	gl.uniform2fv(uniLocation[2],[cw,ch]);

	gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
	gl.flush();

	setTimeout(render,fps);
}
function checkChange(e){
	run=e.currentTarget.checked;
	if(run){
		startTime=new Date().getTime();
		render();
	}else{
		console.log("time"+time);
		console.log("tempTime"+tempTime);
		tempTime+=time;
	}
}
function mouseMove(e){
	mx=e.offsetX/cw;
	my=e.offsetY/ch;
}
// シェーダを生成する関数
function create_shader(_gl,_id){
	console.log(_gl);
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
