import glob

files = glob.glob("*.html")
count = 0
for fpath in files:
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    if "<span>MESC / BENGALURU</span>" in content:
        new_content = content.replace("<span>MESC / BENGALURU</span>", "<span></span>")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        count += 1
print(f"Updated {count} files.")
