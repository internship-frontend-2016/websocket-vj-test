'use strict';
var gulp = require('gulp');
var C = require('../config');

// watch
gulp.task('watch', ['watchify', 'browser-sync'],function () {
	gulp.watch(C.src.root+'/**/*.js', ['lint:js']);
	gulp.watch(C.src.ejs, ['ejs']);
	gulp.watch(C.src.sass, ['sass']);
	gulp.watch(C.src.copy, ['copy']);
	// imagesも追加したほうがいいかも
});
