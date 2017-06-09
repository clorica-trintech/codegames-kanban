import * as Fs from 'fs';

const data = require('../src/backend/public/data.json');

const set = new Set();

for (const item of data) {
  set.add(item.doneStatus);
}
console.log(`set >>> ${require('util').inspect(set)}`)
