'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator').default;

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.indent = indent;
exports.streamToStream = streamToStream;
exports.streamToLetterStream = streamToLetterStream;

var _stream = require('stream');

var _string_decoder = require('string_decoder');

/**
 * Indents a multi-line string.
 *
 * @param {string} string Multi-line string to indent
 * @param {string} indent Indent to use
 * @return {string} Indented string
 */
/** @function 
* @param {string} string 
* @param {string} indent 
* @returns {string} */
function indent(string, indent) {
    return string.split('\n').map(function (line) {
        return indent + line;
    }).join('\n');
}

/** @function 
* @param stream 
* @param callback */
function streamToStream(stream, callback) {
    const newStream = new _stream.WritableStream();
    stream.on('data', function (data) {
        return callback(function (data) {
            return newStream.write(data);
        }, data);
    });
    stream.on('done', function () {
        return newStream.end();
    });
    return newStream;
}

/** @function 
* @param stream */
function streamToLetterStream(stream) {
    return streamToStream(stream, function (write, buffer) {
        for (var _iterator = buffer.toString(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
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

            write(letter);
        }
    });
}
//# sourceMappingURL=utils.js.map