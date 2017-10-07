const assert = require('assert');
const { MemoryManager, splitZoomBetween, BuffaloGenerator } = require('../index');
const { TextEncoder, TextDecoder } = require('text-encoding');
const fs = require('fs');
const definition = JSON.parse(fs.readFileSync(__dirname + '/../examples/magic-window.buffalo'));

const x = new BuffaloGenerator(definition.name, definition.properties);
x.id = definition.id;
let _temp;
eval(`_temp = ${x.generate()};`);
const MagicWindow = _temp;

describe('MemoryManager', () => {
  it('should respect max size', () => {
    assert.throws(() => {
      let x = new MemoryManager({ pageSize: 4, maxSize: 1 });
      x.grow();
    });
  });

  it('fails to spawn without modulo space', () => {
    let x = new MemoryManager({ pageSize: MagicWindow.size });
    assert.throws(
      () => {
        x.createType(MagicWindow);
      },
      /Can't allocate more memory than page size/
    );
  });

  it('spawn object with correct size', () => {
    let x = new MemoryManager({ pageSize: MagicWindow.size + 3 });
    x.createType(MagicWindow);
  });

  it('spawn object with correct type', () => {
    let x = new MemoryManager({ pageSize: MagicWindow.size + 3 });
    let z = x.createType(MagicWindow);

    assert(z instanceof MagicWindow);
  });

  it('throws on overflow', () => {
    let x = new MemoryManager({ pageSize: MagicWindow.size + 3 });
    x.createType(MagicWindow);
    x.createType(MagicWindow);
  });

  it('doesnt poison', () => {
    let x = new MemoryManager({ pageSize: 2 * (MagicWindow.size + 3) });
    let y = x.createType(MagicWindow);
    let z = x.createType(MagicWindow);

    y.name = "Henk achterjansen";
    y.id = 346;
    y.off = 244;

    assert(y instanceof MagicWindow);
    assert(z instanceof MagicWindow);
    assert.strictEqual(z.id, 0);
    assert.strictEqual(z.off, 0);
    assert.strictEqual(z.name, "");
    assert.strictEqual(y.id, 346);
    assert.strictEqual(y.off, 244);
    assert.strictEqual(y.name, "Henk achterjansen");
  });

  it('can grow on init', () => {
    let x = new MemoryManager({ size: 30, pageSize: 4 });
    assert.equal(x.pages.length, 8);
  });

  it('#alloc', () => {
    let x = new MemoryManager({ pageSize: 20 });

    x.alloc(10);
    assert.equal(x.pages[0].biggestGap, 10);
    x.free(0, 6, 2);
    x.free(0, 2, 2);
    x.free(0, 0, 2);
    x.free(0, 4, 2);
    x.alloc(10);
    assert.equal(x.pages[0].biggestGap, 8);
    x.free(0, 16, 2);
    x.free(0, 18, 2);
    x.free(0, 12, 2);

    assert.throws(() => {
      x.free(0, -1, 20);
    })

  })
});

describe('MemoryPage', () => {
  it('#alloc', () => {
    let x = new MemoryManager({ pageSize: 20, size: 20 });
    let page = x.pages[0];

    assert.throws(() => {
      page.alloc(30);
    });
  });
});

describe('MemoryPosition', () => {
  it('#free', () => {
    let x = new MemoryManager({ pageSize: 20 });
    let y = x.alloc(10);
    assert.equal(x.pages[0].biggestGap, 10);
    y.free();
    assert.equal(x.pages[0].biggestGap, 20);
  });
});

it('splitZoomBetween', () => {
  let x = [1, 2, 3, 4, 5];

  assert.deepEqual(splitZoomBetween(x, (a, b) => {
    if (b - a === 2) {
      return a > 2 ? 0 : -1;
    }

    return 1;
  }), [3, 5]);

  assert.deepEqual(splitZoomBetween(x, (a, b) => {
    if (b - a === 2) {
      return a > 2 ? 1 : -1;
    }

    return 1;
  }), [3, 4]);

  assert.deepEqual(splitZoomBetween(x, (a, b) => {
    if (b - a === 2) {
      return a < 2 ? 0 : -1;
    }

    return 1;
  }), [1, 3]);

  assert.deepEqual(splitZoomBetween(x, (a, b) => {
    if (b - a === 2) {
      return -1;
    }

    return 1;
  }), null);

  assert.deepEqual(splitZoomBetween(x, (a, b) => {
    if (b - a === 4) {
      return 0;
    }
  }), [1, 5]);

  assert.equal(splitZoomBetween([], () => {}), null);
  assert.equal(splitZoomBetween([1,2,3], () => -1), null);
});