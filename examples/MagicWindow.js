if(module) {
  let polyfill = require('text-encoding');
  TextEncoder = (() => { try { return TextEncoder } catch (_) { return false; } })() || polyfill.TextEncoder;
  TextDecoder = (() => { try { return TextDecoder } catch (_) { return false; } })() || polyfill.TextDecoder; 
}

class MagicWindow {
    constructor({
        buffer,
        offset
    }) {
        this.__buffalo = {
            data: {
                name: {
                    value: "",
                    revision: -1,
                }
            },
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 3),
                Uint8Array: new Uint8Array(buffer, offset + 12, 97),
                Int32Array: new Int32Array(buffer, offset + 112, 1)
            },
            buffer: buffer,
            offset: offset
        };

        this.__buffalo.views.Uint32Array[0] = MagicWindow.id;
    }

    get name() {
        const currentRevision = this.__buffalo.views.Uint32Array[1];
        if (this.__buffalo.data.name.revision === currentRevision) {
            return this.__buffalo.data.name.value;
        }

        this.__buffalo.data.name.revision = currentRevision;

        const length = this.__buffalo.views.Uint32Array[2];
        const textView = new Uint8Array(this.__buffalo.buffer, this.__buffalo.offset + 12, length).slice();

        this.__buffalo.data.name.value = (new TextDecoder()).decode(textView);
        return this.__buffalo.data.name.value;
    }

    set name(value) {
        const textArr = (new TextEncoder()).encode(value.substr(0, 24));
        for (let i = 0; i < textArr.length; i++) {
            this.__buffalo.views.Uint8Array[i] = textArr[i];
        }

        this.__buffalo.data.name.value = value;
        this.__buffalo.views.Uint32Array[2] = textArr.length;
        this.__buffalo.views.Uint32Array[1]++;
    }

    get off() {
        return this.__buffalo.views.Uint8Array[96];
    }

    set off(value) {
        this.__buffalo.views.Uint8Array[96] = value;
    }

    get id() {
        return this.__buffalo.views.Int32Array[0];
    }

    set id(value) {
        this.__buffalo.views.Int32Array[0] = value;
    }

    static get id() {
        return 42;
    }

    static get size() {
        return 116;
    }
}


if (module) {
  module.exports = {
    MagicWindow: MagicWindow
  };
} 
