'use strict';
var gulp = require('gulp');
var C = require('../config');
var ejs = require('gulp-ejs');
var browserSync = require('browser-sync');


// ejsのコンパイル
gulp.task("ejs", function() {
  gulp.src(C.src.ejs)
  .pipe(ejs())
  .pipe(gulp.dest(C.build.ejs))
  .pipe(browserSync.reload({ stream : true }));
});
