(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var socket = io();
/*
$("form").submit(function(){
	socket.emit("onVjAction",true);
//			$("#m").val("");
	return false;
});*/
$("#first").on("click", function () {
	socket.emit("vjActionFromClient", 1);
	return false;
});
$("#second").on("click", function () {
	socket.emit("vjActionFromClient", 2);
	return false;
});
//サーバーからデータを受け取る
/*
socket.on("vjActionFromClient",function(msg){
//			$('#messages').append($('<li>').text(msg));
	console.log(msg);
});
*/

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFx2ai1jb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLFNBQVEsSUFBWjtBQUNBOzs7Ozs7QUFNQSxFQUFFLFFBQUYsRUFBWSxFQUFaLENBQWUsT0FBZixFQUF1QixZQUFVO0FBQ2hDLFFBQU8sSUFBUCxDQUFZLG9CQUFaLEVBQWlDLENBQWpDO0FBQ0EsUUFBTyxLQUFQO0FBQ0EsQ0FIRDtBQUlBLEVBQUUsU0FBRixFQUFhLEVBQWIsQ0FBZ0IsT0FBaEIsRUFBd0IsWUFBVTtBQUNqQyxRQUFPLElBQVAsQ0FBWSxvQkFBWixFQUFpQyxDQUFqQztBQUNBLFFBQU8sS0FBUDtBQUNBLENBSEQ7QUFJQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBzb2NrZXQgPWlvKCk7XHJcbi8qXHJcbiQoXCJmb3JtXCIpLnN1Ym1pdChmdW5jdGlvbigpe1xyXG5cdHNvY2tldC5lbWl0KFwib25WakFjdGlvblwiLHRydWUpO1xyXG4vL1x0XHRcdCQoXCIjbVwiKS52YWwoXCJcIik7XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59KTsqL1xyXG4kKFwiI2ZpcnN0XCIpLm9uKFwiY2xpY2tcIixmdW5jdGlvbigpe1xyXG5cdHNvY2tldC5lbWl0KFwidmpBY3Rpb25Gcm9tQ2xpZW50XCIsMSk7XHJcblx0cmV0dXJuIGZhbHNlXHJcbn0pO1xyXG4kKFwiI3NlY29uZFwiKS5vbihcImNsaWNrXCIsZnVuY3Rpb24oKXtcclxuXHRzb2NrZXQuZW1pdChcInZqQWN0aW9uRnJvbUNsaWVudFwiLDIpO1xyXG5cdHJldHVybiBmYWxzZVxyXG59KTtcclxuLy/jgrXjg7zjg5Djg7zjgYvjgonjg4fjg7zjgr/jgpLlj5fjgZHlj5bjgotcclxuLypcclxuc29ja2V0Lm9uKFwidmpBY3Rpb25Gcm9tQ2xpZW50XCIsZnVuY3Rpb24obXNnKXtcclxuLy9cdFx0XHQkKCcjbWVzc2FnZXMnKS5hcHBlbmQoJCgnPGxpPicpLnRleHQobXNnKSk7XHJcblx0Y29uc29sZS5sb2cobXNnKTtcclxufSk7XHJcbiovIl19
