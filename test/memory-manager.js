const assert = require('assert');
const { MemoryManager, splitZoomBetween } = require('../lib/MemoryManager');
const { MagicWindow } = require('../examples/MagicWindow');

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
      /Can't find place to allocate/
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
    x.free(0, 6, 2);
    x.free(0, 2, 2);
    x.free(0, 0, 2);
    x.free(0, 4, 2);
    x.alloc(10);
    x.free(0, 16, 2);
    x.free(0, 18, 2);
    x.free(0, 12, 2);

    assert.throws(() => {
      x.free(0, -1, 20);
    })

  })
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
    if (b - a === 4) {
      return 0;
    }
  }), [1, 5]);

  assert.equal(splitZoomBetween([], () => {}), null);
});