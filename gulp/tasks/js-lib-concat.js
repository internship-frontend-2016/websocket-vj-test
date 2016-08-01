'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var config = require('../config').jsLibConcat;

gulp.task('js-lib-concat', function() {
  gulp.src(config.srcs)
  .pipe($.concat(config.name))
  .pipe($.if(global.isRelease, $.uglify({
    preserveComments: 'some'
  })))
  .pipe(gulp.dest(config.build))
  .pipe($.size());
});
