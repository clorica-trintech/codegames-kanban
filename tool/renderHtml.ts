import * as Ejs from 'ejs';
import * as Fs  from 'fs';

const mainTemplate = Fs.readFileSync('src/main.ejs').toString('utf8');
const initializeState = Fs.readFileSync('.build/fixtures.js').toString('utf8');
const libraryScript = Fs.readFileSync('.build/trintechKanban.js').toString('utf8');
const libraryStyles = Fs.readFileSync('src/styles.css').toString('utf8');

const html = Ejs.render(mainTemplate, {
  initializeState,
  libraryScript,
  libraryStyles
});

Fs.writeFileSync('.build/main.html', html);

