'use strict';

var _createClass = require('babel-runtime/helpers/create-class').default;

var _classCallCheck = require('babel-runtime/helpers/class-call-check').default;

var _asyncToGenerator = require('babel-runtime/helpers/async-to-generator').default;

var _Map = require('babel-runtime/core-js/map').default;

var _Promise = require('babel-runtime/core-js/promise').default;

var _getIterator = require('babel-runtime/core-js/get-iterator').default;

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default').default;

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _fs = require('fs');

var _processors = require('./processors');

var _processors2 = _interopRequireDefault(_processors);

// import Processor from './Processor';

var _Source = require('./Source');

var _Source2 = _interopRequireDefault(_Source);

var _utils = require('./utils');

/** @class Preprocessor 
* @param {Object} options */
let Preprocessor = (function () {
    function Preprocessor(options) {
        _classCallCheck(this, Preprocessor);

        this._processors = new _Map();

        this._options = options;
        // include(?:Once)?|ifn?def|ifelse|if|\/if|endif|else|el(?:se)?if|eval|value|val|setbasedir
    }

    _createClass(Preprocessor, [{
        key: 'hasDefined',
        /** @memberof Preprocessor 
        * @instance 
        * @method hasDefined 
        * @param key 
        * @returns {boolean} */value: function hasDefined(key) {
            return key in this._options.defines;
        }
    }, {
        key: 'getDefined',
        /** @memberof Preprocessor 
        * @instance 
        * @method getDefined 
        * @param key */value: function getDefined(key) {
            if (!this.hasDefined(key)) {
                throw new Error('Missing defined value: "' + key + '"');
            }

            return this._options.defines[key];
        }
    }, {
        key: 'addDefaultProcessors',
        /** @memberof Preprocessor 
        * @instance 
        * @method addDefaultProcessors */value: function addDefaultProcessors() {
            var _this = this;

            _processors2.default.forEach(function (def) {
                const processor = new def.Class(_this);

                def.instructions.forEach(function (instruction) {
                    _this.addProcessor(instruction, processor);
                });
            });
        }
    }, {
        key: 'addProcessor',
        /** @memberof Preprocessor 
        * @instance 
        * @method addProcessor 
        * @param {string} instruction 
        * @param {Processor} processor */value: function addProcessor(instruction, processor) {
            this._processors.set(instruction, processor);
        }
    }, {
        key: 'processFile',
        /** @memberof Preprocessor 
        * @instance 
        * @method processFile 
        * @param {string} filepath 
        * @param {string} filename 
        * @param output 
        * @returns {Promise.<Source>} */value: function processFile(filepath, filename, output) {
            const fileStream = (0, _fs.createReadStream)(filepath);
            return this.processStream(filename || filepath, fileStream, output);
        }
    }, {
        key: 'processStream',
        /** @memberof Preprocessor 
        * @instance 
        * @method processStream 
        * @param filename 
        * @param stream 
        * @param output */value: function processStream(filename, stream, output) {
            var _this2 = this;

            return new _Promise(function (resolve, reject) {
                const source = new _Source2.default(_this2, filename, output);
                const stream = (0, _utils.streamToLetterStream)(stream);

                stream.on('data', function (letter) {
                    stream.pause();
                    source.processLetter(letter).then(function () {
                        stream.resume();
                    }).catch(reject);
                });

                stream.on('end', function () {
                    source.end().then(function () {
                        return resolve(source);
                    }).catch(reject);
                });
            });
        }
    }, {
        key: 'process',
        /** @memberof Preprocessor 
        * @instance 
        * @method process 
        * @param {string} filename 
        * @param content 
        * @param output 
        * @returns {Source} */value: _asyncToGenerator(function* (filename, content, output) {
            if (content instanceof Buffer) {
                content = content.toString();
            }

            const source = new _Source2.default(this, filename, output);

            for (var _iterator = content, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
                var _ref;

                if (_isArray) {
                    if (_i >= _iterator.length) break;
                    _ref = _iterator[_i++];
                } else {
                    _i = _iterator.next();
                    if (_i.done) break;
                    _ref = _i.value;
                }

                let letter = _ref;

                yield source.processLetter(letter);
            }

            yield source.end();
            return source;
        })
    }]);

    return Preprocessor;
})();

exports.default = Preprocessor;
module.exports = exports.default;
//# sourceMappingURL=Preprocessor.js.map