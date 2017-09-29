class TestObject {
    constructor(buffer, offset) {
        this.__buffalo = {
            data: {
                hello: {
                    value: "",
                    revision: -1,
                }
            },
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 3),
                Uint8Array: new Uint8Array(buffer, offset + 12, 97),
                Int32Array: new Int32Array(buffer, offset + 112, 2)
            },
            buffer: buffer,
            offset: offset
        };

        this.__buffalo.views.Uint32Array[0] = TestObject.id;
    }

    get hello() {
        const currentRevision = this.__buffalo.views.Uint32Array[1];
        if (this.__buffalo.data.hello.revision === currentRevision) {
            return this.__buffalo.data.hello.value;
        }

        this.__buffalo.data.hello.revision = currentRevision;

        const length = this.__buffalo.views.Uint32Array[2];
        const textView = new Uint8Array(this.__buffalo.buffer, this.__buffalo.offset + 12, length).slice();

        this.__buffalo.data.hello.value = (new TextDecoder()).decode(textView);
        return this.__buffalo.data.hello.value;
    }

    set hello(value) {
        const textArr = (new TextEncoder()).encode(value.substr(0, 24));
        for (var i = 0; i < textArr.length; i++) {
            this.__buffalo.views.Uint8Array[i] = textArr[i];
        }

        this.__buffalo.data.hello.value = value;
        this.__buffalo.views.Uint32Array[2] = textArr.length;
        this.__buffalo.views.Uint32Array[1]++;
    }

    get ye() {
        return this.__buffalo.views.Int32Array[0];
    }

    set ye(value) {
        this.__buffalo.views.Int32Array[0] = value;
    }

    get l() {
        return this.__buffalo.views.Uint8Array[96];
    }

    set l(value) {
        this.__buffalo.views.Uint8Array[96] = value;
    }

    get no() {
        return this.__buffalo.views.Int32Array[1];
    }

    set no(value) {
        this.__buffalo.views.Int32Array[1] = value;
    }

    static get id() {
        return 42;
    }

    static get length() {
        return 120;
    }
}
