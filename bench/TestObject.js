"use strict";

class TestObject {
    constructor({
        buffer,
        offset
    }) {
        this.__buffalo = {
            data: {
                message: {
                    value: "",
                    revision: -1,
                },
            },
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 4),
                Uint8Array: new Uint8Array(buffer, offset + 16, 97),
                Int32Array: new Int32Array(buffer, offset + 116, 1)
            },
            buffer: buffer,
            offset: offset
        };

        this.__buffalo.views.Uint32Array[0] = TestObject.id;
    }

    get message() {
        const currentRevision = this.__buffalo.views.Uint32Array[1];
        if (this.__buffalo.data.message.revision === currentRevision) {
            return this.__buffalo.data.message.value;
        }

        this.__buffalo.data.message.revision = currentRevision;

        const length = this.__buffalo.views.Uint32Array[2];
        const textView = new Uint8Array(this.__buffalo.buffer, this.__buffalo.offset + 16, length).slice();

        this.__buffalo.data.message.value = (new TextDecoder()).decode(textView);
        return this.__buffalo.data.message.value;
    }

    set message(value) {
        const textArr = (new TextEncoder()).encode(value.substr(0, 24));
        for (let i = 0; i < textArr.length; i++) {
            this.__buffalo.views.Uint8Array[i] = textArr[i];
        }

        this.__buffalo.data.message.value = value;
        this.__buffalo.views.Uint32Array[2] = textArr.length;
        this.__buffalo.views.Uint32Array[1]++;
    }

    get workerCounter() {
        return this.__buffalo.views.Int32Array[0];
    }

    set workerCounter(value) {
        this.__buffalo.views.Int32Array[0] = value;
    }

    get mainCounter() {
        return this.__buffalo.views.Uint32Array[3];
    }

    set mainCounter(value) {
        this.__buffalo.views.Uint32Array[3] = value;
    }

    get recipient() {
        return this.__buffalo.views.Uint8Array[96];
    }

    set recipient(value) {
        this.__buffalo.views.Uint8Array[96] = value;
    }

    toJSON() {
        return {
            message: this.message,
            workerCounter: this.workerCounter,
            mainCounter: this.mainCounter,
            recipient: this.recipient,
        }
    }

    free() {
        if (this.__buffalo.memoryManager) {
            this.__buffalo.memoryManager.position.free();
        }

        return false;
    }

    static get id() {
        return 0;
    }

    static get size() {
        return 120;
    }
}
