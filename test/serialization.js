const fs = require('fs');
const assert = require('assert');
const {JSHINT} = require('jshint');
const { BuffaloGenerator } = require('../index.js');
const { TextEncoder, TextDecoder } = require('text-encoding');
const definition = JSON.parse(fs.readFileSync(__dirname + '/../examples/magic-window.buffalo'));
const jshintConfig = JSON.parse(fs.readFileSync(__dirname + '/../.jshintrc'));

describe('BuffaloGenerator', () => {
  let obj;
  let js;
  let MagicWindow;
  it('jshint', () => {
    const x = new BuffaloGenerator(definition.name, definition.properties);
    x.id = definition.id;
    js = x.generate();
    JSHINT([js], jshintConfig);
    assert(JSHINT.errors.length > 0, 'Generated code doesn\'t pass JSHint');
    eval('MagicWindow = ' + js);
  });

  it('creates caching strings', () => {
    let buf = new ArrayBuffer(MagicWindow.size);
    let mw = new MagicWindow({ buffer: buf, offset: 0 });
    mw.name = 'Help!';

    assert.equal(mw.name, 'Help!');

    // poison real string
    for (let i = 0; i < mw.__buffalo.views.Uint8Array.length; i++) {
      mw.__buffalo.views.Uint8Array[i] = 0;
    }

    assert.equal(mw.name, 'Help!');
  });

  it('executes', () => {
    eval('obj = ' + js);
  });

  it('can spawn', () => {
    let x = new ArrayBuffer(obj.size);
    let z = new obj({buffer: x, offset: 0});
  });

  it('fail on undefined type', () => {
    assert.throws(
      () => {
        new BuffaloGenerator(definition.name, [{type: 'h'}]);
      },
      /Type .* doesn't exist/
    );
  });
});
