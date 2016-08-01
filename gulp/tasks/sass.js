'use strict';
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var C = require('../config');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var handleErrors = require('../util/handleErrors');
var browserSync = require('browser-sync');

var sassOption = {
  // outputStyle: 'compressed'
};

// sassコンパイル
gulp.task('sass', function () {
  return gulp.src(C.src.sass)
  .pipe(sourcemaps.init())
  .pipe(sass(sassOption).on('error', handleErrors))
  .pipe($.plumber())
  .pipe($.autoprefixer({ browsers : C.autoprefixer_browsers }))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest(C.build.sass))
  .pipe(browserSync.reload({ stream : true }));
});
