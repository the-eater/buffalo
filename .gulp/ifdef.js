const { Transform } = require('stream');

class StupidTemplate {
  constructor({ flags }) {
    this.flags = flags;
    this.buffer = '';
    this.state = [];
  }

  processChunk(document) {
    const lines = (this.buffer + document).split('\n');
    const result = [];
    this.buffer = '\n' + lines.pop();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.substr(0, 5) === '//#IF') {
        let flag = line.substr(5).trim();

        this.state.unshift(this.flags[flag]||false);
        continue;
      }

      if (this.state.length === 0) {
        result.push(line);
      }

      if (line.substr(0, 8) === '//#ENDIF') {
        this.state.shift();
        continue;
      }

      if (line.substr(0, 8) === '//#ELSE') {
        this.state[0] = !this.state[0];
        continue;
      }

      if (!this.state[0]) {
        continue;
      }

      result.push(line);
    }

    return result.join('\n');
  }

  flush() {
    return this.processChunk('\n');
  }

  static process(opts, document) {
    const tpl = new StupidTemplate(opts);
    return tpl.processChunk(document) + tpl.flush();
  }
}

module.exports = function(opts) {
  return Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isNull()) {
        // nothing to do
        return callback(null, file);
      }

      let tpl = new StupidTemplate({
        flags: opts.flags,
      });

      if (file.isStream()) {
        // or, if you can handle Streams:
        file.contents = file.contents.pipe(Transform({
          transform(data, encoding, cb) {
            this.push(tpl.processChunk(data.toString('utf-8')));
            cb();
          },
          flush(cb) {
            this.push(tpl.flush());
            cb();
          }
        }));
        return callback(null, file);
      } else if (file.isBuffer()) {
        // file.contents is a Buffer - https://nodejs.org/api/buffer.html

        // or, if you can handle Buffers:
        file.contents = Buffer.from(StupidTemplate.process({ flags: opts.flags }, file.contents.toString('utf-8')), 'utf-8');
        return callback(null, file);
      }
    }
  });
};