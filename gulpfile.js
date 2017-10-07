const gulp = require('gulp');
const { BuffaloGenerator } = require(__dirname + '/index.js');
const { Readable } = require('stream');
const ifdef = require(__dirname + '/.gulp/ifdef');
const fs = require('fs');
const beautify = require('gulp-beautify');

gulp.task('default', ['build-web', 'build-node']);

gulp.task('build-web', ['build-value-objects'], () => {
  return gulp.src(['src/*.js', '!src/BuffaloGenerator.js', '!src/Types.js', 'lib/generated/*.js'])
    .pipe(ifdef({ flags: { web: true } }))
    .pipe(beautify({
      "eol": "\n",
      "end_with_newline": true,
      "max_preserve_newlines": 2,
    }))
    .pipe(gulp.dest('lib/web'));
});

gulp.task('build-node', ['build-value-objects'], () => {
  return gulp.src(['src/*.js', '!src/Loop.js', 'lib/generated/*.js'])
    .pipe(ifdef({ flags: { node: true } }))
    .pipe(beautify({
      "eol": "\n",
      "end_with_newline": true,
      "max_preserve_newlines": 2,
    }))
    .pipe(gulp.dest('lib/node'));
});

gulp.task('build-value-objects', ['build-value-objects/generate'], () => {
  return gulp.src('lib/generated/ValueObjects.js')
    .pipe(beautify({
      "eol": "\n",
      "end_with_newline": true,
      "max_preserve_newlines": 2,
    }))
    .pipe(gulp.dest('lib/generated'));
});

gulp.task('build-value-objects/generate', (cb) => {
  let valueObjects = [
    [1, 'string', 'String'],
    [2, 'uint32', 'Uint32'],
    [3, 'uint16', 'Uint16'],
    [4, 'uint8', 'Uint8'],
    [5, 'int32', 'Int32'],
    [6, 'int16', 'Int16'],
    [7, 'int8', 'Int8'],
    [8 ,'float32', 'Float32'],
    [9, 'float64', 'Float64'],
    [10, 'pointer', 'Pointer'],
  ];

  let objectClasses = [];
  let code = [];

  valueObjects.forEach(([id, type, name, extra = {}]) => {
    let className = `Buffalo${name}`;

    let property = {
      name: 'value',
      type: type
    };

    Object.assign(property, extra);

    let definition = {
      name: className,
      id: id,
      properties: [
        property
      ]
    };

    let generator = new BuffaloGenerator(definition.name, definition.properties, definition.id);
    generator.append(`static get isValueObject() {
      return true;    
    }`);

    code.push(generator.generate());
    objectClasses.push(className);
  });

  const header = `//#IF node
if(module) {
  let polyfill = require('text-encoding');
  TextEncoder = (() => { try { return TextEncoder } catch (_) { return false; } })() || polyfill.TextEncoder;
  TextDecoder = (() => { try { return TextDecoder } catch (_) { return false; } })() || polyfill.TextDecoder; 
}
//#ENDIF`;
  let trailer = `//#IF node

module.exports = {
  ${objectClasses.map((a) => `${a}: ${a},`).join('\n')}
};
//#ENDIF`;

  fs.writeFile(__dirname + '/lib/generated/ValueObjects.js', `${header}\n${code.join("\n")}\n${trailer}`, (err) => {
    cb(err);
  });
});