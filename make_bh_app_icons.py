import os
from PIL import Image

logo_path = r'C:\Users\Wagner\.gemini\antigravity\brain\f93141e5-9085-4492-952a-7327ec21603b\.user_uploaded\media__1785426353835.png'
out_dir = r'C:\Users\Wagner\.gemini\antigravity\scratch\lojas-app'

logo = Image.open(logo_path).convert('RGBA')

# Get background yellow color from top-center pixel (inside yellow area)
bg_yellow = logo.getpixel((logo.width // 2, 10))
print('Logo background color:', bg_yellow)

def create_bh_pwa_icon(size, out_path, padding_percent=0.08):
    # Create square canvas with logo yellow background
    canvas = Image.new('RGBA', (size, size), bg_yellow)
    
    # Calculate available size for logo inside canvas
    max_logo_size = int(size * (1.0 - 2 * padding_percent))
    
    lw, lh = logo.size
    aspect = lw / lh
    
    if aspect > 1:
        new_w = max_logo_size
        new_h = int(max_logo_size / aspect)
    else:
        new_h = max_logo_size
        new_w = int(max_logo_size * aspect)
        
    resized_logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Paste resized logo into center
    pos_x = (size - new_w) // 2
    pos_y = (size - new_h) // 2
    
    canvas.paste(resized_logo, (pos_x, pos_y), resized_logo)
    canvas.save(out_path, 'PNG')
    print(f'Sucesso! Criado {out_path} ({size}x{size})')

create_bh_pwa_icon(192, os.path.join(out_dir, 'icon-192.png'))
create_bh_pwa_icon(512, os.path.join(out_dir, 'icon-512.png'))
create_bh_pwa_icon(180, os.path.join(out_dir, 'apple-touch-icon.png'))
create_bh_pwa_icon(64, os.path.join(out_dir, 'favicon.png'))
# Also update logo.png
create_bh_pwa_icon(300, os.path.join(out_dir, 'logo.png'))
