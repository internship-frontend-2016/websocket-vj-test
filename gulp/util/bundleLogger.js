'use strict';
// browserify用のログ処理
var gutil = require('gulp-util');
var prettyHrtime = require('pretty-hrtime');
var startTime = void 0;

module.exports = {
    // bundle開始
    start: function(filepath) {
        startTime = process.hrtime();
        return gutil.log('Bundling', gutil.colors.green(filepath) + '...');
    },

    // watching
    watch: function(bundleName) {
        return gutil.log('Watching files required by', gutil.colors.yellow(bundleName));
    },

    // bundle終了
    end: function(filepath) {
        var prettyTime, taskTime;
        taskTime = process.hrtime(startTime);
        prettyTime = prettyHrtime(taskTime);
        return gutil.log('Bundled', gutil.colors.green(filepath), 'in', gutil.colors.magenta(prettyTime));
    }
};
