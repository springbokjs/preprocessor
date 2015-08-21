'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default').default;

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _ValueProcessor = require('./ValueProcessor');

var _ValueProcessor2 = _interopRequireDefault(_ValueProcessor);

var _IfProcessor = require('./IfProcessor');

var _IfProcessor2 = _interopRequireDefault(_IfProcessor);

exports.default = [{
    instructions: ['val', 'eval', 'value'],
    Class: _ValueProcessor2.default
}, {
    instructions: ['ifdef', 'ifnotdef', 'if', 'ifnot', 'elseif', 'elseifdef', 'else', '/ifdef', '/ifnotdef', '/if', '/ifnot'],
    Class: _IfProcessor2.default
}];
module.exports = exports.default;
//# sourceMappingURL=index.js.map