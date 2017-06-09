import * as Fs from 'fs';

const data = require('../src/backend/public/data.json');

const set = new Set();
const sizes = new Set();

for (const item of data) {
  set.add(item.doneStatus);
  sizes.add(Object.keys(item).length);
}
console.log(`set >>> ${require('util').inspect(set)}`)
console.log(`sizes >>> ${require('util').inspect(sizes)}`)
