'use strict';
var gulp = require('gulp');
var browserifyTask = require('./browserify');

// src/copy -> build へコピーする
gulp.task('watchify', function () {
    // devModeをonでbrowserifyを呼び出す
    return browserifyTask(true);
});
