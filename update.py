import os
import glob

for filepath in glob.glob("*.html"):
    filename = os.path.basename(filepath)
    if filename in ["index.html", "contact-us.html"]:
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    if 'hero--inner' in content and 'Contact Us <span class="arw">' not in content:
        # replace the specific HTML chunk
        search_str = '  </div>\n  <div class="hero-marks"'
        replace_str = '    <div class="hero-actions" data-hero-fade style="margin-top:2rem"><a class="btn" href="contact-us.html">Contact Us <span class="arw">&rarr;</span></a></div>\n  </div>\n  <div class="hero-marks"'
        if search_str in content:
            new_content = content.replace(search_str, replace_str)
            with open(filepath, "w", encoding="utf-8", newline='\n') as f:
                f.write(new_content)
            print(f"Updated {filename}")
