import os
from PIL import Image, ImageDraw, ImageFont

def make_icon(size, filename):
    # Create image with dark royal blue gradient background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background
    corner_radius = int(size * 0.22)
    
    # Simple gradient effect
    for i in range(size):
        ratio = i / size
        r = int(29 * (1 - ratio) + 37 * ratio)
        g = int(78 * (1 - ratio) + 99 * ratio)
        b = int(216 * (1 - ratio) + 235 * ratio)
        draw.line([(0, i), (size, i)], fill=(r, g, b, 255))
        
    # Mask to rounded rectangle
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=255)
    
    img.putalpha(mask)
    draw = ImageDraw.Draw(img)
    
    # Draw store building icon / graphics
    # Draw roof (triangle)
    margin = size * 0.25
    cx = size / 2
    top_y = size * 0.28
    roof_w = size * 0.44
    roof_h = size * 0.18
    
    roof_pts = [
        (cx, top_y),
        (cx - roof_w / 2, top_y + roof_h),
        (cx + roof_w / 2, top_y + roof_h)
    ]
    draw.polygon(roof_pts, fill=(255, 255, 255, 255))
    
    # Draw store body
    body_y = top_y + roof_h + size * 0.02
    body_w = size * 0.38
    body_h = size * 0.22
    draw.rectangle(
        [cx - body_w / 2, body_y, cx + body_w / 2, body_y + body_h],
        fill=(255, 255, 255, 255)
    )
    
    # Draw door cutout
    door_w = size * 0.12
    door_h = size * 0.14
    draw.rectangle(
        [cx - door_w / 2, body_y + body_h - door_h, cx + door_w / 2, body_y + body_h],
        fill=(29, 78, 216, 255)
    )
    
    # Try drawing text "LOJAS" below store
    try:
        font_size = int(size * 0.14)
        font = ImageFont.truetype("arial.ttf", font_size)
        text = "LOJAS"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        tx = (size - tw) / 2
        ty = body_y + body_h + size * 0.04
        draw.text((tx, ty), text, fill=(255, 255, 255, 255), font=font)
    except Exception:
        pass
        
    img.save(filename, "PNG")
    print(f"Gerado {filename} ({size}x{size})")

out_dir = r"C:\Users\Wagner\.gemini\antigravity\scratch\lojas-app"
make_icon(192, os.path.join(out_dir, "icon-192.png"))
make_icon(512, os.path.join(out_dir, "icon-512.png"))
make_icon(180, os.path.join(out_dir, "apple-touch-icon.png"))
make_icon(64, os.path.join(out_dir, "favicon.png"))
