"use strict";

module.exports = {
  BuffaloGenerator: require('./src/BuffaloGenerator'),
  Types: require('./src/Types'),
};

Object.assign(module.exports, require('./lib/MemoryManager'));
