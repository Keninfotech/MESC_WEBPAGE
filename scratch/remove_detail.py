import os
import re
import glob

# Patterns to match and remove
pattern1 = re.compile(r'<li>\s*<button[^>]*>Detail Joinery.*?</button>\s*<div class="dropdown">.*?</div>\s*</li>', re.DOTALL | re.IGNORECASE)
pattern2 = re.compile(r'<div class="drawer-group">\s*<button[^>]*>Detail Joinery.*?</button>\s*<div class="drawer-sub">.*?</div>\s*</div>', re.DOTALL | re.IGNORECASE)

html_files = glob.glob('*.html')

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern1.sub('', content)
    new_content = pattern2.sub('', new_content)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file}")
    else:
        print(f"No match found in {file}")
