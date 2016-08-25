(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

onload = function onload() {
	var socket = io();
	var canvas = document.getElementById("myCanvas");
	var c = canvas.getContext("2d");
	var w = 640;
	var h = 640;
	var drawing = false;
	var oldPos;

	canvas.width = w;
	canvas.height = h;

	//背景は白になる
	c.fillStyle = "rgb(255,255,255)";
	c.fillRect(0, 0, $(canvas).width(), $(canvas).height());

	c.strokeStyle = "#000000";
	c.lineWidth = 5;
	c.lineJoin = "round";
	c.lineCap = "round";

	//タップ開始時に、絵を描く準備をする
	canvas.addEventListener("touchstart", function (e) {
		drawing = true;
		oldPos = getPosT(e);
	}, false);

	//タップ終了時に、絵を描く後処理を行う
	canvas.addEventListener("touched", function () {
		drawing = false;
	}, false);

	//gestureイベント（2本指以上触ると発生する）
	//終了時にも絵を描く後処理を行う
	canvas.addEventListener("gestureend", function () {
		console.log("mouseout");
		drawing = false;
	}, false);

	//実際に絵を書く処理
	//前回保存した位置から現在の位置に線を引く
	canvas.addEventListener("touchmove", function (e) {
		var pos = getPosT(e);
		if (drawing) {
			c.beginPath();
			c.moveTo(oldPos.x, oldPos.y);
			c.lineTo(pos.x, pos.y);
			c.stroke();
			c.closePath();
			oldPos = pos;
		}
	}, false);

	//タップ関連関数
	function scrollX() {
		return document.documentElement.scrollLeft || document.body.scrollLeft;
	}
	function scrollY() {
		return document.documentElement.scrollTop || document.body.scrollTop;
	}
	function getPosT(_e) {
		var mouseX = _e.touches[0].clientX - $(canvas).position().left + scrollX();
		var mouseY = _e.touches[0].clientY - $(canvas).position().top + scrollY();
		return { x: mouseX, y: mouseY };
	}

	//色と線の太さを設定する関数
	$("#black").on("click", function () {
		c.strokeStyle = "black";
	});
	$("#blue").on("click", function () {
		c.strokeStyle = "blue";
	});
	$("#red").on("click", function () {
		c.strokeStyle = "red";
	});
	$("#green").on("click", function () {
		c.strokeStyle = "green";
	});
	$("#small").on("click", function () {
		c.lineWidth = 5;
	});
	$("#middle").on("click", function () {
		c.lineWidth = 10;
	});
	$("#large").on("click", function () {
		c.lineWidth = 20;
	});

	$("#delete_button").on("click", function () {
		//背景は白になる
		c.fillStyle = "rgb(255,255,255)";
		c.fillRect(0, 0, $(canvas).width(), $(canvas).height());
		//c.clearRect(0,0,$(canvas).width(),$(canvas).height());
	});

	//ブラウザのデフォルト動作を禁止する

	function stopDefault(e) {
		//if(e.touches[0].target.tagName.toLowerCase()=="li"){
		console.log(e.touches[0].target);
		if (e.touches[0].target.tagName.toLowerCase() == "li") {
			conosole.log(e.touches[0].target.tagName.toLowerCase());
			return;
		}
		if (e.touches[0].target.tagName.toLowerCase() == "input") {
			return;
		}
		e.preventDefault();
	}

	//ドキュメントのタッチイベントの初期化
	document.addEventListener("touchstart", stopDefault, false);
	document.addEventListener("touchmove", stopDefault, false);
	//document.addEventListener("touchend",stopDefault,false);
	//ドキュメントのジェスチャーイベントの初期化
	document.addEventListener("gesturestart", stopDefault, false);
	document.addEventListener("gesturechange", stopDefault, false);
	//document.addEventListener("gestureend",stopDefault,false);


	//画像変換する処理
	var toImage = document.getElementById("toImage_button");
	toImage.addEventListener("click", function () {
		var data = canvas.toDataURL("image/jpeg");
		var imageContents = document.getElementById("imageContents");
		imageContents.innerHTML = "<img src='" + data + "'>";
		socket.emit("pushImageFromClient", data);
	}, false);
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFxzbWFydHBob25lUGFpbnRBcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLFNBQU8sa0JBQVU7QUFDaEIsS0FBSSxTQUFPLElBQVg7QUFDQSxLQUFJLFNBQU8sU0FBUyxjQUFULENBQXdCLFVBQXhCLENBQVg7QUFDQSxLQUFJLElBQUUsT0FBTyxVQUFQLENBQWtCLElBQWxCLENBQU47QUFDQSxLQUFJLElBQUUsR0FBTjtBQUNBLEtBQUksSUFBRSxHQUFOO0FBQ0EsS0FBSSxVQUFRLEtBQVo7QUFDQSxLQUFJLE1BQUo7O0FBRUEsUUFBTyxLQUFQLEdBQWEsQ0FBYjtBQUNBLFFBQU8sTUFBUCxHQUFjLENBQWQ7O0FBRUE7QUFDQSxHQUFFLFNBQUYsR0FBWSxrQkFBWjtBQUNBLEdBQUUsUUFBRixDQUFXLENBQVgsRUFBYSxDQUFiLEVBQWUsRUFBRSxNQUFGLEVBQVUsS0FBVixFQUFmLEVBQWlDLEVBQUUsTUFBRixFQUFVLE1BQVYsRUFBakM7O0FBRUEsR0FBRSxXQUFGLEdBQWMsU0FBZDtBQUNBLEdBQUUsU0FBRixHQUFZLENBQVo7QUFDQSxHQUFFLFFBQUYsR0FBVyxPQUFYO0FBQ0EsR0FBRSxPQUFGLEdBQVUsT0FBVjs7QUFFQTtBQUNBLFFBQU8sZ0JBQVAsQ0FBd0IsWUFBeEIsRUFBcUMsVUFBUyxDQUFULEVBQVc7QUFDL0MsWUFBUSxJQUFSO0FBQ0EsV0FBTyxRQUFRLENBQVIsQ0FBUDtBQUNBLEVBSEQsRUFHRSxLQUhGOztBQUtBO0FBQ0EsUUFBTyxnQkFBUCxDQUF3QixTQUF4QixFQUFrQyxZQUFVO0FBQzNDLFlBQVEsS0FBUjtBQUNBLEVBRkQsRUFFRSxLQUZGOztBQUlBO0FBQ0E7QUFDQSxRQUFPLGdCQUFQLENBQXdCLFlBQXhCLEVBQXFDLFlBQVU7QUFDOUMsVUFBUSxHQUFSLENBQVksVUFB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LENBQTRCLFdBQTVCLEVBQWI7QUFDQTtBQUNBO0FBQ0QsTUFBRyxFQUFFLE9BQUYsQ0FBVSxDQUFWLEVBQWEsTUFBYixDQUFvQixPQUFwQixDQUE0QixXQUE1QixNQUEyQyxPQUE5QyxFQUFzRDtBQUNyRDtBQUNBO0FBQ0QsSUFBRSxjQUFGO0FBQ0E7O0FBR0Q7QUFDQSxVQUFTLGdCQUFULENBQTBCLFlBQTFCLEVBQXVDLFdBQXZDLEVBQW1ELEtBQW5EO0FBQ0EsVUFBUyxnQkFBVCxDQUEwQixXQUExQixFQUFzQyxXQUF0QyxFQUFrRCxLQUFsRDtBQUNBO0FBQ0E7QUFDQSxVQUFTLGdCQUFULENBQTBCLGNBQTFCLEVBQXlDLFdBQXpDLEVBQXFELEtBQXJEO0FBQ0EsVUFBUyxnQkFBVCxDQUEwQixlQUExQixFQUEwQyxXQUExQyxFQUFzRCxLQUF0RDtBQUNBOzs7QUFHQTtBQUNBLEtBQUksVUFBUSxTQUFTLGNBQVQsQ0FBd0IsZ0JBQXhCLENBQVo7QUFDQSxTQUFRLGdCQUFSLENBQXlCLE9BQXpCLEVBQWlDLFlBQVU7QUFDMUMsTUFBSSxPQUFLLE9BQU8sU0FBUCxDQUFpQixZQUFqQixDQUFUO0FBQ0EsTUFBSSxnQkFBYyxTQUFTLGNBQVQsQ0FBd0IsZUFBeEIsQ0FBbEI7QUFDQSxnQkFBYyxTQUFkLEdBQXdCLGVBQWEsSUFBYixHQUFrQixJQUExQztBQUNBLFNBQU8sSUFBUCxDQUFZLHFCQUFaLEVBQWtDLElBQWxDO0FBQ0EsRUFMRCxFQUtFLEtBTEY7QUFPQSxDQWhJRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJvbmxvYWQ9ZnVuY3Rpb24oKXtcclxuXHR2YXIgc29ja2V0PWlvKCk7XHJcblx0dmFyIGNhbnZhcz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15Q2FudmFzXCIpO1xyXG5cdHZhciBjPWNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcblx0dmFyIHc9NjQwO1xyXG5cdHZhciBoPTY0MDtcclxuXHR2YXIgZHJhd2luZz1mYWxzZTtcclxuXHR2YXIgb2xkUG9zO1xyXG5cclxuXHRjYW52YXMud2lkdGg9dztcclxuXHRjYW52YXMuaGVpZ2h0PWg7XHJcblxyXG5cdC8v6IOM5pmv44Gv55m944Gr44Gq44KLXHJcblx0Yy5maWxsU3R5bGU9XCJyZ2IoMjU1LDI1NSwyNTUpXCI7XHJcblx0Yy5maWxsUmVjdCgwLDAsJChjYW52YXMpLndpZHRoKCksJChjYW52YXMpLmhlaWdodCgpKTtcclxuXHJcblx0Yy5zdHJva2VTdHlsZT1cIiMwMDAwMDBcIjtcclxuXHRjLmxpbmVXaWR0aD01O1xyXG5cdGMubGluZUpvaW49XCJyb3VuZFwiO1xyXG5cdGMubGluZUNhcD1cInJvdW5kXCI7XHJcblxyXG5cdC8v44K/44OD44OX6ZaL5aeL5pmC44Gr44CB57W144KS5o+P44GP5rqW5YKZ44KS44GZ44KLXHJcblx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZSl7XHJcblx0XHRkcmF3aW5nPXRydWU7XHJcblx0XHRvbGRQb3M9Z2V0UG9zVChlKTtcclxuXHR9LGZhbHNlKTtcclxuXHJcblx0Ly/jgr/jg4Pjg5fntYLkuobmmYLjgavjgIHntbXjgpLmj4/jgY/lvozlh6bnkIbjgpLooYzjgYZcclxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZWRcIixmdW5jdGlvbigpe1xyXG5cdFx0ZHJhd2luZz1mYWxzZVxyXG5cdH0sZmFsc2UpO1xyXG5cclxuXHQvL2dlc3R1cmXjgqTjg5njg7Pjg4jvvIgy5pys5oyH5Lul5LiK6Kem44KL44Go55m655Sf44GZ44KL77yJXHJcblx0Ly/ntYLkuobmmYLjgavjgoLntbXjgpLmj4/jgY/lvozlh6bnkIbjgpLooYzjgYZcclxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcImdlc3R1cmVlbmRcIixmdW5jdGlvbigpe1xyXG5cdFx0Y29uc29sZS5sb2coXCJtb3VzZW91dFwiKTtcclxuXHRcdGRyYXdpbmc9ZmFsc2U7XHJcblx0fSxmYWxzZSk7XHJcblxyXG5cdC8v5a6f6Zqb44Gr57W144KS5pu444GP5Yem55CGXHJcblx0Ly/liY3lm57kv53lrZjjgZfjgZ/kvY3nva7jgYvjgonnj77lnKjjga7kvY3nva7jgavnt5rjgpLlvJXjgY9cclxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLGZ1bmN0aW9uKGUpe1xyXG5cdHZhciBwb3MgPSBnZXRQb3NUKGUpO1xyXG5cdFx0aWYoZHJhd2luZyl7XHJcblx0XHRcdGMuYmVnaW5QYXRoKCk7XHJcblx0XHRcdGMubW92ZVRvKG9sZFBvcy54LG9sZFBvcy55KTtcclxuXHRcdFx0Yy5saW5lVG8ocG9zLngscG9zLnkpO1xyXG5cdFx0XHRjLnN0cm9rZSgpO1xyXG5cdFx0XHRjLmNsb3NlUGF0aCgpO1xyXG5cdFx0XHRvbGRQb3M9cG9zO1xyXG5cdFx0fVxyXG5cdH0sZmFsc2UpO1xyXG5cclxuXHQvL+OCv+ODg+ODl+mWoumAo+mWouaVsFxyXG5cdGZ1bmN0aW9uIHNjcm9sbFgoKXtyZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnR8fGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdDt9XHJcblx0ZnVuY3Rpb24gc2Nyb2xsWSgpe3JldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wfHxkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDt9XHJcblx0ZnVuY3Rpb24gZ2V0UG9zVChfZSl7XHJcblx0XHR2YXIgbW91c2VYPV9lLnRvdWNoZXNbMF0uY2xpZW50WC0kKGNhbnZhcykucG9zaXRpb24oKS5sZWZ0K3Njcm9sbFgoKTtcclxuXHRcdHZhciBtb3VzZVk9X2UudG91Y2hlc1swXS5jbGllbnRZLSQoY2FudmFzKS5wb3NpdGlvbigpLnRvcCtzY3JvbGxZKCk7XHJcblx0XHRyZXR1cm4ge3g6bW91c2VYLHk6bW91c2VZfTtcclxuXHR9XHJcblxyXG5cdC8v6Imy44Go57ea44Gu5aSq44GV44KS6Kit5a6a44GZ44KL6Zai5pWwXHJcblx0JChcIiNibGFja1wiKS5vbihcImNsaWNrXCIsZnVuY3Rpb24oKXtcclxuXHRcdGMuc3Ryb2tlU3R5bGU9XCJibGFja1wiO1x0XHRcclxuXHR9KTtcclxuXHQkKFwiI2JsdWVcIikub24oXCJjbGlja1wiLGZ1bmN0aW9uKCl7XHJcblx0XHRjLnN0cm9rZVN0eWxlPVwiYmx1ZVwiO1x0XHRcclxuXHR9KTtcclxuXHQkKFwiI3JlZFwiKS5vbihcImNsaWNrXCIsZnVuY3Rpb24oKXtcclxuXHRcdGMuc3Ryb2tlU3R5bGU9XCJyZWRcIjtcdFx0XHJcblx0fSk7XHJcblx0JChcIiNncmVlblwiKS5vbihcImNsaWNrXCIsZnVuY3Rpb24oKXtcclxuXHRcdGMuc3Ryb2tlU3R5bGU9XCJncmVlblwiO1x0XHRcclxuXHR9KTtcclxuXHQkKFwiI3NtYWxsXCIpLm9uKFwiY2xpY2tcIixmdW5jdGlvbigpe1xyXG5cdFx0Yy5saW5lV2lkdGg9NTtcdFx0XHJcblx0fSk7XHJcblx0JChcIiNtaWRkbGVcIikub24oXCJjbGlja1wiLGZ1bmN0aW9uKCl7XHJcblx0XHRjLmxpbmVXaWR0aD0xMDtcdFx0XHJcblx0fSk7XHJcblx0JChcIiNsYXJnZVwiKS5vbihcImNsaWNrXCIsZnVuY3Rpb24oKXtcclxuXHRcdGMubGluZVdpZHRoPTIwO1x0XHRcclxuXHR9KTtcclxuXHJcblx0JChcIiNkZWxldGVfYnV0dG9uXCIpLm9uKFwiY2xpY2tcIixmdW5jdGlvbigpe1xyXG5cdFx0Ly/og4zmma/jga/nmb3jgavjgarjgotcclxuXHRcdGMuZmlsbFN0eWxlPVwicmdiKDI1NSwyNTUsMjU1KVwiO1xyXG5cdFx0Yy5maWxsUmVjdCgwLDAsJChjYW52YXMpLndpZHRoKCksJChjYW52YXMpLmhlaWdodCgpKTtcclxuXHRcdC8vYy5jbGVhclJlY3QoMCwwLCQoY2FudmFzKS53aWR0aCgpLCQoY2FudmFzKS5oZWlnaHQoKSk7XHJcblx0fSk7XHJcblxyXG5cclxuXHQvL+ODluODqeOCpuOCtuOBruODh+ODleOCqeODq+ODiOWLleS9nOOCkuemgeatouOBmeOCi1xyXG5cclxuXHRmdW5jdGlvbiBzdG9wRGVmYXVsdChlKXtcclxuXHRcdC8vaWYoZS50b3VjaGVzWzBdLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCk9PVwibGlcIil7XHJcblx0XHRcdGNvbnNvbGUubG9nKGUudG91Y2hlc1swXS50YXJnZXQpO1xyXG5cdFx0aWYoZS50b3VjaGVzWzBdLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJsaVwiKXtcclxuXHRcdFx0Y29ub3NvbGUubG9nKGUudG91Y2hlc1swXS50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0aWYoZS50b3VjaGVzWzBdLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCk9PVwiaW5wdXRcIil7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHR9XHJcblxyXG5cclxuXHQvL+ODieOCreODpeODoeODs+ODiOOBruOCv+ODg+ODgeOCpOODmeODs+ODiOOBruWIneacn+WMllxyXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsc3RvcERlZmF1bHQsZmFsc2UpO1xyXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIixzdG9wRGVmYXVsdCxmYWxzZSk7XHJcblx0Ly9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIixzdG9wRGVmYXVsdCxmYWxzZSk7XHJcblx0Ly/jg4njgq3jg6Xjg6Hjg7Pjg4jjga7jgrjjgqfjgrnjg4Hjg6Pjg7zjgqTjg5njg7Pjg4jjga7liJ3mnJ/ljJZcclxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZ2VzdHVyZXN0YXJ0XCIsc3RvcERlZmF1bHQsZmFsc2UpO1xyXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJnZXN0dXJlY2hhbmdlXCIsc3RvcERlZmF1bHQsZmFsc2UpO1xyXG5cdC8vZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImdlc3R1cmVlbmRcIixzdG9wRGVmYXVsdCxmYWxzZSk7XHJcblxyXG5cclxuXHQvL+eUu+WDj+WkieaPm+OBmeOCi+WHpueQhlxyXG5cdHZhciB0b0ltYWdlPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9JbWFnZV9idXR0b25cIik7XHJcblx0dG9JbWFnZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGRhdGE9Y2FudmFzLnRvRGF0YVVSTChcImltYWdlL2pwZWdcIik7XHJcblx0XHR2YXIgaW1hZ2VDb250ZW50cz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImltYWdlQ29udGVudHNcIik7XHJcblx0XHRpbWFnZUNvbnRlbnRzLmlubmVySFRNTD1cIjxpbWcgc3JjPSdcIitkYXRhK1wiJz5cIjtcclxuXHRcdHNvY2tldC5lbWl0KFwicHVzaEltYWdlRnJvbUNsaWVudFwiLGRhdGEpO1xyXG5cdH0sZmFsc2UpO1xyXG5cclxufSJdfQ==
