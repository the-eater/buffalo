class MagicWindow {
  constructor(buffer, offset) {
    this.__adderAll = {
      data: {},
      views: {
        uint32: new Uint32Array(buffer, offset, 4),
        uint8: new Uint8Array(buffer, offset + 16, 124),
      }
    };

    this.__adderAll.views.uint32[0] = MagicWindow.id;

    Object.defineProperty(this, 'id', {
      get: () => {
        return this.__adderAll.views.uint32[1];
      },
      set: (val) => {
        this.__adderAll.views.uint32[1] = val;
      }
    });

    this.__adderAll.data['name'] = {
      value: "",
      revision: 0,
    };

    Object.defineProperty(this, 'name', {
      get: (() => {
        let currentRevision = this.__adderAll.views.uint32[2];
        if (this.__adderAll.data['name'].revision === currentRevision) {
          return this.__adderAll.data['name'].value;
        }

        this.__adderAll.data['name'].revision = currentRevision;

        let length = this.__adderAll.views.uint32[3];
        let textView = new Uint8Array(buffer, offset + 16, length);

        return this.__adderAll.data['name'].value = (new TextDecoder()).decode(textView);
      }).bind(this),
      set: ((val) => {
        let textArr = (new TextEncoder()).encode(val);
        console.log(textArr);
        for (var i = 0; i < textArr.length; i++) {
          this.__adderAll.views.uint8[i] = textArr[i];
        }

        this.__adderAll.views.uint32[3] = textArr.length;
        this.__adderAll.views.uint32[2]++;
      }).bind(this)
    });
  }
}
