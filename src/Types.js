const Types = {};

const typed = (type) => {
  return {
    definitions: ({offsets}) => {
      return {
        get: `return this.__buffalo.views.${type.name}[${offsets[type.name]}];`,
        set: `this.__buffalo.views.${type.name}[${offsets[type.name]}] = value;`,
      };
    },
    count: () => {
      return [[type, 1]];
    },
    data: () => undefined
  };
};

Types.definitions = {
  string: {
    count: (size) => {
      return [
        [Uint32Array, 2],
        [Uint8Array, 4 * size]
      ];
    },
    data: () => {
      return `{
        value: "",
        revision: -1,
      }`;
    },
    definitions: ({name, offsets, size, globalOffsets}) => {
      return {
        get: `const currentRevision = this.__buffalo.views.Uint32Array[${offsets.Uint32Array}];
        if (this.__buffalo.data.${name}.revision === currentRevision) {
          return this.__buffalo.data.${name}.value;
        }

        this.__buffalo.data.${name}.revision = currentRevision;

        const length = this.__buffalo.views.Uint32Array[${offsets.Uint32Array + 1}];
        const textView = new Uint8Array(this.__buffalo.buffer, this.__buffalo.offset + ${offsets.Uint8Array + globalOffsets.Uint8Array}, length).slice();

        this.__buffalo.data.${name}.value = (new TextDecoder()).decode(textView);
        return this.__buffalo.data.${name}.value;`,
        set: `const textArr = (new TextEncoder()).encode(value.substr(0, ${size}));
        for (let i = 0; i < textArr.length; i++) {
          this.__buffalo.views.Uint8Array[i${offsets.Uint8Array > 0 ? ` + ${offsets.Uint8Array}` : ''}] = textArr[i];
        }

        this.__buffalo.data.${name}.value = value;
        this.__buffalo.views.Uint32Array[${offsets.Uint32Array + 1}] = textArr.length;
        this.__buffalo.views.Uint32Array[${offsets.Uint32Array}]++;`,
      };
    }
  },

  uint8: typed(Uint8Array),
  uint16: typed(Uint16Array),
  uint32: typed(Uint32Array),

  int8: typed(Int8Array),
  int16: typed(Int16Array),
  int32: typed(Int32Array),

  float32: typed(Float32Array),
  float64: typed(Float64Array),

  reference: {
    count: () => {
      return [
        [Uint32Array, 2]
      ];
    },
    data: () => {
      return `{
        cache: undefined,
        position: [],
      }`;
    },
    definitions: ({name, offsets}) => {
      return {
        get: `if (this.__buffalo.data.${name}.cache === undefined ||
  (this.__buffalo.data.${name}.position[0] === this.__buffalo.views.Uint32Array[${offsets.Uint32Array}] && this.__buffalo.data.${name}.position[1] === this.__buffalo.views.Uint32Array[${offsets.Uint32Array + 1}])) {
  this.__buffalo.data.${name}.cache = this.__buffalo.memoryManager.extract(this.__buffalo.views.Uint32Array[${offsets.Uint32Array}], this.__buffalo.views.Uint32Array[${offsets.Uint32Array + 1}]);
}

return this.__buffalo.data.${name}.cache`,
        set: `if (!value.__buffalo && !value.__buffalo.memoryManager) {
  throw new Error('Given value is not an Buffalo object or not controlled by memory manager');
}

this.__buffalo.data.position[0] = value.__buffalo.memoryManager.position.page
this.__buffalo.data.position[1] = value.__buffalo.memoryManager.position.offset

this.__buffalo.data.${name}.cache = value`,
        extra: {
          [`_${name}`]: {
            get: `return this.__buffalo.data.position`,
            set: `this.__buffalo.data.position[0] = value[0];
this.__buffalo.data.position[1] = value[1];`,
          }
        }
      };
    }
  }
};

module.exports = Types;
