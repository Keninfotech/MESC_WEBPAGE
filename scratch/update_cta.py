import glob

files = glob.glob("*.html")
count = 0
for fpath in files:
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if 'style="max-width:20ch"' in content:
        new_content = content.replace(
            'style="max-width:20ch"',
            'style="max-width:35ch; font-size:clamp(1.8rem, 3vw, 2.5rem); line-height:1.2;"'
        )
        if new_content != content:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)
            count += 1

print(f"Updated {count} files.")
