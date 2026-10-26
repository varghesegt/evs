import os
import math
from PIL import Image, ImageDraw, ImageFont

WIDTH = 2000
HEIGHT = 2600
BG_COLOR = (255, 255, 255)

FONT_REGULAR_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/segoeuib.ttf"
FONT_ITALIC_PATH = "C:/Windows/Fonts/segoeuii.ttf"

font_sheet = ImageFont.truetype(FONT_BOLD_PATH, 28)
font_title = ImageFont.truetype(FONT_BOLD_PATH, 32)
font_field = ImageFont.truetype(FONT_ITALIC_PATH, 18)
font_box_title = ImageFont.truetype(FONT_BOLD_PATH, 22)
font_box_text = ImageFont.truetype(FONT_REGULAR_PATH, 17)
font_decision = ImageFont.truetype(FONT_BOLD_PATH, 19)
font_badge = ImageFont.truetype(FONT_BOLD_PATH, 17)

C_BLACK = (0, 0, 0)
C_WHITE = (255, 255, 255)
C_GRAY = (242, 242, 242)

def draw_header(draw, fig_num, sheet, title, field):
    draw.rectangle([20, 20, WIDTH - 20, HEIGHT - 20], outline=C_BLACK, width=3)
    draw.line([(20, 110), (WIDTH - 20, 110)], fill=C_BLACK, width=2)
    draw.text((45, 35), fig_num, font=font_sheet, fill=C_BLACK)
    draw.text((WIDTH - 240, 35), sheet, font=font_sheet, fill=C_BLACK)
    
    bbox = draw.textbbox((0, 0), title, font=font_title)
    draw.text(((WIDTH - (bbox[2] - bbox[0])) // 2, 32), title, font=font_title, fill=C_BLACK)
    
    bbox_f = draw.textbbox((0, 0), field, font=font_field)
    draw.text(((WIDTH - (bbox_f[2] - bbox_f[0])) // 2, 75), field, font=font_field, fill=C_BLACK)

def draw_box(draw, cx, cy, w, h, title, lines, is_double=False, fill=C_WHITE):
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = cx + w // 2
    y1 = cy + h // 2
    draw.rectangle([x0, y0, x1, y1], fill=fill, outline=C_BLACK, width=3)
    if is_double:
        draw.rectangle([x0+4, y0+4, x1-4, y1-4], fill=fill, outline=C_BLACK, width=2)
    
    cy_text = y0 + 12
    bbox = draw.textbbox((0, 0), title, font=font_box_title)
    draw.text((cx - (bbox[2] - bbox[0]) // 2, cy_text), title, font=font_box_title, fill=C_BLACK)
    cy_text += (bbox[3] - bbox[1]) + 6
    draw.line([(x0 + 15, cy_text), (x1 - 15, cy_text)], fill=C_BLACK, width=1)
    cy_text += 8
    
    for l in lines:
        bbox_l = draw.textbbox((0, 0), l, font=font_box_text)
        draw.text((cx - (bbox_l[2] - bbox_l[0]) // 2, cy_text), l, font=font_box_text, fill=C_BLACK)
        cy_text += (bbox_l[3] - bbox_l[1]) + 4

def draw_diamond(draw, cx, cy, w, h, lines):
    pts = [(cx, cy - h // 2), (cx + w // 2, cy), (cx, cy + h // 2), (cx - w // 2, cy)]
    draw.polygon(pts, fill=C_WHITE, outline=C_BLACK)
    for i in range(len(pts)):
        draw.line([pts[i], pts[(i + 1) % len(pts)]], fill=C_BLACK, width=4)
        
    total_h = 0
    bboxes = []
    for l in lines:
        b = draw.textbbox((0, 0), l, font=font_decision)
        bboxes.append(b)
        total_h += (b[3] - b[1]) + 4
    total_h -= 4
    
    sy = cy - total_h // 2
    for idx, l in enumerate(lines):
        b = bboxes[idx]
        draw.text((cx - (b[2] - b[0]) // 2, sy), l, font=font_decision, fill=C_BLACK)
        sy += (b[3] - b[1]) + 4

def draw_arrow(draw, start, end, width=3):
    x0, y0 = start
    x1, y1 = end
    draw.line([(x0, y0), (x1, y1)], fill=C_BLACK, width=width)
    dx = x1 - x0
    dy = y1 - y0
    angle = math.atan2(dy, dx)
    p1 = (x1 - 14 * math.cos(angle - math.pi / 6), y1 - 14 * math.sin(angle - math.pi / 6))
    p2 = (x1 - 14 * math.cos(angle + math.pi / 6), y1 - 14 * math.sin(angle + math.pi / 6))
    draw.polygon([(x1, y1), p1, p2], fill=C_BLACK)

def draw_badge(draw, cx, cy, text):
    b = draw.textbbox((0, 0), text, font=font_badge)
    bw = (b[2] - b[0]) + 16
    bh = (b[3] - b[1]) + 8
    draw.rectangle([cx - bw // 2, cy - bh // 2, cx + bw // 2, cy + bh // 2], fill=C_WHITE, outline=C_BLACK, width=2)
    draw.text((cx - (b[2] - b[0]) // 2, cy - (b[3] - b[1]) // 2 - 1), text, font=font_badge, fill=C_BLACK)

def draw_terminal(draw, cx, cy, w, h, text):
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = cx + w // 2
    y1 = cy + h // 2
    draw.rounded_rectangle([x0, y0, x1, y1], radius=h//2, fill=C_GRAY, outline=C_BLACK, width=4)
    b = draw.textbbox((0, 0), text, font=font_box_title)
    draw.text((cx - (b[2] - b[0]) // 2, cy - (b[3] - b[1]) // 2), text, font=font_box_title, fill=C_BLACK)

# Generate FIG 1 Image
def render_fig1(path):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    d = ImageDraw.Draw(img)
    draw_header(d, "FIG. 1", "SHEET 1 OF 3", "VOLUMETRIC ESTIMATION, FRESHNESS KINETICS & SAFETY SHUTOFF",
                "Technical Field: Computer vision container volumetrics, bulk density physics, shelf-life decay kinetics, and biohazard diversion.")
    CX = WIDTH // 2
    
    draw_terminal(d, CX, 175, 900, 65, "START: Food Donor Initiates Redistribution Telemetry")
    draw_arrow(d, (CX, 208), (CX, 248))
    
    draw_box(d, CX, 310, 1600, 110, "1. Ingest Batch Telemetry & Dual-Perspective Photography",
             ["• Ingests 12 Food Categories, Prepared Timestamp, Geolocation (Lat/Lng), Packaging Type",
              "• Ingests Dual Orthogonal Images: Top-Surface Boundary View & Side-Profile Fill Level View"])
    draw_arrow(d, (CX, 365), (CX, 410))
    
    draw_diamond(d, CX, 480, 1100, 125, ["Decision D1: Is Donor Profile Registered & Authenticated?", "(Valid HMAC-SHA512 JWT Bearer Token Session?)"])
    draw_arrow(d, (CX, 543), (CX, 595))
    draw_badge(d, CX + 70, 565, "YES")
    
    draw_box(d, CX, 665, 1600, 115, "2. Volumetric Computer Vision & Orthogonal Surface Geometry Extraction",
             ["• Top-surface perimeter analysis extracts effective container cross-sectional area (A_surf)",
              "• Side-view profile computes fluid / food fill percentage height (F_eff %)"])
    draw_arrow(d, (CX, 723), (CX, 770))
    
    draw_diamond(d, CX, 845, 1100, 130, ["Decision D2: Standard Calibrated Receptacle Identified?", "(5L, 10L, 20L, or 50L Standard Catering Container?)"])
    
    # D2 Split
    draw_arrow(d, (CX - 550, 845), (480, 935))
    draw_badge(d, 530, 865, "YES (CALIBRATED)")
    draw_box(d, 480, 995, 780, 105, "2A. Calibrated Geometry Matrix Lookup",
             ["• V_eff = V_container × (Fill% / 100)",
              "• +5% Confidence Boost (89%), Uncertainty: ±8%"])
              
    draw_arrow(d, (CX + 550, 845), (1520, 935))
    draw_badge(d, 1470, 865, "NO (CUSTOM)")
    draw_box(d, 1520, 995, 780, 105, "2B. Monocular Heuristic Approximation",
             ["• Monocular Depth & Bounding Volume",
              "• Baseline 82% Confidence, Uncertainty: ±12%"])
              
    draw_arrow(d, (480, 1048), (CX - 120, 1105))
    draw_arrow(d, (1520, 1048), (CX + 120, 1105))
    
    draw_box(d, CX, 1175, 1600, 115, "3. 12-Category Food Bulk Density Physics Transformation",
             ["• Physical Mass: M = V_eff × ρ (kg) | Density ρ: Rice (0.80), Curry (0.95), Dairy (1.03), Bakery (0.35)",
              "• Portion Yield Calculation: Servings S = M / (Grams_per_serving / 1000) (100g - 250g/portion)"])
    draw_arrow(d, (CX, 1233), (CX, 1280))
    
    draw_box(d, CX, 1345, 1600, 105, "4. Dynamic Perishability Modeling & Safe Shelf-Life Query",
             ["• Query Safe Shelf-Life T_shelf (Dairy 4h, Cooked 5-6h, Bakery 24h, Packaged 168h)",
              "• Elapsed Time: Δt = now() - t_prepared | Remaining Window: t_rem = max(0, T_shelf - Δt)"])
    draw_arrow(d, (CX, 1398), (CX, 1445))
    
    draw_diamond(d, CX, 1525, 1150, 135, ["Decision D3: Critical Freshness Safety Check", "Is Food Safe for Human Consumption? (t_rem > 0)"])
    
    # D3 Split
    draw_arrow(d, (CX - 575, 1525), (480, 1625))
    draw_badge(d, 490, 1550, "NO (SPOILED / BIOHAZARD)")
    draw_box(d, 480, 1705, 800, 130, "4B. BIO-HAZARD SAFETY SHUTOFF & DIVERSION",
             ["• Quarantined: Status locked to BIO_DIVERTED",
              "• Divert to anaerobic composting / biogas depot",
              "• Credit Methane Avoidance: IPCC AR6 GWP 28×",
              "• TERMINAL: Safe Ecological Diversion Complete"], is_double=True, fill=C_GRAY)
              
    draw_arrow(d, (CX + 575, 1525), (1520, 1625))
    draw_badge(d, 1510, 1550, "YES (FRESH & SAFE)")
    draw_box(d, 1520, 1705, 800, 130, "5. Tri-Factor Priority Urgency Optimization",
             ["• S_qty (30%), S_fresh (50%), S_time (20%)",
              "• Composite Urgency: P = 0.30·Qty + 0.50·Fresh + 0.20·Time",
              "• Urgency Score Evaluated: Range [0 - 100]",
              "• Feeds directly into Dispatch Classifier (D4)"])
              
    draw_arrow(d, (1520, 1770), (CX, 1855))
    
    draw_diamond(d, CX, 1935, 1150, 135, ["Decision D4: High-Priority Dispatch Classification", "(Score P >= 75 OR Remaining Safe Window t_rem <= 2h?)"])
    
    # D4 Split
    draw_arrow(d, (CX - 575, 1935), (480, 2035))
    draw_badge(d, 500, 1960, "YES (CRITICAL)")
    draw_box(d, 480, 2105, 800, 110, "5A. Emergency Priority Dispatch Protocol",
             ["• Real-time WebPush/SMS broadcast to shelters",
              "• Elevated 10-minute acceptance SLA window",
              "• Pre-reserve nearest active volunteer vehicle"])
              
    draw_arrow(d, (CX + 575, 1935), (1520, 2035))
    draw_badge(d, 1500, 1960, "NO (STANDARD)")
    draw_box(d, 1520, 2105, 800, 110, "5B. Standard Regional Redistribution Queue",
             ["• Enqueued in regional cluster redistribution pool",
              "• Standard 15-minute acceptance SLA window",
              "• Scheduled multi-batch consolidation tour"])
              
    draw_arrow(d, (480, 2160), (CX - 120, 2235))
    draw_arrow(d, (1520, 2160), (CX + 120, 2235))
    
    draw_terminal(d, CX, 2305, 1200, 70, "HANDOFF TERMINAL: Dispatched to Shelter Allocation Engine (FIG. 2)")
    
    img.save(path, "PNG", dpi=(300, 300))
    print(f"Fig 1 Image generated at {path}")

if __name__ == "__main__":
    render_fig1("c:/Users/Asus/Downloads/evs/flowchart_fig1_readable_bw.png")
