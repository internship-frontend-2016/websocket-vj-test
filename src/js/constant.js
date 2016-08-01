'use strict';

/**
 * readOnlyな値を設定する
 * @param obj 対象のオブジェクト
 * @param propName プロパティ名
 * @param value プロパティ値
 * @private
 */
var _setProps = function (obj, propName, value) {
  Object.defineProperty(obj, propName, {
    value: value,
    writable: false
  });
};

/**
 * システム全体で利用する静的な値を定義
 */
var Constant = {};

_setProps(Constant, 'NAME', 100);


module.exports = Constant;
