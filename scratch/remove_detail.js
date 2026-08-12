const fs = require('fs');
const glob = require('glob');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const pattern1 = /<li>\s*<button[^>]*>Detail Joinery.*?<\/button>\s*<div class="dropdown">.*?<\/div>\s*<\/li>/gis;
const pattern2 = /<div class="drawer-group">\s*<button[^>]*>Detail Joinery.*?<\/button>\s*<div class="drawer-sub">.*?<\/div>\s*<\/div>/gis;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(pattern1, '');
    newContent = newContent.replace(pattern2, '');
    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`No match found in ${file}`);
    }
});
