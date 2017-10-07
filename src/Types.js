//#IF node
"use strict";

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
    count: ({ size }) => {
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
        if (this.__buffalo.data.${name}.revision !== currentRevision) {
          this.__buffalo.data.${name}.revision = currentRevision;

          const length = this.__buffalo.views.Uint32Array[${offsets.Uint32Array + 1}];
          const textView = new Uint8Array(this.__buffalo.buffer, this.__buffalo.offset + ${offsets.Uint8Array + globalOffsets.Uint8Array}, length).slice();

          this.__buffalo.data.${name}.value = (new TextDecoder()).decode(textView);
        }

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

  pointer: {
    count: () => {
      return [
        [Uint32Array, 2]
      ];
    },
    data: ({ offsets, name }) => {
      return `{
        cache: undefined,
        position: new (class MemoryPointer {
            constructor(bind) {
                this.bind = bind;
            }

            get page () {
                return this.bind.__buffalo.views.Uint32Array[${offsets.Uint32Array}];
            }

            set page (value) {
                this.bind.__buffalo.views.Uint32Array[${offsets.Uint32Array}] = value;
            }

            get offset () {
                return this.bind.__buffalo.views.Uint32Array[${offsets.Uint32Array + 1}];
            }

            set offset (value) {
                this.bind.__buffalo.views.Uint32Array[${offsets.Uint32Array + 1}] = value;
            }

            toJSON() {
              return {
                 page: this.page,
                 offset: this.offset,
              };
            }
        })(this),
      }`;
    },
    definitions: ({name, offsets}, { childType = null }) => {
      let data = `this.__buffalo.data.${name}`;
      let retrieveTyped = `this.__buffalo.position.memoryManager.getPosition(${data}.position.page, ${data}.position.offset, ${childType}.size).spawn(${childType})`;
      let retrieveDynamic = `this.__buffalo.position.memoryManager.extractType(${data}.position.page, ${data}.position.offset)`;
      return {
        get: `if (${data}.cache === undefined ||
            ${data}.position.page !== ${data}.cache.__buffalo.position.page ||
            ${data}.position.offset !== ${data}.cache.__buffalo.offset) {
        ${data}.cache = ${ childType !== null ? retrieveTyped : retrieveDynamic };
}

return ${data}.cache;`,
        set: `if (!value.__buffalo && !value.__buffalo.position) {
  throw new Error('Given value is not an Buffalo object or not managed by memory manager');
}

${data}.position.page = value.__buffalo.position.page;
${data}.position.offset = value.__buffalo.offset;

${data}.cache = value;`,
        extra: {
          [`_${name}`]: {
            get: `return ${data}.position;`,
            set: `${data}.position.offset = value.offset;
${data}.position.page = value.page;`,
          }
        }
      };
    }
  }
};

module.exports = Types;
//#ENDIF