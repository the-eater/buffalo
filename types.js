const typeToLower = (() => {
  let map = {};
  map[Uint32Array] = 'uint32';
  map[Uint16Array] = 'uint16';
  map[Uint8Array]  = 'uint8';

  map[Int32Array] = 'int32';
  map[Int16Array] = 'int16';
  map[Int8Array]  = 'int8';

  map[Float32Array] = 'float32';
  map[Float64Array] = 'float64';

  return map;
})();

const typed = (type) => {
  return {
    propertyDefinition: (name, offsets, length) => {
      let json = JSON.stringify(name);
      return `
      Object.defineProperty(this, ${json}, {
        get: () => {
          return this.__adderAll.views.${typeToLower[type]}[${offsets[typeToLower[type]]}];
        },
        set: (val) => {
          this.__adderAll.views.${typeToLower[type]}[${offsets[typeToLower[type]]}] = val;
        }
      });`
    }
  }
}

let types = {
  string: {
    propertyDefinition: (name, offsets, length) => {
      let json = JSON.stringify(name);
      return `
      this.__adderAll.data[${json}] = {
        value: "",
        revision: 0,
      };

      Object.defineProperty(this, ${json}, {
        get: (() => {
          let currentRevision = this.__adderAll.views.uint32[${offsets.uint32}];
          if (this.__adderAll.data[${json}].revision === currentRevision) {
            return this.__adderAll.data[${json}].value;
          }

          this.__adderAll.data[${json}].revision = currentRevision;

          let length = this.__adderAll.views.uint32[${offsets.uint32 + 1}];
          let textView = new Uint8Array(buffer, ${offsets.uint8} + 16, length);

          return this.__adderAll.data[${json}].value = (new TextDecoder()).decode(textView);
        }).bind(this),
        set: ((val) => {
          let textArr = (new TextEncoder()).encode(val.substr(0, ${length}));
          for (var i = 0; i < textArr.length; i++) {
            this.__adderAll.views.uint8[i + ${offsets.uint8}] = textArr[i];
          }

          this.__adderAll.data[${json}].value = val;
          this.__adderAll.views.uint32[${offsets.uint32 + 1}] = textArr.length;
          this.__adderAll.views.uint32[${offsets.uint32}]++;
        }).bind(this)
      });`;
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
