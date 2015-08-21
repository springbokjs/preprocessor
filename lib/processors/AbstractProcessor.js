"use strict";

var _createClass = require("babel-runtime/helpers/create-class").default;

var _classCallCheck = require("babel-runtime/helpers/class-call-check").default;

Object.defineProperty(exports, "__esModule", {
    value: true
});
/** @class AbstractProcessor 
* @param preprocessor */
let AbstractProcessor = (function () {
    function AbstractProcessor(preprocessor) {
        _classCallCheck(this, AbstractProcessor);

        this.preprocessor = preprocessor;
    }

    _createClass(AbstractProcessor, [{
        key: "hasDefined",
        /** @memberof AbstractProcessor 
        * @instance 
        * @method hasDefined 
        * @param key */value: function hasDefined(key) {
            return this.preprocessor.hasDefined(key);
        }
    }, {
        key: "getDefined",
        /** @memberof AbstractProcessor 
        * @instance 
        * @method getDefined 
        * @param key */value: function getDefined(key) {
            return this.preprocessor.getDefined(key);
        }
    }]);

    return AbstractProcessor;
})();

exports.default = AbstractProcessor;
module.exports = exports.default;
//# sourceMappingURL=AbstractProcessor.js.map