#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create image
width = 1200
height = 630
image = Image.new('RGB', (width, height))
draw = ImageDraw.Draw(image)

# Create gradient background (simulate with vertical bands)
for y in range(height):
    # Interpolate between #8B5CF6 and #6D28D9
    r = int(139 + (109 - 139) * y / height)
    g = int(92 + (40 - 92) * y / height)
    b = int(246 + (217 - 246) * y / height)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# Add subtle pattern overlay (dots)
for x in range(20, width, 40):
    for y in range(20, height, 40):
        draw.ellipse([x-1, y-1, x+1, y+1], fill=(255, 255, 255, 13))

# Draw icon background
icon_x, icon_y = 440, 140
icon_size = 120
draw.rounded_rectangle(
    [icon_x, icon_y, icon_x + icon_size, icon_y + icon_size],
    radius=24,
    fill=(255, 255, 255, 38)
)

# Draw cascade steps
# Step 1 (smallest)
draw.rounded_rectangle(
    [icon_x + 20, icon_y + 20, icon_x + 44, icon_y + 44],
    radius=4,
    fill=(255, 255, 255, 242)
)

# Step 2 (medium)
draw.rounded_rectangle(
    [icon_x + 48, icon_y + 48, icon_x + 78, icon_y + 72],
    radius=4,
    fill=(255, 255, 255, 217)
)

# Step 3 (largest)
draw.rounded_rectangle(
    [icon_x + 70, icon_y + 72, icon_x + 104, icon_y + 96],
    radius=4,
    fill=(255, 255, 255, 191)
)

# Try to load a system font, fall back if not available
try:
    title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 72)
    tagline_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 32)
    badge_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 18)
except:
    try:
        title_font = ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", 72)
        tagline_font = ImageFont.truetype("/Library/Fonts/Arial.ttf", 32)
        badge_font = ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", 18)
    except:
        title_font = ImageFont.load_default()
        tagline_font = ImageFont.load_default()
        badge_font = ImageFont.load_default()

# Draw app name
title_text = "Cascade"
title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
title_width = title_bbox[2] - title_bbox[0]
draw.text((width/2 - title_width/2, 280), title_text, fill='white', font=title_font)

# Draw tagline
tagline_text = "Privacy-First Task Management"
tagline_bbox = draw.textbbox((0, 0), tagline_text, font=tagline_font)
tagline_width = tagline_bbox[2] - tagline_bbox[0]
draw.text((width/2 - tagline_width/2, 360), tagline_text, fill=(255, 255, 255, 230), font=tagline_font)

# Draw feature badges
badges = [
    {"text": "🔒 Private", "x": 300},
    {"text": "📋 Kanban", "x": 460},
    {"text": "♿ A11y", "x": 620},
    {"text": "⚡ Fast", "x": 780}
]

badge_y = 450
badge_height = 48

for badge in badges:
    # Badge background
    draw.rounded_rectangle(
        [badge["x"], badge_y, badge["x"] + 140, badge_y + badge_height],
        radius=24,
        fill=(255, 255, 255, 51)
    )

    # Badge text
    text_bbox = draw.textbbox((0, 0), badge["text"], font=badge_font)
    text_width = text_bbox[2] - text_bbox[0]
    draw.text((badge["x"] + 70 - text_width/2, badge_y + 15), badge["text"], fill='white', font=badge_font)

# Save image
output_path = '/Users/vinnycarpenter/Projects/kanban-todos/public/images/og-image.png'
image.save(output_path, 'PNG', optimize=True)
print(f'OG image generated successfully at {output_path}')
