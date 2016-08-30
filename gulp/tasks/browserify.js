'use strict';
var browserify = require('browserify');
var browserSync = require('browser-sync');
var babelify = require('babelify');
var gulpConnect = require('gulp-connect');
var watchify = require('watchify');
var mergeStream = require('merge-stream');
var bundleLogger = require('../util/bundleLogger');
var gulp = require('gulp');
var handleErrors = require('../util/handleErrors');
var source = require('vinyl-source-stream');
var _config = require('../config');
var config = _config.browserify;
var _ = require('lodash');
var $ = require('gulp-load-plugins')();
var buffer = require('vinyl-buffer');

/**
 * browserify処理
 * @param devMode
 * @param prodMode
 * @returns {*}
 */
var browserifyTask = function (devMode, prodMode) {
    var browserifyThis = function (bundleConfig) {
        _.extend(bundleConfig, {
            transform: 'partialify'
        });
        if (devMode) {
            _.extend(bundleConfig, watchify.args, {
                debug: true
            });
            bundleConfig = _.omit(bundleConfig, ['external', 'require']);
        }
        var b = browserify(bundleConfig)
                .transform("babelify", {presets: ["es2015", "react"]}); // es6から変換

        var bundle = function () {
            // スタートログ
            bundleLogger.start(bundleConfig.outputName);
            // bundle開始
            if (prodMode) {
                $.util.log('Production Build');
                return b.bundle()
                    .on('error', handleErrors)
                    .pipe(source(bundleConfig.outputName))
                    .pipe(buffer()).pipe($.uglify())
                    .pipe(gulp.dest(bundleConfig.build));
            } else {
                return b.bundle()
                    .on('error', handleErrors)
                    .pipe(source(bundleConfig.outputName))
                    .pipe(gulp.dest(bundleConfig.build))
                    .pipe(browserSync.reload({
                        stream: true
                    })).pipe(gulpConnect.reload({
                        stream: true
                    }));
            }
        };
        if (devMode) {
            b = watchify(b);
            b.on('update', bundle);
            bundleLogger.watch(bundleConfig.outputName);
        } else {
            if (bundleConfig.require) {
                b.require(bundleConfig.require);
            }
            if (bundleConfig.external) {
                b.external(bundleConfig.external);
            }
        }
        return bundle();
    };
    return mergeStream.apply(gulp, _.map(config.bundleConfigs, browserifyThis));
};

// browserify タスク
// browserifyのみを起動
gulp.task('browserify', function () {
    return browserifyTask(false, false);
});

gulp.task('browserify-prod', function () {
    return browserifyTask(false, true);
});

// devModeを有効にして起動できるようにするため、exportsする
module.exports = browserifyTask;
