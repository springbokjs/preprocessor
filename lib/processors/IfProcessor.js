'use strict';

var _get = require('babel-runtime/helpers/get').default;

var _inherits = require('babel-runtime/helpers/inherits').default;

var _createClass = require('babel-runtime/helpers/create-class').default;

var _classCallCheck = require('babel-runtime/helpers/class-call-check').default;

var _asyncToGenerator = require('babel-runtime/helpers/async-to-generator').default;

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default').default;

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _AbstractProcessor2 = require('./AbstractProcessor');

var _AbstractProcessor3 = _interopRequireDefault(_AbstractProcessor2);

/** @class IfProcessor */
let IfProcessor = (function (_AbstractProcessor) {
    _inherits(IfProcessor, _AbstractProcessor);

    function IfProcessor() {
        _classCallCheck(this, IfProcessor);

        _get(Object.getPrototypeOf(IfProcessor.prototype), 'constructor', this).apply(this, arguments);
        this.stack = [];
        this.throwAway = false;
    }

    _createClass(IfProcessor, [{
        key: 'process',
        /** @memberof IfProcessor 
        * @instance 
        * @method process 
        * @param */value: _asyncToGenerator(function* (_ref) {
            var _this = this;

            let source = _ref.source;
            let instruction = _ref.instruction;
            let content = _ref.content;

            const pop = function pop() {
                source.expectingEOF--;
                const value = _this.stack.pop();

                if (_this.stack.length === 0) {
                    _this.throwAway = false;
                } else {
                    _this.throwAway = _this.stack.some(function (value) {
                        return !value.includes || value.throwAway;
                    });
                }

                return value;
            };

            let includes;
            let throwAway = false;
            if (instruction === 'elseif' || instruction === 'elseifdef') {
                instruction = instruction === 'elseif' ? 'if' : 'ifdef';
                const value = pop();
                throwAway = value.includes || value.throwAway;
            }

            if (instruction === 'ifdef') {
                includes = this.hasDefined(content);
            } else if (instruction === 'ifnotdef') {
                includes = !this.hasDefined(content);
            } else if (instruction === 'if') {
                includes = !!this.getDefined(content);
            } else if (instruction === 'ifnot') {
                includes = !this.getDefined(content);
            } else if (instruction === 'else') {
                const previous = pop();
                includes = !previous.includes && !previous.throwAway;
                instruction = 'if';
            }

            if (['ifdef', 'ifnotdef', 'if', 'ifnot'].indexOf(instruction) !== -1) {
                source.expectingEOF++;
                if (throwAway) {
                    this.throwAway = true;
                } else if (!this.throwAway && !includes) {
                    this.throwAway = !includes;
                }

                this.stack.push({ includes, throwAway });
            } else {
                pop();
            }

            return {
                replaceBy: '',
                throwAway: this.throwAway
            };
        })
    }]);

    return IfProcessor;
})(_AbstractProcessor3.default);

exports.default = IfProcessor;
module.exports = exports.default;
//# sourceMappingURL=IfProcessor.js.map