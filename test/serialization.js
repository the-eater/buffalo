const fs = require('fs');
const assert = require('assert');
const { JSHINT } = require('jshint');
const { BuffaloGenerator } = require(__dirname + '/../index.js');
const definition = JSON.parse(fs.readFileSync(__dirname + '/../examples/magic-window.buffalo'));
const jshintConfig = JSON.parse(fs.readFileSync(__dirname + '/../.jshintrc'));


describe('BuffaloGenerator', () => {
    let obj;
    let js;
    it('jshint', () => {
        const x = new BuffaloGenerator(definition.name, definition.properties);
        x.id = definition.id;
        js = x.generate();
        JSHINT([js], jshintConfig);
        assert(JSHINT.errors.length > 0, 'Generated code doesn\'t pass JSHint');

    });

    it('executes', () => {
        eval('obj = ' + js);
    });

    it('can spawn', () => {
        let x = new ArrayBuffer(obj.length);
        let z = new obj(x, 0);
    });

    it('fail on undefined type', () => {
        assert.throws(
            () => {
                new BuffaloGenerator(definition.name, [{ type: 'h' }]);
            },
            /Type .* doesn't exist/
        );
    });
});
