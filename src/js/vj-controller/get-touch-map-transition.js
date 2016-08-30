//キャンバス上のマウス座標をとってくる
module.exports=function(_e,_canvas){
	var mouseX=_e.touches[0].clientX-$(_canvas).position().left+scrollX();
	var mouseY=_e.touches[0].clientY-$(_canvas).position().top+scrollY();
	return {x:mouseX,y:mouseY};
}
function scrollX(){return document.documentElement.scrollLeft||document.body.scrollLeft;}
function scrollY(){return document.documentElement.scrollTop||document.body.scrollTop;}