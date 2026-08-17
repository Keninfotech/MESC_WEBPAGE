import sys

file_path = r'c:\Users\Sunith K\OneDrive\Documents\projects\mesc\assets\css\styles.css'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The user's code ends at line 3195
# My correct tab css starts at line 3392
# So I want to keep lines 0 to 3195, and lines 3391 to end.

clean_lines = lines[:3196] + ['\n'] + lines[3391:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(clean_lines)

print("styles.css cleaned successfully.")
