const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (/\.(ts|tsx)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const convertedLines = lines.map(line => {
        if (line.trim() === '') return line;
        const match = line.match(/^( +)/);
        if (!match) return line;
        const spaces = match[1].length;
        if (spaces % 2 !== 0) return line; // skip if odd number of spaces
        const indent = spaces / 2;
        const newSpaces = ' '.repeat(indent * 4);
        return newSpaces + line.substring(spaces);
      });
      fs.writeFileSync(fullPath, convertedLines.join('\n'));
      console.log('Converted: ' + fullPath);
    }
  }
}

processDir('src');
console.log('Done!');
