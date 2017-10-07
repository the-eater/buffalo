class BuffaloString {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {
                value: {
                    value: "",
                    revision: -1,
                },
            },
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 3),
                Uint8Array: new Uint8Array(buffer, offset + 12, NaN)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloString.id;
    }

    get value() {
        const currentRevision = this.__buffalo.views.Uint32Array[1];
        if (this.__buffalo.data.value.revision !== currentRevision) {
            this.__buffalo.data.value.revision = currentRevision;

            const length = this.__buffalo.views.Uint32Array[2];
            const textView = new Uint8Array(this.__buffalo.buffer, this.__buffalo.offset + 12, length).slice();

            this.__buffalo.data.value.value = (new TextDecoder()).decode(textView);
        }

        return this.__buffalo.data.value.value;
    }

    set value(value) {
        const textArr = (new TextEncoder()).encode(value.substr(0, 1));
        for (let i = 0; i < textArr.length; i++) {
            this.__buffalo.views.Uint8Array[i] = textArr[i];
        }

        this.__buffalo.data.value.value = value;
        this.__buffalo.views.Uint32Array[2] = textArr.length;
        this.__buffalo.views.Uint32Array[1]++;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 1;
    }

    static get size() {
        return NaN;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloUint32 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 2)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloUint32.id;
    }

    get value() {
        return this.__buffalo.views.Uint32Array[1];
    }

    set value(value) {
        this.__buffalo.views.Uint32Array[1] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 2;
    }

    static get size() {
        return 8;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloUint16 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 1),
                Uint16Array: new Uint16Array(buffer, offset + 4, 1)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloUint16.id;
    }

    get value() {
        return this.__buffalo.views.Uint16Array[0];
    }

    set value(value) {
        this.__buffalo.views.Uint16Array[0] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 3;
    }

    static get size() {
        return 6;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloUint8 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 1),
                Uint8Array: new Uint8Array(buffer, offset + 4, 1)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloUint8.id;
    }

    get value() {
        return this.__buffalo.views.Uint8Array[0];
    }

    set value(value) {
        this.__buffalo.views.Uint8Array[0] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 4;
    }

    static get size() {
        return 5;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloInt32 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 1),
                Int32Array: new Int32Array(buffer, offset + 4, 1)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloInt32.id;
    }

    get value() {
        return this.__buffalo.views.Int32Array[0];
    }

    set value(value) {
        this.__buffalo.views.Int32Array[0] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 5;
    }

    static get size() {
        return 8;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloInt16 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 1),
                Int16Array: new Int16Array(buffer, offset + 4, 1)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloInt16.id;
    }

    get value() {
        return this.__buffalo.views.Int16Array[0];
    }

    set value(value) {
        this.__buffalo.views.Int16Array[0] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 6;
    }

    static get size() {
        return 6;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloInt8 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 1),
                Int8Array: new Int8Array(buffer, offset + 4, 1)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloInt8.id;
    }

    get value() {
        return this.__buffalo.views.Int8Array[0];
    }

    set value(value) {
        this.__buffalo.views.Int8Array[0] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 7;
    }

    static get size() {
        return 5;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloFloat32 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 1),
                Float32Array: new Float32Array(buffer, offset + 4, 1)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloFloat32.id;
    }

    get value() {
        return this.__buffalo.views.Float32Array[0];
    }

    set value(value) {
        this.__buffalo.views.Float32Array[0] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 8;
    }

    static get size() {
        return 8;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloFloat64 {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {},
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 1),
                Float64Array: new Float64Array(buffer, offset + 8, 1)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloFloat64.id;
    }

    get value() {
        return this.__buffalo.views.Float64Array[0];
    }

    set value(value) {
        this.__buffalo.views.Float64Array[0] = value;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 9;
    }

    static get size() {
        return 16;
    }

    static get isValueObject() {
        return true;
    }
}

class BuffaloPointer {
    constructor({
        buffer,
        offset,
        position = null
    }) {
        this.__buffalo = {
            data: {
                value: {
                    cache: undefined,
                    position: new(class MemoryPointer {
                        constructor(bind) {
                            this.bind = bind
                        }

                        get page() {
                            return this.bind.__buffalo.views.Uint32Array[1];
                        }

                        set page(value) {
                            this.bind.__buffalo.views.Uint32Array[1] = value;
                        }

                        get offset() {
                            return this.bind.__buffalo.views.Uint32Array[2];
                        }

                        set offset(value) {
                            this.bind.__buffalo.views.Uint32Array[2] = value;
                        }

                        toJSON() {
                            return {
                                page: this.page,
                                offset: this.offset,
                            }
                        }
                    })(this),
                },
            },
            views: {
                Uint32Array: new Uint32Array(buffer, offset, 3)
            },
            buffer: buffer,
            offset: offset,
            position: position,
        };

        this.__buffalo.views.Uint32Array[0] = BuffaloPointer.id;
    }

    get value() {
        if (this.__buffalo.data.value.cache === undefined ||
            this.__buffalo.data.value.position.page !== this.__buffalo.data.value.cache.__buffalo.position.page ||
            this.__buffalo.data.value.position.offset !== this.__buffalo.data.value.cache.__buffalo.offset) {
            this.__buffalo.data.value.cache = this.__buffalo.position.memoryManager.extractType(this.__buffalo.data.value.position.page, this.__buffalo.data.value.position.offset);;
        }

        return this.__buffalo.data.value.cache;
    }

    set value(value) {
        if (!value.__buffalo && !value.__buffalo.position) {
            throw new Error('Given value is not an Buffalo object or not managed by memory manager');
        }

        this.__buffalo.data.value.position.page = value.__buffalo.position.page;
        this.__buffalo.data.value.position.offset = value.__buffalo.offset;

        this.__buffalo.data.value.cache = value;
    }

    get _value() {
        return this.__buffalo.data.value.position
    }

    set _value(value) {
        this.__buffalo.data.value.position.offset = value.offset;
        this.__buffalo.data.value.position.page = value.page;
    }

    toJSON() {
        return {
            value: this.value,
        }
    }

    free() {
        if (this.__buffalo.position) {
            this.__buffalo.position.free();
        }

        return false;
    }

    static get id() {
        return 10;
    }

    static get size() {
        return 12;
    }

    static get isValueObject() {
        return true;
    }
}
