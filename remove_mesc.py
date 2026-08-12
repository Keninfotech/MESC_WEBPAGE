import os
import glob

def remove_mesc_link():
    files = glob.glob("*.html")
    search_str = '<a href="mesc-application.html">MESC Application</a>'
    
    for filepath in files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        if search_str in content:
            new_content = content.replace(search_str, '')
            with open(filepath, "w", encoding="utf-8", newline='\n') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

if __name__ == "__main__":
    remove_mesc_link()
