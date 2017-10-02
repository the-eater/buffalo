const assert = require('assert');
const { BuffaloGenerator, MemoryManager } = require('../../index');

describe('Types', () => {
  describe('string', () => {
    let StrType;
    let generator = new BuffaloGenerator("StrType", [
      {
        type: 'string',
        name: 'value',
        size: 48
      }
    ]);
    let mm = new MemoryManager({ pageSize: 256 });
    let instance = null;

    it('generate', () => {
      let js = generator.generate();
      eval('StrType = ' + js);
    });

    it('init', () => {
      instance = mm.createType(StrType);
    });

    it('get/set', () => {
      instance.value = "test123";
      assert.equal(instance.value, "test123");
    });

    it('test cache', () => {

      instance.value = 'test123';

      assert.equal(instance.value, 'test123');
      assert.equal(instance.__buffalo.data.value.value, 'test123');

      // poison real string
      for (let i = 0; i < instance.__buffalo.views.Uint8Array.length; i++) {
        instance.__buffalo.views.Uint8Array[i] = 0;
      }

      assert.equal(instance.value, 'test123');
    });
  });
});