import os
import re

TARGET_DIR = 'src/app/(app)'
COMPONENTS_DIR = 'src/components'

COLOR_MAP = {
    # Backgrounds -> Surface
    r'#0a0a14': '#0e0e0e',
    r'#121212': '#0e0e0e',
    r'#141428': '#0e0e0e',
    
    # Cards/Containers -> Surface-Container-High
    r'#16162a': '#20201f',
    r'#13132a': '#20201f',
    r'#1a1a30': '#20201f',
    r'#1a1a38': '#20201f',
    r'#1e1e3a': '#20201f',
    r'#1e1b3a': '#20201f',
    
    # Old Purple -> New Primary
    r'#7c3aed': '#c799ff',
    
    # Text colors
    r'#e2e2ff': '#ffffff',
    r'#d0d0f0': '#ffffff',
    r'#6868a0': '#adaaaa',
    r'#5a5a8a': '#adaaaa',
    r'#7878a8': '#adaaaa',
    r'#a0a0c8': '#adaaaa',
    r'#888888': '#adaaaa',
    r'#888': '#adaaaa',
    
    # Borders
    r'#2a2a50': 'rgba(118, 117, 117, 0.15)',
    r'#3a3a60': 'rgba(118, 117, 117, 0.15)',
    
    # In library.tsx Liked Songs box
    r'#FBEAF0': '#131313', # Instead of pink box, dark box
    r'#D4537E': '#c799ff', # Heart color -> Primary
    
    # Modal background #fff -> #20201f
    r"backgroundColor:\s*['\"]#fff['\"]": "backgroundColor: '#20201f'",
    r"backgroundColor:\s*['\"]#ffffff['\"]": "backgroundColor: '#20201f'",
    
    # Input background
    r"backgroundColor:\s*['\"]#131313['\"]": "backgroundColor: '#000000'",
}

def process_dir(directory):
    if not os.path.exists(directory): return
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if need modifications
                new_content = content
                for old_val, new_val in COLOR_MAP.items():
                    # use case-insensitive replacement for hex codes
                    new_content = re.sub(old_val, new_val, new_content, flags=re.IGNORECASE)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")

if __name__ == '__main__':
    process_dir(TARGET_DIR)
    process_dir(COMPONENTS_DIR)
    # Also update any other files if needed
    process_dir('src/app/(auth)')
