var $, gulp, C;
gulp = require('gulp');
$ = require('gulp-load-plugins')();
C = require('../config');

// copy ディレクトリをコピーする
gulp.task('copy', function () {
    return gulp.src(C.src.copy)
    .pipe(gulp.dest(C.build.copy));
});
