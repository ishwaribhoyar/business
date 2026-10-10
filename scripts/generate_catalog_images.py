import os
from PIL import Image, ImageDraw, ImageFont

# Define output directories
base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(base_dir, ".."))
categories_dir = os.path.join(project_root, "frontend", "public", "images", "categories")
variants_dir = os.path.join(project_root, "frontend", "public", "images", "variants")

os.makedirs(categories_dir, exist_ok=True)
os.makedirs(variants_dir, exist_ok=True)

# Catalog specification
categories = [
    {
        "filename": "sand.jpg",
        "title": "CONSTRUCTION SAND",
        "subtitle": "River Sand, M-Sand & Plaster Sand",
        "bg_top": (230, 184, 112),
        "bg_bottom": (196, 145, 68),
        "badge": "RIVER & VSI CRUSHER",
    },
    {
        "filename": "bricks.jpg",
        "title": "BUILDING BRICKS",
        "subtitle": "Red Clay Kiln & Fly Ash Bricks",
        "bg_top": (184, 74, 57),
        "bg_bottom": (140, 45, 31),
        "badge": "STANDARD & MASONRY",
    },
    {
        "filename": "aggregate.jpg",
        "title": "BLACK STONE AGGREGATE",
        "subtitle": "10mm, 20mm, 40mm & GSB Mix",
        "bg_top": (71, 85, 105),
        "bg_bottom": (30, 41, 59),
        "badge": "BASALT CRUSHER METAL",
    },
    {
        "filename": "murum.jpg",
        "title": "MURUM FILLING SOIL",
        "subtitle": "Yellow & Hard Red Bharda",
        "bg_top": (217, 119, 6),
        "bg_bottom": (161, 98, 7),
        "badge": "PLINTH & ROAD BED",
    },
]

variants = [
    # Sand
    {
        "filename": "river-sand.jpg",
        "title": "RIVER SAND",
        "subtitle": "Double Washed Natural River Bed Sand",
        "bg_top": (235, 195, 125),
        "bg_bottom": (205, 155, 75),
        "unit": "Brass",
        "category": "Sand",
    },
    {
        "filename": "m-sand.jpg",
        "title": "M-SAND (MANUFACTURED)",
        "subtitle": "Engineered Cubical VSI Sand for RCC",
        "bg_top": (215, 175, 115),
        "bg_bottom": (175, 130, 65),
        "unit": "Brass",
        "category": "Sand",
    },
    {
        "filename": "stone-dust.jpg",
        "title": "CRUSHED STONE DUST",
        "subtitle": "Screened Quarry Dust for Pavers & Leveling",
        "bg_top": (195, 165, 130),
        "bg_bottom": (155, 125, 95),
        "unit": "Brass",
        "category": "Sand",
    },

    # Bricks
    {
        "filename": "red-clay-bricks.jpg",
        "title": "RED CLAY BRICKS",
        "subtitle": "Kiln-Burnt High Strength Masonry Bricks",
        "bg_top": (188, 75, 58),
        "bg_bottom": (138, 42, 28),
        "unit": "Pieces",
        "category": "Bricks",
    },
    {
        "filename": "fly-ash-bricks.jpg",
        "title": "FLY ASH BRICKS",
        "subtitle": "Hydraulically Pressed High Density Bricks",
        "bg_top": (100, 116, 139),
        "bg_bottom": (51, 65, 85),
        "unit": "Pieces",
        "category": "Bricks",
    },

    # Black Stone / Aggregate
    {
        "filename": "20mm-aggregate.jpg",
        "title": "20MM BLACK METAL",
        "subtitle": "Crushed Basalt Coarse Aggregate for RCC",
        "bg_top": (75, 85, 99),
        "bg_bottom": (31, 41, 55),
        "unit": "Brass",
        "category": "Aggregate",
    },
    {
        "filename": "10mm-aggregate.jpg",
        "title": "10MM BLACK METAL",
        "subtitle": "Fine Basalt Crushed Metal for RCC & Precast",
        "bg_top": (85, 95, 110),
        "bg_bottom": (40, 50, 65),
        "unit": "Brass",
        "category": "Aggregate",
    },
    {
        "filename": "40mm-aggregate.jpg",
        "title": "40MM HEAVY METAL",
        "subtitle": "Heavy Basalt Aggregate for Foundation & PCC",
        "bg_top": (65, 75, 90),
        "bg_bottom": (25, 33, 45),
        "unit": "Brass",
        "category": "Aggregate",
    },
    {
        "filename": "gsb-crushed-mix.jpg",
        "title": "GSB / WET MIX",
        "subtitle": "Graded Sub-Base Aggregate for Site Roads",
        "bg_top": (107, 114, 128),
        "bg_bottom": (55, 65, 81),
        "unit": "Brass",
        "category": "Aggregate",
    },

    # Murum
    {
        "filename": "yellow-murum.jpg",
        "title": "YELLOW MURUM",
        "subtitle": "Natural Plinth & Foundation Packing Soil",
        "bg_top": (220, 130, 15),
        "bg_bottom": (165, 90, 5),
        "unit": "Brass",
        "category": "Murum",
    },
    {
        "filename": "red-bharda-murum.jpg",
        "title": "RED BHARDA MURUM",
        "subtitle": "Gravel Rocky Soil for Road Subgrade & Fill",
        "bg_top": (160, 55, 25),
        "bg_bottom": (115, 30, 10),
        "unit": "Brass",
        "category": "Murum",
    },
]

WIDTH, HEIGHT = 640, 400

def create_gradient_image(info, output_path, is_variant=False):
    img = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    r1, g1, b1 = info["bg_top"]
    r2, g2, b2 = info["bg_bottom"]

    # Smooth vertical gradient
    for y in range(HEIGHT):
        ratio = y / float(HEIGHT)
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Add stylish overlay card / border
    margin = 16
    draw.rounded_rectangle(
        [(margin, margin), (WIDTH - margin, HEIGHT - margin)],
        radius=14,
        outline=(255, 255, 255, 90),
        width=2,
    )

    # Top Brand Header
    draw.text((36, 32), "NAGPUR MATERIALS MARKETPLACE", fill=(255, 255, 255))
    draw.line([(36, 52), (180, 52)], fill=(255, 255, 255), width=2)

    # Category / Badge tag
    badge_text = info.get("badge") or f"CATEGORY: {info.get('category', '').upper()}"
    badge_w = len(badge_text) * 8 + 20
    draw.rounded_rectangle(
        [(36, 70), (36 + badge_w, 94)],
        radius=6,
        fill=(0, 0, 0, 120),
        outline=(255, 255, 255),
        width=1,
    )
    draw.text((46, 75), badge_text, fill=(255, 255, 255))

    # Center Material Title
    title = info["title"]
    draw.text((36, 170), title, fill=(255, 255, 255))

    # Subtitle / Engineering Description
    subtitle = info["subtitle"]
    draw.text((36, 210), subtitle, fill=(240, 240, 240))

    # Bottom Delivery Info Bar
    draw.rounded_rectangle(
        [(36, HEIGHT - 76), (WIDTH - 36, HEIGHT - 36)],
        radius=8,
        fill=(255, 255, 255),
    )

    if is_variant:
        bottom_left = f"Standard Unit: {info['unit']}  |  Direct Delivery Across Nagpur"
    else:
        bottom_left = "Quality Verified  |  Transparent Tipper Logistics"

    draw.text((50, HEIGHT - 64), bottom_left, fill=(20, 30, 45))
    draw.text((WIDTH - 170, HEIGHT - 64), "★ VERIFIED TRUCK", fill=(180, 80, 20))

    # Save progressive optimized JPEG
    img.save(output_path, "JPEG", quality=92, optimize=True)
    print(f"Generated: {output_path}")

# Generate Category Images
for cat in categories:
    out = os.path.join(categories_dir, cat["filename"])
    create_gradient_image(cat, out, is_variant=False)

# Generate Variant Images
for var in variants:
    out = os.path.join(variants_dir, var["filename"])
    create_gradient_image(var, out, is_variant=True)

print("All 15 catalog images successfully generated!")
