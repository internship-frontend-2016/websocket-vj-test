module.exports=function(){
	//ドキュメントのタッチイベントの初期化
	document.addEventListener("touchstart",stopDefault,false);
	document.addEventListener("touchmove",stopDefault,false);
	//document.addEventListener("touchend",stopDefault,false);
	//ドキュメントのジェスチャーイベントの初期化
	document.addEventListener("gesturestart",stopDefault,false);
	document.addEventListener("gesturechange",stopDefault,false);
	//document.addEventListener("gestureend",stopDefault,false);

	//ブラウザのデフォルト動作を禁止する
	function stopDefault(e){
		if(e.touches[0].target.tagName.toLowerCase() == "li"){
			return;
		}
		if(e.touches[0].target.tagName.toLowerCase()=="div"){
			return;
		}
		if(e.touches[0].target.tagName.toLowerCase()=="input"){
			return;
		}
		e.preventDefault();
	}
}