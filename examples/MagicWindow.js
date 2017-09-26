class MagicWindow {
    constructor(buffer, offset) {
        this.__buffalo = {
            data: {
                name: {
                    value: "",
                    revision: -1,
                }
            },
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 4),
                Uint8Array: new Uint8Array(buffer, offset + 16, 96)
            }
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
        const textView = new Uint8Array(buffer, 16, length);

        this.__buffalo.data.name.value = (new TextDecoder()).decode(textView);
        return this.__buffalo.data.name.value;
    }

    set name(value) {
        const textArr = (new TextEncoder()).encode(value.substr(0, 24));
        for (var i = 0; i < textArr.length; i++) {
            this.__buffalo.views.Uint8Array[i] = textArr[i];
        }

        this.__buffalo.data.name.value = value;
        this.__buffalo.views.Uint32Array[2] = textArr.length;
        this.__buffalo.views.Uint32Array[1]++;
    }
    get id() {
        return this.__buffalo.views.Uint32Array[3];
    }

    set id(value) {
        this.__buffalo.views.Uint32Array[3] = value;
    }


    static get id() {
        return 42;
    }

    static get length() {
        return 112;
    }
}
