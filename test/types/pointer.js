const assert = require('assert');
const { BuffaloGenerator, MemoryManager } = require('../../index');
const { TextEncoder, TextDecoder } = require('text-encoding');

describe('Types', () => {
  describe('pointer', () => {
    let LinkedList;
    let generator = new BuffaloGenerator("LinkedList", [
      {
        type: 'string',
        name: 'value',
        size: 7,
      },
      {
        type: 'pointer',
        name: 'next',
        childType: 'LinkedList',
      }
    ]);

    let mm = new MemoryManager({ pageSize: 256 });
    let root = null;

    it('generate', () => {
      let js = generator.generate();
      eval('LinkedList = ' + js);
    });

    it('init', () => {
      root = mm.createType(LinkedList);
    });

    it('get/set', () => {
      root.value = "test123";
      assert.equal(root.value, "test123");

      let next = mm.createType(LinkedList);
      next.value = "321tset"
      root.next = next;
      assert.equal(root.next, next);
      assert.equal(root.next.value, "321tset");
    });

    it('self pointer', () => {
        root.next = root;
        assert.deepEqual(root._next.toJSON(), { offset: 0, page: 0 });
        assert.equal(root.next, root);
    });

    it('pointer pos set', () => {
        let next = mm.createType(LinkedList);
        next.value = "321tset"
        root.next = next;

        root._next = { page: 0, offset: next.__buffalo.offset };

        assert.equal(root.next, next);
        root._next.offset = root.__buffalo.offset;
        assert.equal(root._next.offset, root.__buffalo.views.Uint32Array[4])
        assert.deepEqual({ page: root.__buffalo.position.page, offset: root.__buffalo.offset }, root._next.toJSON());
        assert.notEqual(root.next.__buffalo.offset, next.__buffalo.offset);
        assert.deepEqual(root.value, root.next.value);
        root.value = "test---";
        assert.deepEqual(root.next.value, "test---");
        assert.deepEqual(root._next.page, root.next._next.page);
        assert.deepEqual(root.__buffalo.views.Uint32Array, root.next.__buffalo.views.Uint32Array);
        assert.deepEqual(root._next.offset, root.next._next.offset);
    });
  });
});
