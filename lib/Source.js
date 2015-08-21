'use strict';

var _createClass = require('babel-runtime/helpers/create-class').default;

var _classCallCheck = require('babel-runtime/helpers/class-call-check').default;

var _asyncToGenerator = require('babel-runtime/helpers/async-to-generator').default;

var _getIterator = require('babel-runtime/core-js/get-iterator').default;

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default').default;

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _sourceMap = require('source-map');

var _Preprocessor = require('./Preprocessor');

var _Preprocessor2 = _interopRequireDefault(_Preprocessor);

const isSpaceRegexp = /\s/;

/** @class Source 
* @param {Preprocessor} preprocessor 
* @param {string} filename 
* @param {Stream} output */
let Source = (function () {

    /**
     * @param {Preprocessor} preprocessor
     * @param {string} filename
     * @param {string|Stream} [output]
     */

    function Source(preprocessor, filename, output) {
        _classCallCheck(this, Source);

        this._lastOriginalPosition = { line: 1, col: 0 };
        this._lastOutputPosition = { line: 1, col: 0 };

        this._filename = filename;
        this._state = 'none';
        this._preprocessor = preprocessor;
        this._sourcemap = new _sourceMap.SourceMapGenerator({
            // file: destfile,
        });
        this._output = output || process.stdout;
        this._buffer = '';
        this.expectingEOF = 0;
        this._throwAway = false;
    }

    _createClass(Source, [{
        key: 'getSourceMap',
        /** @memberof Source 
        * @instance 
        * @method getSourceMap */value: function getSourceMap() {
            return this._sourcemap;
        }
    }, {
        key: 'processLetter',
        /** @memberof Source 
        * @instance 
        * @method processLetter 
        * @param letter */value: _asyncToGenerator(function* (letter) {
            // console.log('process letter ', letter, this._state);
            switch (this._state) {
                case 'none':
                case 'after-processor':
                    if (letter === '/') {
                        this.writeBufferToOutput();
                        this._state = 'first-slash';
                        this._buffer += letter;
                        break;
                    }

                    if (this._state === 'after-processor') {
                        const result = yield this._lastProcessor.processLetter({
                            letter,
                            source: this,
                            buffer: this._buffer
                        });

                        if (result) {
                            if (result.ignoreLetter && result.ignoreBuffer) {
                                result.replaceBy = '';
                            }

                            if (result.bufferLetter) {
                                this._buffer += letter;
                                break;
                            } else if (result.replaceBy) {
                                this.writeToOutput(result.replaceBy, true);
                                this.ignoreBuffer();
                                break;
                            } else if (result.ignoreBuffer) {
                                this.ignoreBuffer();
                                this._state = 'none';
                                // keep going to write current letter
                            }
                        } else {
                                this._buffer += letter;
                                this.writeBufferToOutput();
                                this._state = 'none';
                            }
                    }

                    if (this.keepBuffering) {
                        this._buffer += letter;
                    } else {
                        this.writeToOutput(letter);
                        this.advancePosition(this._lastOriginalPosition, letter);
                    }

                    break;

                case 'first-slash':
                    if (letter === '/') {
                        this._state = 'oneline-comment';
                        this._buffer += letter;
                    } else if (letter === '*') {
                        this._state = 'multiline-comment';
                        this._buffer += letter;
                    } else {
                        this._state = 'none';
                        this.writeToOutput('/' + letter);
                        this._buffer = '';
                    }

                    break;

                case 'online-comment':
                case 'multiline-comment':
                    this._buffer += letter;
                    if (isSpaceRegexp.test(letter)) {
                        this._buffer += letter;
                    } else if (letter === '#') {
                        this._currentInstruction = '';
                        this._state += '-instruction';
                    } else {
                        this._output.write(this._buffer);
                        this._buffer = '';
                        this._state = 'none';
                    }

                    break;

                case 'online-comment-instruction':
                case 'multiline-comment-instruction':
                    this._buffer += letter;
                    if (this._state === 'online-comment-instruction' && letter === '\n') {
                        yield this.callProcessor();
                        break;
                    }

                    if (isSpaceRegexp.test(letter)) {
                        this._currentInstructionContent = '';
                        this._state += '-content-start';
                        break;
                    }

                    if (this._state.startsWith('multiline') && letter === '*') {
                        this._state = 'multiline-comment-instruction-star';
                        this._previousState = 'multiline-comment-instruction';
                        break;
                    }

                    this._currentInstruction += letter;

                    break;

                case 'online-comment-instruction-content-start':
                case 'multiline-comment-instruction-content-start':
                    this._buffer += letter;
                    if (!isSpaceRegexp.test(letter)) {
                        if (this._state.startsWith('multiline') && letter === '*') {
                            this._state = 'multiline-comment-instruction-star';
                            this._previousState = 'multiline-comment-instruction-content-start';
                        } else {
                            this._currentInstructionContent = letter;
                            this._state = this._state.slice(0, -6);
                        }
                    }

                    break;

                case 'online-comment-instruction-content':
                case 'multiline-comment-instruction-content':
                    this._buffer += letter;
                    if (this._state.startsWith('multiline') && letter === '*') {
                        this._state = 'multiline-comment-instruction-star';
                        this._previousState = 'multiline-comment-instruction-content';
                        break;
                    } else if (this._state === 'online-comment-instruction-content' && letter === '\n') {
                        yield this.callProcessor();
                        break;
                    }

                    this._currentInstructionContent += letter;

                    break;

                case 'multiline-comment-instruction-star':
                    this._buffer += letter;

                    if (letter === '*') {
                        this._currentInstructionContent += '*';
                        break;
                    }

                    if (letter !== '/') {
                        this._currentInstructionContent += '*' + letter;
                        this._state = this._previousState;
                        break;
                    }

                    yield this.callProcessor();

                    break;
            }
        })
    }, {
        key: 'end',
        /** @memberof Source 
        * @instance 
        * @method end */value: _asyncToGenerator(function* () {
            // console.log('end', this._state);

            if (this.expectingEOF !== 0) {
                throw new Error('Unexpected EOF');
            }

            if (this._state === 'none') {
                if (this._buffer) {
                    // still waiting for the end of an instruction
                    throw new Error('Unexpected EOF');
                }

                return;
            }

            if (this._state.startsWith('online-comment-instruction')) {
                this.callProcessor();
                return;
            }

            if (this._state.startsWith('multiline-comment')) {
                throw new Error('Unexpected EOF: expecting end of multiline comment');
            }

            throw new Error('Unexpected EOF');
        })
    }, {
        key: 'callProcessor',
        /** @memberof Source 
        * @instance 
        * @method callProcessor */value: _asyncToGenerator(function* () {
            const processor = this._preprocessor._processors.get(this._currentInstruction);
            this._lastProcessor = processor;

            if (!processor) {
                throw new Error('Missing processor for instruction ' + this._currentInstruction);
            }

            const result = yield processor.process({
                instruction: this._currentInstruction,
                source: this,
                preprocessor: this._preprocessor,
                content: this._currentInstructionContent.trimRight()
            });

            if (result && result.replaceBy !== undefined) {
                this.writeToOutput(result.replaceBy, true);
                this.ignoreBuffer();
            } else if (!result || !result.keepBuffering) {
                this.writeBufferToOutput();
            }

            this.keepBuffering = result && result.keepBuffering;

            if (result && result.throwAway !== undefined) {
                this._throwAway = result.throwAway;
            }

            if (result && result.keepCallMe) {
                this._state = 'after-processor';
            } else {
                this._state = 'none';
            }
        })
    }, {
        key: 'advancePosition',
        /** @memberof Source 
        * @instance 
        * @method advancePosition 
        * @param position 
        * @param letter */value: function advancePosition(position, letter) {
            if (letter === '\n') {
                position.line = this._lastOutputPosition.line + 1;
                position.col = 0;
                return false;
            } else {
                position.col++;
                return true;
            }
        }
    }, {
        key: 'writeBufferToOutput',
        /** @memberof Source 
        * @instance 
        * @method writeBufferToOutput */value: function writeBufferToOutput() {
            for (var _iterator = this._buffer, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
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

                this.writeToOutput(letter);
                this.advancePosition(this._lastOriginalPosition, letter);
            }

            this._buffer = '';
        }
    }, {
        key: 'writeToOutput',
        /** @memberof Source 
        * @instance 
        * @method writeToOutput 
        * @param {string} string 
        * @param {boolean} force */value: function writeToOutput(string, force) {
            if (this._throwAway && !force) {
                return;
            }

            this._output.write(string);
            for (var _iterator2 = string, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
                var _ref2;

                if (_isArray2) {
                    if (_i2 >= _iterator2.length) break;
                    _ref2 = _iterator2[_i2++];
                } else {
                    _i2 = _iterator2.next();
                    if (_i2.done) break;
                    _ref2 = _i2.value;
                }

                let letter = _ref2;

                if (letter !== '\n') {
                    this._sourcemap.addMapping({
                        generated: {
                            line: this._lastOriginalPosition.line,
                            column: this._lastOriginalPosition.col
                        },

                        source: this._filename,
                        original: {
                            line: this._lastOutputPosition.line,
                            column: this._lastOutputPosition.col
                        },

                        name: letter
                    });
                }

                this.advancePosition(this._lastOutputPosition, letter);
            }
        }
    }, {
        key: 'ignoreBuffer',
        /** @memberof Source 
        * @instance 
        * @method ignoreBuffer */value: function ignoreBuffer() {
            for (let letter in this._buffer) {
                this.advancePosition(this._lastOriginalPosition, letter);
            }

            this._buffer = '';
        }
    }]);

    return Source;
})();

exports.default = Source;
module.exports = exports.default;
//# sourceMappingURL=Source.js.map