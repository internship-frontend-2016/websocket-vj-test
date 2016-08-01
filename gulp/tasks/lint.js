'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish-source');
var handleErrors = require('../util/handleErrors');
var config = require('../config');

gulp.task('lint:js', function() {
	return gulp.src(config.lintfiles)
	.pipe(jshint())
	.pipe(jshint.reporter(stylish))
	.on('error', handleErrors);
});
