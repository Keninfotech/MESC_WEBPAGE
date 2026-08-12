import os
import re

files = [
    "healthcare-planning.html",
    "operation-theatres.html",
    "healthcare-designing.html",
    "healthcare-engineering.html",
    "project-management.html",
    "mgps-engineering.html",
    "mep-project-management.html",
    "clean-room-projects.html",
    "turnkey-projects.html",
    "facility-management.html",
    "ac-and-ventilation-systems.html",
    "elv-and-it-systems.html"
]

pattern = re.compile(r'<section class="section">(?:(?!</section>).)*?Step into MESC(?:(?!</section>).)*?</section>', re.DOTALL | re.IGNORECASE)

for filename in files:
    filepath = os.path.join(r"c:\Users\Sunith K\OneDrive\Documents\projects\mesc", filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub('', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Replaced in {filename}")
    else:
        print(f"Not found in {filename}")
