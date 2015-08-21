/* global test, suite */

import assert from 'proclaim';
import Preprocessor from '../../lib/Preprocessor';

suite('', () => {
    const p = new Preprocessor({
        defines: {
            value: 50,
            valueString: 'test',
            trueVar: true,
            falseVar: false,
        },
    });

    p.addDefaultProcessors();

    test('test val', async function() {
        const content = { string: '', write(string) { this.string += string; } };

        const result = await p.process('test.js', 'test(/* #val value */0);', content);
        assert.strictEqual(content.string, 'test(50);');
        assert.strictEqual(result.getSourceMap().toString(), `{"version":3,"sources":["test.js"],`
            + `"names":["t","e","s","(","5","0",")",";"],`
            + `"mappings":"AAAAA,CAACC,CAACC,CAACF,CAACG,CAACC,AAACC,kBAACC,CAACC"}`);
    });

    test('test eval', async function() {
        const content = { string: '', write(string) { this.string += string; } };

        const result = await p.process('test.js', 'test(/* #eval 3*4 */0);', content);
        assert.strictEqual(content.string, 'test(12);');
    });

    test('test ifdef and ifnotdef', async function() {
        const content = { string: '', write(string) { this.string += string; } };

        const result = await p.process('test.js', 'test(/* #ifdef value */1/* #ifnotdef value */2/* #/if *//* #/if */'
                + '/* #ifdef value */3/* #/if *//* #ifnotdef value */4/* #/if */);', content);
        assert.strictEqual(content.string, 'test(13);');
    });

    test('test if and ifnot', async function() {
        const content = { string: '', write(string) { this.string += string; } };

        const result = await p.process('test.js', 'test(/* #if trueVar */1/* #ifnot trueVar */2/* #/if *//* #/if */'
                + '/* #if trueVar */3/* #/if *//* #ifnot trueVar */4/* #/if */);', content);
        assert.strictEqual(content.string, 'test(13);');
    });

    test('test else', async function() {
        const content = { string: '', write(string) { this.string += string; } };

        const result = await p.process('test.js', 'test(/* #if trueVar */1/* #else */2/* #/if */'
                + '/* #ifnot trueVar */3/* #else */4/* #/if */);', content);
        assert.strictEqual(content.string, 'test(14);');
    });

    test('test elseif', async function() {
        const content = { string: '', write(string) { this.string += string; } };

        const result = await p.process('test.js', 'test(/* #if falseVar */1/* #elseif trueVar */2/* #/if */'
              + '/* #if trueVar */3/* #elseif trueVar */4/* #/if */'
              + '/* #if falseVar */5/* #elseif falseVar */6/* #elseif trueVar */7/* #/if */);', content);
        assert.strictEqual(content.string, 'test(237);');
    });
});
