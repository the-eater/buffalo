"use strict";

importScripts('./TestObject.js');

function transform(x) {
    x.workerCounter += 1;
    x.message = "worker: " + x.workerCounter;
    x.recipient = 1;
    return x;
}

let sharedObject = null;
let sharedPushObject = null;
let bufferObject = null;

self.onmessage = (msg) => {
    const data = msg.data;

    if (data === 0) {
        transform(sharedPushObject);
        self.postMessage(0);
        return;
    }

    switch (data.type) {
        case 'object':
            self.postMessage({ type: 'object', obj: transform(data.obj) });
            break;
        case 'buffer':
            bufferObject = new TestObject({ buffer: data.buffer, offset: 0 });
            transform(bufferObject);
            self.postMessage({ type: 'buffer', buffer: data.buffer }, [data.buffer]);
            break;
        case 'shared-buffer-push-init':
            sharedPushObject = new TestObject({ buffer: data.buffer, offset: 0 });
            transform(sharedPushObject);
            self.postMessage(0);
            break;
        case 'shared-buffer-init':
            sharedObject = new TestObject({ buffer: data.buffer, offset: 0 });
            while (1) {
                if (sharedObject.recipient === 0) {
                    transform(sharedObject);
                }

                if (sharedObject.recipient === 2) {
                    break;
                }
            }
    }
}
