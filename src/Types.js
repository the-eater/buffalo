const Types = {};

const typed = (type) => {
  return {
    definitions: (name, offsets, length) => {
      return {
        datas: false,
        get: `return this.__adderAll.views.${type.name}[${offsets[type.name]}];`,
        set: `this.__adderAll.views.${type.name}[${offsets[type.name]}] = value;`,
      }
    },
    count: () => {
      return [[type, 1]];
    },
    data: () => false
  }
}

Types.getName = (name) => typeToLower[name];

Types.definitions = {
  string: {
    count: (length) => {
      return [
        [Uint32Array, 2],
        [Uint8Array, 4 * length]
      ];
    },
    data: (name, length) => {
      return `{
        value: "",
        revision: -1,
      }`
    },
    definitions: (name, offsets, length) => {
      return {
        get: `const currentRevision = this.__adderAll.views.Uint32Array[${offsets.Uint32Array}];
        if (this.__adderAll.data.${name}.revision === currentRevision) {
          return this.__adderAll.data.${name}.value;
        }

        this.__adderAll.data.${name}.revision = currentRevision;

        const length = this.__adderAll.views.Uint32Array[${offsets.Uint32Array + 1}];
        const textView = new Uint8Array(buffer, ${offsets.Uint8Array} + 16, length);

        this.__adderAll.data.${name}.value = (new TextDecoder()).decode(textView);
        return this.__adderAll.data.${name}.value;`,
      set: `const textArr = (new TextEncoder()).encode(value.substr(0, ${length}));
        for (var i = 0; i < textArr.length; i++) {
          this.__adderAll.views.Uint8Array[i + ${offsets.Uint8Array}] = textArr[i];
        }

        this.__adderAll.data.${name}.value = value;
        this.__adderAll.views.Uint32Array[${offsets.Uint32Array + 1}] = textArr.length;
        this.__adderAll.views.Uint32Array[${offsets.Uint32Array}]++;`,
     }
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
}

module.exports = Types;
