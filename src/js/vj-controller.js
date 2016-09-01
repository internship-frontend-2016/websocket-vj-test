'use strict';
//var getTouchMapTransition=require("./vj-controller/get-touch-map-transition");
var initPaintCanvas=require("./vj-controller/init-paint-canvas");
var initControllerPad=require("./vj-controller/init-controller-pad");
var init=require("./vj-controller/init");
window.onload=function(){
	var canvas=document.getElementById("myCanvas");
	var w=316;
	var h=316;
	//getTouchMapTransition();
	init();
	initPaintCanvas(w,h,canvas);
	initControllerPad(w,h,canvas);
};
