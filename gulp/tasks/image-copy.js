'use strict';
var gulp = require('gulp');
var C = require('../config');
var changed = require('gulp-changed');

// src/img -> build へコピーする
gulp.task('imgCopy', function () {
    return gulp.src(C.src.imgCopy)
    .pipe(changed(C.build.img))  // 変更ファイルのみコピー
    .pipe(gulp.dest(C.build.img));
});
