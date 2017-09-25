const Types = require('./Types'),
      beautify = require('js-beautify').js_beautify;

class AdderallBuilder {
  constructor(name, definition) {
    this.name = name;
    this.definition = definition;
    this.counters = {
      [Uint32Array.name]: 1
    };
    this.positions = [];
    this.length = 0;
    this.id = 0;

    this.calculatePositions();
  }

  calculatePositions() {
    this.definition.forEach((def) => {
      let { name, type, length } = def;
      if (!Types.definitions[type]) {
        throw new Error(`Type ${type} doesn't exist`);
      }

      let typeObj = Types.definitions[type];

      let lengths = typeObj.count(length);
      let positions = {};

      lengths.forEach(([type, count]) => {
        if (this.counters[type.name] === undefined) {
          this.counters[type.name] = 0;
        }

        positions[type.name] = this.counters[type.name];
        this.counters[type.name] += count;
        this.length += count * type.BYTES_PER_ELEMENT;
      });

      this.positions.push([positions, def]);
    });
  }

  build() {
    let js = `
class ${this.name} {
  constructor(buffer, offset) {
    this.__adderAll = {
      data: ${this.buildData()},
      views: ${this.buildViews()}
    };

    this.__adderAll.views.Uint32Array[0] = ${this.name}.id();
  }

  ${this.buildProperties()}

  static get id() {
    return ${this.id};
  }

  static get length() {
    return ${this.length};
  }
}
`
    return beautify(js);
  }

  buildProperties() {
    let properties = "";

    this.positions.forEach((x) => {
      let [offsets, { name, type, length = 1 }] = x;
      let definitions = Types.definitions[type].definitions(name, offsets, length);
      properties += `get ${name}() {
        ${definitions.get}
      }

      set ${name}(value) {
        ${definitions.set}
      }
`
    });

    return properties;
  }

  buildData() {
    let data = "{\n";

    this.definition.forEach(({ name, type, length }) => {
      let defData = Types.definitions[type].data(name, length);
      if (defData === false) {
        return;
      }

      data += JSON.stringify(name) + ': ' + defData;
    });

    return data + "\n}";
  }

  buildViews() {
    let offset = 0;
    let views = [];
    Object.entries(this.counters).forEach(([ type, length ]) => {
      views.push(
        this.buildView({
          type,
          offset,
          length,
        })
      );

      offset += length * global[type].BYTES_PER_ELEMENT;
    });

    return `{
      ${views.join(',\n')}
    }`
  }

  buildView({ type, offset, length }) {
    return `${type}: new ${type}(buffer, offset${offset == 0 ? '' : ` + ${offset}`}, ${length})`
  }
}

module.exports = AdderallBuilder;
