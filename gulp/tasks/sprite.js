'use strict';
var gulp = require('gulp');
var spritesmith = require('gulp.spritesmith');
var C = require('../config');

gulp.task('sprite', function () {
  var spriteData = gulp.src(C.src.img + '/sprite/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.scss',
    imgPath: '../img/sprite.png',
    cssFormat: 'scss',
    padding: 10
  }));
  spriteData.img.pipe(gulp.dest(C.build.img));
  spriteData.css.pipe(gulp.dest(C.src.root + '/sass'));
});
