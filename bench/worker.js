importScripts('./TestObject.js');

function transform(x) {
    x.ye += 1;
    x.hello = "Hello!!!";
    x.l = 1;
    return x;
}

let sharedObject = null;

self.onmessage = (msg) => {
    const data = msg.data;

    switch (data.type) {
        case 'object':
            self.postMessage({ type: 'object', obj: transform(data.obj) });
            break;
        case 'buffer':
            const x = new TestObject(data.buffer, 0);
            transform(x);
            self.postMessage({ type: 'buffer', buffer: data.buffer }, [data.buffer]);
            break;
        case 'shared-buffer-init':
            sharedObject = new TestObject(data.buffer, 0);
            while (1) {
                if (sharedObject.l === 0) {
                    transform(sharedObject);
                }

                if (sharedObject.l === 2) {
                    break;
                }
            }
    }
}
