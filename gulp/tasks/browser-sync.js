'use strict';
var gulp = require('gulp');
var C = require('../config');
var browserSync = require('browser-sync');

// Browser sync
gulp.task('browser-sync', function () {
    browserSync(C.browserSync);
});
