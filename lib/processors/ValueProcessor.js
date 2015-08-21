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

const nextLetter = [';', ',', ')', '.', '+', '-', '*', '/', ' '];

/** @class ValueProcessor */
let ValueProcessor = (function (_AbstractProcessor) {
    _inherits(ValueProcessor, _AbstractProcessor);

    function ValueProcessor() {
        _classCallCheck(this, ValueProcessor);

        _get(Object.getPrototypeOf(ValueProcessor.prototype), 'constructor', this).apply(this, arguments);
    }

    _createClass(ValueProcessor, [{
        key: 'process',
        /** @memberof ValueProcessor 
        * @instance 
        * @method process 
        * @param */value: _asyncToGenerator(function* (_ref) {
            let instruction = _ref.instruction;
            let content = _ref.content;

            if (instruction === 'eval') {
                content = eval(content);
            } else {
                content = this.getDefined(content);
            }

            return {
                keepCallMe: true,
                replaceBy: String(content)
            };
        })
    }, {
        key: 'processLetter',
        /** @memberof ValueProcessor 
        * @instance 
        * @method processLetter 
        * @param */value: _asyncToGenerator(function* (_ref2) {
            let buffer = _ref2.buffer;
            let letter = _ref2.letter;

            if (buffer.length !== 0) {
                if (buffer === '0' && nextLetter.indexOf(letter) !== -1) {
                    return {
                        ignoreBuffer: true,
                        ignoreLetter: letter === ' '
                    };
                }

                if (buffer === "'" && letter === "'") {
                    return {
                        ignoreBuffer: true,
                        ignoreLetter: true
                    };
                }

                if ((buffer === 'fals' || buffer === 'tru') && letter === 'e') {
                    return {
                        ignoreBuffer: true,
                        ignoreLetter: true
                    };
                }

                if (buffer.length > 5) {
                    return false;
                }
            }

            if (letter === '0' || letter === "'" || letter === 'f' || letter === 't') {
                return {
                    bufferLetter: true
                };
            }
        })
    }]);

    return ValueProcessor;
})(_AbstractProcessor3.default);

exports.default = ValueProcessor;
module.exports = exports.default;
//# sourceMappingURL=ValueProcessor.js.map