/* global test, suite */

'use strict';

var _asyncToGenerator = require('babel-runtime/helpers/async-to-generator').default;

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default').default;

var _proclaim = require('proclaim');

var _proclaim2 = _interopRequireDefault(_proclaim);

var _libPreprocessor = require('../../lib/Preprocessor');

var _libPreprocessor2 = _interopRequireDefault(_libPreprocessor);

suite('', function () {
    const p = new _libPreprocessor2.default({
        defines: {
            value: 50,
            valueString: 'test',
            trueVar: true,
            falseVar: false
        }
    });

    p.addDefaultProcessors();

    test('test val', /** @function */_asyncToGenerator(function* () {
        const content = { string: '', write(string) {
                this.string += string;
            } };

        const result = yield p.process('test.js', 'test(/* #val value */0);', content);
        _proclaim2.default.strictEqual(content.string, 'test(50);');
        _proclaim2.default.strictEqual(result.getSourceMap().toString(), '{"version":3,"sources":["test.js"],' + '"names":["t","e","s","(","5","0",")",";"],' + '"mappings":"AAAAA,CAACC,CAACC,CAACF,CAACG,CAACC,AAACC,kBAACC,CAACC"}');
    }));

    test('test eval', /** @function */_asyncToGenerator(function* () {
        const content = { string: '', write(string) {
                this.string += string;
            } };

        const result = yield p.process('test.js', 'test(/* #eval 3*4 */0);', content);
        _proclaim2.default.strictEqual(content.string, 'test(12);');
    }));

    test('test ifdef and ifnotdef', /** @function */_asyncToGenerator(function* () {
        const content = { string: '', write(string) {
                this.string += string;
            } };

        const result = yield p.process('test.js', 'test(/* #ifdef value */1/* #ifnotdef value */2/* #/if *//* #/if */' + '/* #ifdef value */3/* #/if *//* #ifnotdef value */4/* #/if */);', content);
        _proclaim2.default.strictEqual(content.string, 'test(13);');
    }));

    test('test if and ifnot', /** @function */_asyncToGenerator(function* () {
        const content = { string: '', write(string) {
                this.string += string;
            } };

        const result = yield p.process('test.js', 'test(/* #if trueVar */1/* #ifnot trueVar */2/* #/if *//* #/if */' + '/* #if trueVar */3/* #/if *//* #ifnot trueVar */4/* #/if */);', content);
        _proclaim2.default.strictEqual(content.string, 'test(13);');
    }));

    test('test else', /** @function */_asyncToGenerator(function* () {
        const content = { string: '', write(string) {
                this.string += string;
            } };

        const result = yield p.process('test.js', 'test(/* #if trueVar */1/* #else */2/* #/if */' + '/* #ifnot trueVar */3/* #else */4/* #/if */);', content);
        _proclaim2.default.strictEqual(content.string, 'test(14);');
    }));

    test('test elseif', /** @function */_asyncToGenerator(function* () {
        const content = { string: '', write(string) {
                this.string += string;
            } };

        const result = yield p.process('test.js', 'test(/* #if falseVar */1/* #elseif trueVar */2/* #/if */' + '/* #if trueVar */3/* #elseif trueVar */4/* #/if */' + '/* #if falseVar */5/* #elseif falseVar */6/* #elseif trueVar */7/* #/if */);', content);
        _proclaim2.default.strictEqual(content.string, 'test(237);');
    }));
});
//# sourceMappingURL=test.js.map