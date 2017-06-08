import * as Fs from 'fs';

const kanbanScript = Fs.readFileSync('.build/frontend/kanban.js').toString('utf8');
const searchScript = Fs.readFileSync('.build/frontend/searcher.js').toString('utf8');
Fs.writeFileSync('src/backend/public/app.js', searchScript + ';\n' + kanbanScript);

