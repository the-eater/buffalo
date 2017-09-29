# Buffalo

[![pipeline status](https://gl.zt.je/eater/buffalo/badges/master/pipeline.svg)](https://gl.zt.je/eater/buffalo/commits/master) [![coverage report](https://gl.zt.je/eater/buffalo/badges/master/coverage.svg)](https://gl.zt.je/eater/buffalo/commits/master)

Memory management like it's C

## Usage

```javascript
const { BuffaloGenerator } = require('./index');
const { TextDecoder, TextEncoder } = require('text-encoding');

// Create a new definition of a class/object
let magicWindowGenerator = new BuffaloGenerator("MagicWindow", [
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
magicWindowGenerator.id = 0xC4F3F00D;

// Generate code
const magicWindowCode = magicWindowGenerator.generate();
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

## Why would this be useful?

Currently the biggest bottleneck in using WebWorkers is communicating with them.
Our current communication options are passing plain objects, which is slow because it will copy them, or passing `Transferable` objects, which is really fast but invalidates the `Transferable` at the sender side, meaning you're constantly reinitializing it. [NB: In what use cases is this an issue? Give some concrete examples and paint a broad picture]

Since recently
[`SharedArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
exists, which is *super* fast, as this just shares the memory space between 2 threads, but a `SharedArrayBuffer` is an array of *numbers* and we want objects!

This is exactly what Buffalo tries to solve: By disguising an `ArrayBuffer` as an object instance, it may feel like you're just editing a simple object, but you're actually mutating the `ArrayBuffer` behind it.

The only problem we're currently facing is locking *efficiently*. Inside the WebWorkers you can use `Atomics.wait` to lock, but these are disallowed in the main / window thread. You could in this case fallback to a `while(1) { ... }` but I would like to discourage that. Still even with these solutions, locking is still not user friendly.

## Planned

### Memory manager

An object that decides where objects should be instantiated and whether or not the current memory space needs to be grown. Would allow for dynamically sized objects. [NB: And what you have now would not? Why not?]

### Pointers

C-style pointers. You know the drill.

### Dyanmic Arrays

Dynamically growing array, in the C# List style (that grows a backing array by N items as necessary). Will probably be strongly typed.

### Shared memory manager

A memory manager that works and communicatates over multiple websockets.

### Locking

Necessary for async stuff.
