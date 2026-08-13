import os
import glob

target = 'Mariam Engineering Services &amp; Co'
replacement = 'Mariam Engineering<br>Services &amp; Consultants'

directory = r'c:\Users\Sunith K\OneDrive\Documents\projects\mesc'
for filepath in glob.glob(os.path.join(directory, '*.html')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if target in content:
        content = content.replace(target, replacement)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")
