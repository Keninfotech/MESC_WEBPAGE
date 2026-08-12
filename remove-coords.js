const fs = require('fs');
const path = require('path');
const dir = '.';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
for (const file of files) {
  const filepath = path.join(dir, file);
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('<span>12.84&deg; N, 77.67&deg; E</span>')) {
    const newContent = content.replace(/<span>12.84&deg; N, 77.67&deg; E<\/span>/g, '');
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log('Updated ' + file);
  }
}
