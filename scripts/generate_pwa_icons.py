import os
from PIL import Image, ImageDraw, ImageFont

icons_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'icons')
os.makedirs(icons_dir, exist_ok=True)

def generate_icon(size, filename):
    img = Image.new('RGB', (size, size), color=(217, 119, 6)) # amber-600
    draw = ImageDraw.Draw(img)

    # Draw rounded dark background badge in center
    pad = int(size * 0.12)
    inner_box = [pad, pad, size - pad, size - pad]
    draw.rounded_rectangle(inner_box, radius=int(size * 0.18), fill=(180, 83, 9))

    # Draw stylized truck shape
    truck_w = int(size * 0.52)
    truck_h = int(size * 0.32)
    cx = size // 2
    cy = size // 2 - int(size * 0.04)

    # Cargo bed
    cab_w = int(truck_w * 0.35)
    bed_w = truck_w - cab_w
    top = cy - truck_h // 2
    bottom = cy + truck_h // 2
    left = cx - truck_w // 2

    # Draw bed
    draw.rectangle([left, top, left + bed_w - int(size * 0.02), bottom], fill=(255, 255, 255))
    # Draw cab
    draw.rounded_rectangle([left + bed_w, top + int(truck_h * 0.25), left + truck_w, bottom], radius=int(size * 0.04), fill=(255, 255, 255))
    # Cab window
    draw.rectangle([left + bed_w + int(size * 0.03), top + int(truck_h * 0.35), left + truck_w - int(size * 0.03), top + int(truck_h * 0.65)], fill=(180, 83, 9))

    # Wheels
    wheel_r = int(size * 0.065)
    wheel_y = bottom + int(wheel_r * 0.4)
    w1_x = left + int(bed_w * 0.3)
    w2_x = left + int(bed_w * 0.75)
    w3_x = left + bed_w + int(cab_w * 0.5)

    for wx in [w1_x, w2_x, w3_x]:
        draw.ellipse([wx - wheel_r, wheel_y - wheel_r, wx + wheel_r, wheel_y + wheel_r], fill=(30, 41, 59))
        draw.ellipse([wx - wheel_r//2, wheel_y - wheel_r//2, wx + wheel_r//2, wheel_y + wheel_r//2], fill=(241, 245, 249))

    target_path = os.path.join(icons_dir, filename)
    img.save(target_path, 'PNG')
    print(f"Generated {size}x{size} icon: {target_path}")

generate_icon(192, 'icon-192.png')
generate_icon(512, 'icon-512.png')
generate_icon(180, 'apple-touch-icon.png')
print("All PWA icons generated successfully!")
