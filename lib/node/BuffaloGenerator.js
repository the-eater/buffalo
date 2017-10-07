"use strict";

const Types = require('./Types'),
    beautify = require('js-beautify').js_beautify;

class BuffaloGenerator {
    constructor(name, definition, id = 0) {
        this.name = name;
        this.definition = definition;
        this.counters = {
            [Uint32Array.name]: {
                size: 1
            }
        };
        this.positions = [];
        this.appendedParts = [];
        this.size = 4;
        this.id = id;

        this.calculatePositions();
    }

    append(code) {
        this.appendedParts.push(code);
    }

    calculatePositions() {
        this.definition.forEach((def) => {
            let {
                type,
                size
            } = def;
            if (!Types.definitions[type]) {
                throw new Error(`Type ${type} doesn't exist`);
            }

            const typeObj = Types.definitions[type];
            const sizes = typeObj.count({
                size
            });
            const positions = {};

            sizes.forEach(([type, count]) => {
                if (this.counters[type.name] === undefined) {
                    this.counters[type.name] = {
                        size: 0
                    };
                }

                positions[type.name] = this.counters[type.name].size;
                this.counters[type.name].size += count;
            });

            this.positions.push([positions, def]);
        });

        let offset = 0;
        Object.entries(this.counters).forEach(([type, counter]) => {
            const bytes = global[type].BYTES_PER_ELEMENT;
            offset = offset === 0 ? 0 : Math.ceil(offset / bytes) * bytes;
            counter.offset = offset;
            offset += counter.size * global[type].BYTES_PER_ELEMENT;
        });

        this.size = offset;
    }

    generate() {
        let js = `
class ${this.name} {
  constructor({ buffer, offset, position = null }) {
    this.__buffalo = {
      data: ${this.generateData()},
      views: ${this.generateViews()},
      buffer: buffer,
      offset: offset,
      position: position,
    };

    this.__buffalo.views.Uint32Array[0] = ${this.name}.id;
  }

  ${this.generateProperties()}

  toJSON() {
    return {
    ${this.definition.reduce((carry, item) => `${carry}${item.name}: this.${item.name},\n`,"")}};
  }

  free() {
    if (this.__buffalo.position) {
      this.__buffalo.position.free();
    }

    return false;
  }

  static get id() {
    return ${this.id};
  }

  static get size() {
    return ${this.size};
  }
  ${this.appendedParts.length > 0 ? `\n${this.appendedParts.join("\n\n")}\n` : ''}}
`;

        return beautify(js) + "\n";
    }
    generateProperties() {
        let properties = [];
        const globalOffsets = Object.entries(this.counters).reduce((carry, [key, {
            offset
        }]) => {
            carry[key] = offset;
            return carry;
        }, {});

        this.positions.forEach((x) => {
            let [offsets, {
                name,
                type,
                size = 1
            }] = x;
            let definitions = Types.definitions[type].definitions({
                name,
                offsets,
                size,
                globalOffsets
            }, x[1]);
            properties.push(`get ${name}() {
        ${definitions.get}
      }

      set ${name}(value) {
        ${definitions.set}
      }`);

            if (definitions.extra) {
                Object.keys(definitions.extra).forEach((key) => {
                    const definition = definitions.extra[key];

                    properties.push(`get ${key}() {
            ${definition.get}
          }

          set ${key}(value) {
            ${definition.set}
          }`);
                });

            }
        });

        return properties.join("\n\n");
    }

    generateData() {
        let data = "{\n";

        this.positions.forEach((x) => {
            let [offsets, {
                name,
                type,
                size = 1
            }] = x;
            let defData = Types.definitions[type].data({
                name,
                size,
                offsets
            }, x);
            if (defData === undefined) {
                return;
            }

            data += name + ': ' + defData + ',\n';
        });

        return data + "}";
    }

    generateViews() {
        let views = [];
        Object.entries(this.counters).forEach(([type, counter]) => {
            views.push(
                this.generateView({
                    type,
                    offset: counter.offset,
                    size: counter.size,
                })
            );
        });

        return `{
      ${views.join(',\n')}
    }`;
    }

    generateView({
        type,
        offset,
        size
    }) {
        return `${type}: new ${type}(buffer, offset${offset === 0 ? '' : ` + ${offset}`}, ${size})`;
    }
}

module.exports = BuffaloGenerator;
