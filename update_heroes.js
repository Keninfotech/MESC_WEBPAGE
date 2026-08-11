const fs = require('fs');
const path = require('path');
const dir = '.';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.html') && file !== 'index.html' && file !== 'contact-us.html') {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('hero--inner') && !content.includes('Contact Us <span class="arw">')) {
      content = content.replace(
        /\s*<\/div>\s*<div class="hero-marks"/,
        `\n    <div class="hero-actions" data-hero-fade style="margin-top:2rem"><a class="btn" href="contact-us.html">Contact Us <span class="arw">&rarr;</span></a></div>\n  </div>\n  <div class="hero-marks"`
      );
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
