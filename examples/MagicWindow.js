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
                },
                next: {
                    cache: undefined,
                    position: [],
                },
            },
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 5),
                Uint8Array: new Uint8Array(buffer, offset + 20, 97),
                Int32Array: new Int32Array(buffer, offset + 120, 1)
            },
            buffer: buffer,
            offset: offset
        };

        this.__buffalo.views.Uint32Array[0] = MagicWindow.id;
    }

    get name() {
        const currentRevision = this.__buffalo.views.Uint32Array[1];
        if (this.__buffalo.data.name.revision !== currentRevision) {
            this.__buffalo.data.name.revision = currentRevision;

            const length = this.__buffalo.views.Uint32Array[2];
            const textView = new Uint8Array(this.__buffalo.buffer, this.__buffalo.offset + 20, length).slice();

            this.__buffalo.data.name.value = (new TextDecoder()).decode(textView);
        }

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

    get next() {
        if (this.__buffalo.data.next.cache === undefined ||
            (this.__buffalo.data.next.position[0] === this.__buffalo.views.Uint32Array[3] && this.__buffalo.data.next.position[1] === this.__buffalo.views.Uint32Array[4])) {
            this.__buffalo.data.next.cache = this.__buffalo.memoryManager.extract(this.__buffalo.views.Uint32Array[3], this.__buffalo.views.Uint32Array[4]);
        }

        return this.__buffalo.data.next.cache;
    }

    set next(value) {
        if (!value.__buffalo && !value.__buffalo.memoryManager) {
            throw new Error('Given value is not an Buffalo object or not controlled by memory manager');
        }

        this.__buffalo.data.position[0] = value.__buffalo.memoryManager.position.page;
        this.__buffalo.data.position[1] = value.__buffalo.memoryManager.position.offset;

        this.__buffalo.data.next.cache = value
    }

    get _next() {
        return this.__buffalo.data.position
    }

    set _next(value) {
        this.__buffalo.data.position[0] = value[0];
        this.__buffalo.data.position[1] = value[1];
    }

    toJSON() {
        return {
            name: this.name,
            off: this.off,
            id: this.id,
            next: this.next,
        }
    }

    free() {
        if (this.__buffalo.memoryManager) {
            this.__buffalo.memoryManager.position.free();
        }

        return false;
    }

    static get id() {
        return 42;
    }

    static get size() {
        return 124;
    }
}


if (module) {
  module.exports = {
    MagicWindow: MagicWindow
  };
} 
