# Adderall

Object access on an ArrayBuffer.

## Usage

```javascript
const { AdderallBuilder } = require('./index');
const { TextDecoder, TextEncoder } = require('text-encoding');

// Create a new definition of a class/object
let magicWindowBuilder = new AdderallBuilder("MagicWindow", [
  // First item 'id' is an uint32 int
  {
    name: 'id',
    type: 'uint32',
  },
  // Second item 'name' is a string of maximal 24 characters
  {
    name: 'name',
    type: 'string',
    length: 24
  },
])

// Set object identifier id unique to this type of object (optional)
magicWindowBuilder.id = 0xC4F3F00D;

// Build generated code
const magicWindowCode = magicWindowBuilder.build();
console.log('JavaScript class definition MagicWindow:');
console.log(magicWindowCode);

// execute generated code
eval('MagicWindow = ' + magicWindowCode);

// Create a new array buffer that can just fit 1 MagicWindow
let ab = new ArrayBuffer(MagicWindow.length);

// Create 2 MagicWindow's on the same position
let z = new MagicWindow(ab, 0);
let x = new MagicWindow(ab, 0);

// Apply on 1 object
z.id = 12;

// Result on other :D
console.log(x.id); // Will print 12
```
