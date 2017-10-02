const assert = require('assert');
const { BuffaloGenerator, MemoryManager } = require('../../index');

describe('Types', () => {
  let numbers = [
    'uint8',
    'uint16',
    'uint32',
    'int8',
    'int16',
    'int32',
    'float32',
    'float64',
  ];

  numbers.forEach((type) => describe(type, () => {
    let StrType;
    let generator = new BuffaloGenerator("NumType", [
      {
        type: type,
        name: 'value'
      }
    ]);
    let mm = new MemoryManager({ pageSize: 256 });
    let instance = null;

    it('generate', () => {
      let js = generator.generate();
      eval('NumType = ' + js);
    });

    it('init', () => {
      instance = mm.createType(NumType);
    });

    it('get/set', () => {
      instance.value = 23;
      assert.equal(instance.value, 23);
    });
  }));
});