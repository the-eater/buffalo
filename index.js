let sb = new ArrayBuffer();

let def = [
  {
    name: 'name',
    type: 'string',
    length: 32
  },
  {
    name: 'id',
    type: 'uint32'
  }
];

let retrieval = {
  'uint32': {
    count: () => {
      return 4;
    },
    get: (base, def, arr) => {
      return arr[base];
    },
    set: (base, def, arr, value) => {
      arr[base] = value;
    },
    view: () => {
      return Uint32Array;
    }
  },
  'string': {
    count: (def) => {
      return ((def||1) * 4) + 4;
    },
    get: (base, def, arr) => {
      let length = arr[base] | (arr[base + 1] << 8) | (arr[base + 2] << 16) | (arr[base + 3] << 24);

      return (new TextDecoder()).decode(arr.slice(base + 4, base + 4 + length));
    },
    set: (base, def, arr, value) => {
      let textArr = (new TextEncoder()).encode(value);
      let length = textArr.length;

      arr[base] = length & 255;
      arr[base+1] = length & 65280;
      arr[base+2] = length & 16711680;
      arr[base+3] = length & 4278190080;

      for (var i = 0; i < textArr.length; i++){
        arr[base + 4 + i] = textArr[i];
      }
    },
    view: () => {
      return Uint8Array
    }
  }
}

function createBufferMappedObject(def, buffer, base) {
  let types = {};
  let lengths = {};
  let length = 0;
  let obj = {};

  for (var i = 0; i < def.length; i++) {
    let x = def[i];

    types[x.type] = [].concat((types[x.type]||[]), [ x ]);
    lengths[x.type] = (lengths[x.type]||0) + retrieval[x.type].count(x.length);
    length += retrieval[x.type].count(x.length);
  }

  for ([key, value] of Object.entries(types)) {
    let view = new (retrieval[key].view())(buffer, base, lengths[key] / retrieval[key].view().BYTES_PER_ELEMENT);
    for (var i = 0; i < value.length; i++) {
      let k = key;
      let v = value[i];
      let b = base;
      Object.defineProperty(obj, v.name, {
        get: () => {
          return retrieval[k].get(b, v, view);
        },
        set: (val) => {
          retrieval[k].set(b, v, view, val);
          return true;
        }
      });
      base += retrieval[k].count(v.length);
    }
  }

  return obj;
};

let x = new ArrayBuffer(4 + 4 + 132);
let v = new Uint8Array(x);
let y = createBufferMappedObject(def, x, 0);
let z = createBufferMappedObject(def, x, 0);

y.name = "Hello!";
y.id = 32;
console.log(z.name);
